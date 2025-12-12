// frontend/src/features/chat/components/MessageList.jsx
// This handles the loop of messages, avatars, and the loading bubble.

import React, { useRef, useState } from 'react';
import MarkdownRenderer from '../MarkdownRenderer';
import ChatLoadingBubble from '../ChatLoadingBubble';

export default function MessageList({
    chatHistory,
    messageRefs,
    reuseImage,
    isLoading,
    selectedProviderId,
    selectedModel,
    endRef
}) {
    const [copiedId, setCopiedId] = useState(null);

    const handleCopyMessage = (content, id) => {
        navigator.clipboard.writeText(content);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    return (
        <div className="flex-1 w-full max-w-4xl mx-auto space-y-8 px-6 pt-6 pb-10">

            {chatHistory.length === 0 && (
                <div className="text-center text-gray-500 mt-20">
                    <p className="text-xl">Start a conversation with {selectedModel}</p>
                </div>
            )}

            {chatHistory.map((msg, idx) => (
                <div
                    key={idx}
                    ref={(el) => messageRefs.current[idx] = el}
                    className={`flex items-start gap-4 text-left ${msg.role === 'user' ? 'justify-end' : ''}`}
                >
                    {/* AI Avatar */}
                    {msg.role === 'assistant' && (
                        <div className="flex flex-col items-center gap-1">
                            <div className="w-8 h-8 rounded-full bg-orange-600 flex-shrink-0 flex items-center justify-center text-[10px] font-bold shadow-lg ring-2 ring-[#1a1a1a]">AI</div>
                        </div>
                    )}

                    <div className={`flex flex-col max-w-[85%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>

                        {/* AI Info Header */}
                        {msg.role === 'assistant' && (
                            <div className="flex items-center gap-2 mb-1 ml-1">
                                <span className="text-[11px] font-bold text-orange-400/80 uppercase tracking-wider">{msg.agent ? msg.agent.name : (msg.model || 'Unknown Model')}</span>
                                <span className="text-[10px] text-gray-600">{msg.timestamp}</span>

                                {/* Token Count */}
                                {msg.meta && (
                                    <span className="text-[10px] text-gray-500 border-l border-gray-700 pl-2 ml-1" title="Input / Output Tokens">
                                        ⚡ {msg.meta.total_tokens}
                                    </span>
                                )}

                                {/* Copy Button */}
                                <button
                                    onClick={() => handleCopyMessage(msg.content, msg.id)}
                                    className={`ml-2 transition-all duration-200 flex items-center gap-1 ${copiedId === msg.id ? 'text-green-400' : 'text-gray-600 hover:text-white'}`}
                                    title="Copy full response"
                                >
                                    {copiedId === msg.id ? (
                                        <><svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg><span className="text-[10px] font-bold">Copied</span></>
                                    ) : (
                                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>
                                    )}
                                </button>
                            </div>
                        )}

                        {/* User Attachments (In History) */}
                        {msg.role === 'user' && msg.attachments && msg.attachments.length > 0 && (
                            <div className="flex gap-2 mb-2 justify-end flex-wrap">
                                {msg.attachments.map((att, i) => (
                                    <div key={i} className="relative group bg-[#222] border border-gray-600 rounded-lg overflow-hidden w-32 h-32 flex items-center justify-center">
                                        {att.type && att.type.startsWith('image/') ? (
                                            <img src={att.preview || att.fullDataUrl} alt="att" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="flex flex-col items-center p-2 text-center">
                                                <span className="text-3xl mb-2">📄</span>
                                                <span className="text-[10px] text-gray-300 break-all line-clamp-3">{att.name}</span>
                                            </div>
                                        )}
                                        {/* Reuse Button */}
                                        <button
                                            onClick={() => reuseImage(att.base64, att.preview || att.fullDataUrl, att.name, att.type)}
                                            className="absolute bottom-2 right-2 bg-black/60 hover:bg-accent text-white p-1.5 rounded-full backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all z-10"
                                            title="Use this file again"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" /><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" /></svg>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Message Bubble */}
                        <div className={`${msg.role === 'user' ? 'bg-accent text-white rounded-2xl rounded-tr-sm shadow-md px-5 py-3' : 'text-gray-300'} text-sm w-full`}>
                            <MarkdownRenderer content={msg.content} />
                        </div>
                    </div>

                    {/* User Avatar */}
                    {msg.role === 'user' && (
                        <div className="w-8 h-8 rounded-full bg-gray-500 flex-shrink-0 flex items-center justify-center text-[10px] shadow-lg ring-2 ring-[#1a1a1a]">ME</div>
                    )}
                </div>
            ))}

            {isLoading && <ChatLoadingBubble provider={selectedProviderId} model={selectedModel} />}

            {/* Anchor for auto-scroll */}
            <div ref={endRef} />
        </div>
    );
}