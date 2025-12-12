import React from 'react';
import AgentSwitcher from '../AgentSwitcher';

export default function InputArea({
    inputMessage,
    setInputMessage,
    handleSendMessage,
    isLoading,
    attachments,
    removeAttachment,
    insertTag,
    fileInputRef,
    handleFileSelect,
    inputTokens,
    sessionStats,
    selectedModel,
    selectedAgent,
    setSelectedAgent,
    activeProviders,
    selectedProviderId,
    setSelectedProviderId,
    setSelectedModel
}) {
    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const currentProvider = activeProviders?.find(p => p.id === selectedProviderId);

    return (
        <div className="w-full max-w-4xl mx-auto">
            {/* Attachments Preview */}
            {attachments.length > 0 && (
                <div className="flex gap-2 mb-2 overflow-x-auto pb-2">
                    {attachments.map((att, i) => (
                        <div key={i} className="relative group flex-shrink-0 w-20 h-20 bg-[#222] rounded-lg border border-gray-700 overflow-hidden">
                            {att.type.startsWith('image/') ? (
                                <img src={att.preview} alt="preview" className="w-full h-full object-cover" />
                            ) : (
                                <div className="flex items-center justify-center h-full text-2xl">📄</div>
                            )}
                            <button
                                onClick={() => removeAttachment(i)}
                                className="absolute top-1 right-1 bg-black/50 hover:bg-red-500 text-white rounded-full p-1 transition opacity-0 group-hover:opacity-100"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                            </button>
                        </div>
                    ))}
                </div>
            )}

            <div className="bg-[#1a1a1a] border border-gray-700 rounded-xl shadow-lg relative transition-colors focus-within:border-gray-600">

                {/* Top Bar inside Input Area: Selectors */}
                <div className="flex items-center gap-2 p-2 border-b border-gray-800/50">
                    <AgentSwitcher selectedAgent={selectedAgent} onSelectAgent={setSelectedAgent} />

                    <div className="h-4 w-px bg-gray-700 mx-1"></div>

                    {/* Provider Selector */}
                    <div className="relative group">
                        <select
                            value={selectedProviderId}
                            onChange={(e) => {
                                setSelectedProviderId(e.target.value);
                                const newProv = activeProviders.find(p => p.id === e.target.value);
                                if (newProv) setSelectedModel(newProv.models[0]);
                            }}
                            className="appearance-none bg-[#222] hover:bg-[#333] text-gray-300 border border-gray-700 rounded px-2 py-1 pr-6 text-[10px] cursor-pointer focus:outline-none focus:border-accent transition min-w-[80px]"
                        >
                            {activeProviders?.length === 0 && <option>No Providers</option>}
                            {activeProviders?.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-1 text-gray-500 text-[8px]">▼</div>
                    </div>

                    {/* Model Selector */}
                    {currentProvider && (
                        <div className="relative group">
                            <select
                                value={selectedModel}
                                onChange={(e) => setSelectedModel(e.target.value)}
                                className="appearance-none bg-[#222] hover:bg-[#333] text-accent border border-accent/20 rounded px-2 py-1 pr-6 text-[10px] cursor-pointer focus:outline-none focus:border-accent transition font-medium min-w-[100px]"
                            >
                                {currentProvider.models.map(m => <option key={m} value={m}>{m}</option>)}
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-1 text-accent text-[8px]">▼</div>
                        </div>
                    )}
                </div>

                {/* Text Area */}
                <textarea
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={`Message ${selectedAgent ? selectedAgent.name : (selectedModel || 'AI')}...`}
                    className="w-full bg-transparent text-gray-200 p-3 min-h-[60px] max-h-[200px] resize-none focus:outline-none text-sm custom-scrollbar"
                    rows={1}
                    style={{ height: 'auto', minHeight: '60px' }}
                    onInput={(e) => {
                        e.target.style.height = 'auto';
                        e.target.style.height = e.target.scrollHeight + 'px';
                    }}
                />

                {/* Bottom Actions */}
                <div className="flex justify-between items-center p-2 pl-3">
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="text-gray-400 hover:text-white transition p-1 rounded hover:bg-gray-800"
                            title="Attach file"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path></svg>
                        </button>
                        <input
                            type="file"
                            multiple
                            ref={fileInputRef}
                            className="hidden"
                            onChange={handleFileSelect}
                        />

                        <div className="text-[10px] text-gray-500 flex gap-2">
                            <span>{inputTokens} tokens</span>
                            <span className="border-l border-gray-700 pl-2">{sessionStats.total} session</span>
                        </div>
                    </div>

                    <button
                        onClick={handleSendMessage}
                        disabled={isLoading || (!inputMessage.trim() && attachments.length === 0)}
                        className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${isLoading || (!inputMessage.trim() && attachments.length === 0)
                                ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                                : 'bg-accent hover:bg-accent-hover text-white shadow-lg hover:shadow-accent/20'
                            }`}
                    >
                        {isLoading ? (
                            <span className="animate-spin">⌛</span>
                        ) : (
                            <>
                                SEND <span className="text-[10px]">▶</span>
                            </>
                        )}
                    </button>
                </div>
            </div>

            <div className="text-center mt-2">
                <p className="text-[10px] text-gray-600">
                    AI can make mistakes. Check important info.
                </p>
            </div>
        </div>
    );
}
