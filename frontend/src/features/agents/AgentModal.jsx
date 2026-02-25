import React, { useState, useEffect } from 'react';

export default function AgentModal({ isOpen, onClose, onSave, initialData = null, categories = [] }) {
    const [formData, setFormData] = useState({
        name: '',
        role: '',
        personality: '',
        expertise: '',
        category: '',
        instructions: '',
        knowledge: '',
        restrict_knowledge: false
    });
    const [isExtracting, setIsExtracting] = useState(false);
    const [extractError, setExtractError] = useState('');
    const [isExtractingKnowledge, setIsExtractingKnowledge] = useState(false);
    const [extractKnowledgeError, setExtractKnowledgeError] = useState('');
    const [showPreview, setShowPreview] = useState(false);
    const [copied, setCopied] = useState(false);

    const buildPreviewPrompt = () => {
        let restrictBlock = '';
        if (formData.restrict_knowledge) {
            restrictBlock = `\n\nCRITICAL RESTRICTION: You must ONLY answer based on the knowledge provided above in YOUR KNOWLEDGE BASE.\nIf the user asks something not covered by your knowledge base, politely respond that you don't have information on that topic.\nDo NOT use any external or general knowledge beyond what is explicitly provided above.`;
        }

        return `SYSTEM FORMATTING RULES:\n1. When presenting data, use Markdown Tables.\n2. When quoting, use Markdown Blockquotes (> quote).\n3. Use Bold (**text**) for key terms.\n\n---\n\nYOU ARE AN AI AGENT WITH THE FOLLOWING PROFILE:\nNAME: ${formData.name || '(not set)'}\nROLE: ${formData.role || '(not set)'}\nPERSONALITY: ${formData.personality || '(not set)'}\nEXPERTISE: ${formData.expertise || '(not set)'}\n\nYOUR INSTRUCTIONS:\n${formData.instructions || '(none)'}\n\nYOUR KNOWLEDGE BASE:\n${formData.knowledge || '(none)'}${restrictBlock}`;
    };

    const handleCopyPrompt = () => {
        navigator.clipboard.writeText(buildPreviewPrompt());
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    useEffect(() => {
        if (initialData) {
            setFormData(initialData);
        } else {
            setFormData({
                name: '',
                role: '',
                personality: '',
                expertise: '',
                category: '',
                instructions: '',
                knowledge: '',
                restrict_knowledge: false
            });
        }
    }, [initialData, isOpen]);

    if (!isOpen) return null;

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileUpload = async (e) => {
        const files = Array.from(e.target.files);
        if (!files.length) return;

        setIsExtracting(true);
        setExtractError('');
        
        let extractedTexts = [];

        try {
            for (const file of files) {
                const formData = new FormData();
                formData.append('file', file);

                const response = await fetch('http://localhost:8004/api/agents/extract-text', {
                    method: 'POST',
                    body: formData,
                });

                if (!response.ok) {
                    throw new Error(`Failed to extract text from ${file.name}`);
                }

                const data = await response.json();
                if (data.text) {
                    extractedTexts.push(`\n--- Extracted from ${file.name} ---\n${data.text}\n--------------------------`);
                }
            }

            if (extractedTexts.length > 0) {
                setFormData(prev => ({
                    ...prev,
                    instructions: prev.instructions + (prev.instructions ? '\n' : '') + extractedTexts.join('\n')
                }));
            }
        } catch (err) {
            console.error(err);
            setExtractError('Failed to extract text from some files.');
        } finally {
            setIsExtracting(false);
            e.target.value = ''; // Reset input so same file can be selected again
        }
    };

    const handleKnowledgeFileUpload = async (e) => {
        const files = Array.from(e.target.files);
        if (!files.length) return;

        setIsExtractingKnowledge(true);
        setExtractKnowledgeError('');

        let extractedTexts = [];

        try {
            for (const file of files) {
                const fd = new FormData();
                fd.append('file', file);

                const response = await fetch('http://localhost:8004/api/agents/extract-text', {
                    method: 'POST',
                    body: fd,
                });

                if (!response.ok) {
                    throw new Error(`Failed to extract text from ${file.name}`);
                }

                const data = await response.json();
                if (data.text) {
                    extractedTexts.push(`\n--- Extracted from ${file.name} ---\n${data.text}\n--------------------------`);
                }
            }

            if (extractedTexts.length > 0) {
                setFormData(prev => ({
                    ...prev,
                    knowledge: prev.knowledge + (prev.knowledge ? '\n' : '') + extractedTexts.join('\n')
                }));
            }
        } catch (err) {
            console.error(err);
            setExtractKnowledgeError('Failed to extract text from some files.');
        } finally {
            setIsExtractingKnowledge(false);
            e.target.value = '';
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-[#1a1a1a] border border-gray-800 rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto flex flex-col">
                <div className="flex items-center justify-between p-4 border-b border-gray-800">
                    <h2 className="text-lg font-bold text-white">
                        {initialData ? 'Edit Agent' : 'Create New Agent'}
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition">✕</button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4 flex-1 overflow-y-auto">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-gray-400 mb-1">Name</label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                required
                                className="w-full bg-[#111] border border-gray-700 rounded px-3 py-2 text-sm text-white focus:border-accent focus:outline-none"
                                placeholder="e.g. Code Master"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-400 mb-1">Category</label>
                            <input
                                list="categories"
                                name="category"
                                value={formData.category}
                                onChange={handleChange}
                                className="w-full bg-[#111] border border-gray-700 rounded px-3 py-2 text-sm text-white focus:border-accent focus:outline-none"
                                placeholder="Select or type new..."
                            />
                            <datalist id="categories">
                                {categories.map(c => <option key={c} value={c} />)}
                            </datalist>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-gray-400 mb-1">Role</label>
                            <input
                                type="text"
                                name="role"
                                value={formData.role}
                                onChange={handleChange}
                                className="w-full bg-[#111] border border-gray-700 rounded px-3 py-2 text-sm text-white focus:border-accent focus:outline-none"
                                placeholder="e.g. Senior Developer"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-400 mb-1">Personality</label>
                            <input
                                type="text"
                                name="personality"
                                value={formData.personality}
                                onChange={handleChange}
                                className="w-full bg-[#111] border border-gray-700 rounded px-3 py-2 text-sm text-white focus:border-accent focus:outline-none"
                                placeholder="e.g. Precise, Sarcastic"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-gray-400 mb-1">Expertise</label>
                        <input
                            type="text"
                            name="expertise"
                            value={formData.expertise}
                            onChange={handleChange}
                            className="w-full bg-[#111] border border-gray-700 rounded px-3 py-2 text-sm text-white focus:border-accent focus:outline-none"
                            placeholder="e.g. Python, React, TDD"
                        />
                    </div>

                    <div>
                        <div className="flex items-center justify-between mb-1">
                            <label className="block text-xs font-medium text-gray-400">
                                Instructions <span className="text-gray-600">(Use @ to reference)</span>
                            </label>
                            <div className="flex items-center gap-2">
                                {isExtracting && <span className="text-xs text-accent animate-pulse">Extracting text...</span>}
                                {extractError && <span className="text-xs text-red-500">{extractError}</span>}
                                <label className="cursor-pointer text-xs bg-[#222] hover:bg-gray-800 border border-gray-700 text-gray-300 px-2 py-1 rounded flex items-center gap-1 transition-colors">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
                                    Upload Docs
                                    <input 
                                        type="file" 
                                        multiple 
                                        accept=".pdf,.txt,.png,.jpg,.jpeg" 
                                        className="hidden" 
                                        onChange={handleFileUpload}
                                        disabled={isExtracting}
                                    />
                                </label>
                            </div>
                        </div>
                        <textarea
                            name="instructions"
                            value={formData.instructions}
                            onChange={handleChange}
                            rows={6}
                            className="w-full bg-[#111] border border-gray-700 rounded px-3 py-2 text-sm text-white focus:border-accent focus:outline-none font-mono resize-y"
                            placeholder="System instructions for this agent... (you can also upload files to append instructions)"
                        />
                    </div>

                    <div>
                        <div className="flex items-center justify-between mb-1">
                            <label className="block text-xs font-medium text-gray-400">
                                Knowledge <span className="text-gray-600">(Use @ to reference)</span>
                            </label>
                            <div className="flex items-center gap-2">
                                {isExtractingKnowledge && <span className="text-xs text-accent animate-pulse">Extracting text...</span>}
                                {extractKnowledgeError && <span className="text-xs text-red-500">{extractKnowledgeError}</span>}
                                <label className="cursor-pointer text-xs bg-[#222] hover:bg-gray-800 border border-gray-700 text-gray-300 px-2 py-1 rounded flex items-center gap-1 transition-colors">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
                                    Upload Docs
                                    <input
                                        type="file"
                                        multiple
                                        accept=".pdf,.txt,.png,.jpg,.jpeg"
                                        className="hidden"
                                        onChange={handleKnowledgeFileUpload}
                                        disabled={isExtractingKnowledge}
                                    />
                                </label>
                            </div>
                        </div>
                        <textarea
                            name="knowledge"
                            value={formData.knowledge}
                            onChange={handleChange}
                            rows={3}
                            className="w-full bg-[#111] border border-gray-700 rounded px-3 py-2 text-sm text-white focus:border-accent focus:outline-none font-mono resize-y"
                            placeholder="Specific knowledge base references... (you can also upload files to append knowledge)"
                        />
                        <div className="flex items-center gap-2 mt-2">
                            <button
                                type="button"
                                onClick={() => setFormData(prev => ({ ...prev, restrict_knowledge: !prev.restrict_knowledge }))}
                                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-200 ${
                                    formData.restrict_knowledge ? 'bg-accent' : 'bg-gray-700'
                                }`}
                            >
                                <span
                                    className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform duration-200 ${
                                        formData.restrict_knowledge ? 'translate-x-[18px]' : 'translate-x-[3px]'
                                    }`}
                                />
                            </button>
                            <span className="text-xs text-gray-400">
                                Restrict Knowledge
                                <span className="text-gray-600 ml-1">(Agent will only use the knowledge above)</span>
                            </span>
                        </div>
                    </div>

                    <div className="flex justify-between items-center pt-4 border-t border-gray-800">
                        <button
                            type="button"
                            onClick={() => { setCopied(false); setShowPreview(true); }}
                            className="flex items-center gap-1.5 px-3 py-2 text-xs text-gray-400 hover:text-white hover:bg-gray-800 border border-gray-700 rounded transition-colors"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                            Preview Prompt
                        </button>
                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-800 rounded transition"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="px-4 py-2 text-sm bg-accent text-white rounded hover:bg-accent/90 transition shadow-lg"
                            >
                                {initialData ? 'Save Changes' : 'Create Agent'}
                            </button>
                        </div>
                    </div>
                </form>
            </div>

            {/* System Prompt Preview Overlay */}
            {showPreview && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="bg-[#1a1a1a] border border-gray-800 rounded-lg shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">
                        <div className="flex items-center justify-between p-4 border-b border-gray-800">
                            <div className="flex items-center gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                                <h3 className="text-sm font-bold text-white">System Prompt Preview</h3>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={handleCopyPrompt}
                                    className="flex items-center gap-1 px-2 py-1 text-xs text-gray-400 hover:text-white hover:bg-gray-800 border border-gray-700 rounded transition-colors"
                                >
                                    {copied ? (
                                        <>
                                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-400"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                            <span className="text-green-400">Copied!</span>
                                        </>
                                    ) : (
                                        <>
                                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                                            Copy
                                        </>
                                    )}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowPreview(false)}
                                    className="text-gray-400 hover:text-white transition"
                                >
                                    ✕
                                </button>
                            </div>
                        </div>
                        <div className="p-4 overflow-y-auto flex-1">
                            <pre className="text-sm text-gray-300 font-mono whitespace-pre-wrap bg-[#111] border border-gray-800 rounded-lg p-4 leading-relaxed">
                                {buildPreviewPrompt()}
                            </pre>
                        </div>
                        <div className="p-3 border-t border-gray-800 flex justify-end">
                            <button
                                type="button"
                                onClick={() => setShowPreview(false)}
                                className="px-4 py-1.5 text-sm text-gray-300 hover:text-white hover:bg-gray-800 rounded transition"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
