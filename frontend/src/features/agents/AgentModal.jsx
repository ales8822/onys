import React, { useState, useEffect } from 'react';

export default function AgentModal({ isOpen, onClose, onSave, initialData = null, categories = [] }) {
    const [formData, setFormData] = useState({
        name: '',
        role: '',
        personality: '',
        expertise: '',
        category: '',
        instructions: '',
        knowledge: ''
    });

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
                knowledge: ''
            });
        }
    }, [initialData, isOpen]);

    if (!isOpen) return null;

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
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
                        <label className="block text-xs font-medium text-gray-400 mb-1">
                            Instructions <span className="text-gray-600">(Use @ to reference)</span>
                        </label>
                        <textarea
                            name="instructions"
                            value={formData.instructions}
                            onChange={handleChange}
                            rows={4}
                            className="w-full bg-[#111] border border-gray-700 rounded px-3 py-2 text-sm text-white focus:border-accent focus:outline-none font-mono"
                            placeholder="System instructions for this agent..."
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-gray-400 mb-1">
                            Knowledge <span className="text-gray-600">(Use @ to reference)</span>
                        </label>
                        <textarea
                            name="knowledge"
                            value={formData.knowledge}
                            onChange={handleChange}
                            rows={3}
                            className="w-full bg-[#111] border border-gray-700 rounded px-3 py-2 text-sm text-white focus:border-accent focus:outline-none font-mono"
                            placeholder="Specific knowledge base references..."
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-800">
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
                </form>
            </div>
        </div>
    );
}
