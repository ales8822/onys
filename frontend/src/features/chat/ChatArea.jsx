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
      setChatHistory(prev => [...prev, { role: 'assistant', content: data.content, id: Date.now() + 1 }]);
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
                    // Assign ref based on index so Timeline can find it
                    ref={(el) => messageRefs.current[idx] = el} 
                    className={`flex items-start gap-4 text-left ${msg.role === 'user' ? 'justify-end' : ''}`}
                >
                    
                    {msg.role === 'assistant' && (
                       <div className="w-8 h-8 rounded-full bg-orange-600 flex-shrink-0 flex items-center justify-center text-[10px] font-bold shadow-lg">AI</div>
                    )}
                    
                    <div className={`${msg.role === 'user' ? 'bg-accent text-white rounded-2xl rounded-tr-sm shadow-md' : 'text-gray-300'} text-sm max-w-[85%] ${msg.role === 'user' ? 'px-5 py-3' : ''}`}>
                         {/* Render Markdown for both, or just AI. Used for both here for consistency */}
                         <MarkdownRenderer content={msg.content} />
                    </div>

                    {msg.role === 'user' && (
                       <div className="w-8 h-8 rounded-full bg-gray-500 flex-shrink-0 flex items-center justify-center text-[10px] shadow-lg">ME</div>
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
                        const rect = e.currentTarget.getBoundingClientRect(); // Get exact screen coordinates
                        setTooltip({
                            show: true,
                            y: rect.top, // The vertical position of this specific dot
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
            className="fixed right-16 z-[9999] max-w-xs bg-[#222] text-xs text-gray-200 px-3 py-2 rounded-md shadow-2xl border border-gray-700 animate-in fade-in zoom-in-95 duration-100 pointer-events-none"
            style={{ top: tooltip.y - 15 }} // -15 centers it vertically with the dot
        >
            {/* Arrow pointing right */}
            <div className="absolute top-1/2 -right-1.5 -translate-y-1/2 w-3 h-3 bg-[#222] border-t border-r border-gray-700 rotate-45"></div>
            
            {/* Content */}
            <p className="truncate w-48">{tooltip.content}</p>
        </div>
      )}
    </div>
  );
}