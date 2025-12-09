import React, { useState, useRef } from 'react';
import MarkdownRenderer from './MarkdownRenderer';
import ChatLoadingBubble from './ChatLoadingBubble';

export default function ChatArea({ 
  chatHistory, 
  setChatHistory, 
  selectedProviderId, 
  selectedModel, 
  chatId 
}) {
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  // State for the "Smart" Tooltip
  const [tooltip, setTooltip] = useState({ show: false, y: 0, content: "" });
  // 1. REFS: We store a reference to every message DOM element
  const messageRefs = useRef({});
  const [copiedId, setCopiedId] = useState(null);

  const handleCopyMessage = (content, id) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000); // Reset after 2 seconds
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !selectedProviderId) return;

    const newMessage = { role: 'user', content: inputMessage, id: Date.now() }; // Add ID for tracking
    const updatedHistory = [...chatHistory, newMessage];
    
    setChatHistory(updatedHistory);
    setInputMessage("");
    setIsLoading(true);

    try {
      const res = await fetch('http://localhost:8004/api/chat/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          provider_id: selectedProviderId,
          model_id: selectedModel,
          messages: updatedHistory 
        }),
      });
      
      const data = await res.json();
      setChatHistory(prev => [...prev, { 
        role: 'assistant', 
        content: data.content, 
        id: Date.now() + 1,
        model: selectedModel, // <--- Save the model name
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) // <--- Save time
      }]);
    } catch (error) {
      console.error("Chat error:", error);
      alert("Failed to send message");
    } finally {
      setIsLoading(false);
    }
  };

  // 2. TIMELINE CLICK HANDLER
  const scrollToMessage = (index) => {
    const element = messageRefs.current[index];
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  return (
    <div className="flex-1 flex min-h-0 bg-app-bg relative">
         
      {/* LEFT: MAIN SCROLLABLE CHAT */}
      <div className="flex-1 overflow-y-auto p-6 flex flex-col items-center custom-scrollbar">
      
         <div className="w-full max-w-3xl space-y-8 pb-32"> {/* pb-32 adds space for input box */}
             
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
                    {/* AI AVATAR & HEADER COLUMN */}
                    {msg.role === 'assistant' && (
                       <div className="flex flex-col items-center gap-1">
                           {/* Avatar */}
                           <div className="w-8 h-8 rounded-full bg-orange-600 flex-shrink-0 flex items-center justify-center text-[10px] font-bold shadow-lg ring-2 ring-[#1a1a1a]">
                               AI
                           </div>
                       </div>
                    )}
                    
                    {/* MESSAGE CONTENT COLUMN */}
                    <div className={`flex flex-col max-w-[85%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                        
                        {/* 1. NEW: Info Header (Only for AI) */}
                        {msg.role === 'assistant' && (
                            <div className="flex items-center gap-2 mb-1 ml-1">
                                <span className="text-[11px] font-bold text-orange-400/80 uppercase tracking-wider">
                                    {msg.model || 'Unknown Model'}
                                </span>
                                <span className="text-[10px] text-gray-600">
                                    {msg.timestamp}
                                </span>
                                {/* Copy Icon with Feedback */}
                                <button 
                                    onClick={() => handleCopyMessage(msg.content, msg.id)}
                                    className={`ml-2 transition-all duration-200 flex items-center gap-1 ${
                                        copiedId === msg.id ? 'text-green-400' : 'text-gray-600 hover:text-white'
                                    }`}
                                    title="Copy full response"
                                >
                                    {copiedId === msg.id ? (
                                        <>
                                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                                            <span className="text-[10px] font-bold">Copied</span>
                                        </>
                                    ) : (
                                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                                    )}
                                </button>
                            </div>
                        )}

                        {/* 2. Message Bubble */}
                        <div className={`${msg.role === 'user' ? 'bg-accent text-white rounded-2xl rounded-tr-sm shadow-md px-5 py-3' : 'text-gray-300'} text-sm w-full`}>
                             <MarkdownRenderer content={msg.content} />
                        </div>
                    </div>

                    {/* USER AVATAR */}
                    {msg.role === 'user' && (
                       <div className="w-8 h-8 rounded-full bg-gray-500 flex-shrink-0 flex items-center justify-center text-[10px] shadow-lg ring-2 ring-[#1a1a1a]">ME</div>
                    )}
                </div>
             ))}
             {isLoading && (
            <ChatLoadingBubble 
                provider={selectedProviderId} 
                model={selectedModel} 
            />
         )}
         </div>
      </div> 
      {/* End of Main Scrollable Chat */}

      {/* RIGHT: TIMELINE NAVIGATION (Sticky) */}
      <div className="w-12 border-l border-gray-800 bg-app-bg flex flex-col items-center py-6 gap-3 overflow-y-auto no-scrollbar">
        
          {chatHistory.map((msg, idx) => {
            if (msg.role !== 'user') return null;
            
            return (
                <div 
                    key={idx} 
                    onClick={() => scrollToMessage(idx)}
                    // 1. On Hover: Calculate position
                    onMouseEnter={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        setTooltip({
                            show: true,
                            y: rect.top + rect.height / 2, // center vertically
                            x: rect.left,                  // left edge of the bullet
                            content: msg.content
                        });
                    }}

                    // 2. On Leave: Hide
                    onMouseLeave={() => setTooltip({ ...tooltip, show: false })}
                    
                    className="group relative flex items-center justify-center cursor-pointer w-full py-1"
                >
                    <div className="w-2 h-2 rounded-full bg-gray-600 group-hover:bg-accent transition-all group-hover:scale-125 duration-200"></div>
                </div>
            );
          })}
      </div>

      {/* BOTTOM: INPUT AREA (Absolute Positioned) */}
      <div className="absolute bottom-0 left-0 w-[calc(100%-3rem)] bg-gradient-to-t from-app-bg via-app-bg to-transparent pt-10 pb-6 px-6">
        <div className="max-w-4xl mx-auto bg-[#1a1a1a] border border-gray-700 rounded-xl p-3 flex flex-col gap-2 shadow-2xl">
            <input 
                type="text" 
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder={`Message ${selectedModel || '...'}...`}
                disabled={isLoading}
                className="w-full bg-transparent text-gray-200 placeholder-gray-500 text-sm focus:outline-none px-2 py-1"
            />
            <div className="flex justify-between items-center mt-2 border-t border-gray-800 pt-2">
                <div className="flex gap-2">
                     <button className="w-9 h-9 flex items-center justify-center hover:bg-gray-800 rounded-md text-gray-400 text-xl transition">📎</button>
                     <button className="w-9 h-9 flex items-center justify-center hover:bg-gray-800 rounded-md text-gray-400 text-xl transition">✨</button>
                </div>
                <button 
                    onClick={handleSendMessage}
                    disabled={isLoading}
                    className={`bg-gray-700 text-white p-2 px-4 rounded hover:bg-gray-600 transition text-xs font-bold ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                    {isLoading ? '...' : 'SEND ➤'}
                </button>
            </div>
        </div>
      </div>
          {/* SMART FLOATING TOOLTIP */}
            {tooltip.show && (
            <div
                className="fixed z-[9999] max-w-xs bg-[#222] text-xs text-gray-200 px-3 py-2 rounded-md shadow-2xl border border-gray-700 animate-in fade-in zoom-in-95 duration-100 pointer-events-none"
                style={{
                    top: tooltip.y - 15,         // adjust vertically
                    left: tooltip.x - 210        // 200px width + 10px spacing
                }}
            >
                {/* Arrow pointing right to the bullet */}
                <div className="absolute top-1/2 -right-1.5 -translate-y-1/2 w-3 h-3 bg-[#222] border-t border-r border-gray-700 rotate-45"></div>
                <p className="truncate w-48">{tooltip.content}</p>
            </div>
        )}

    </div>
  );
}