// frontend/src/features/chat/ChatArea.jsx
import React, { useState, useRef , useMemo, useEffect} from 'react';
import { encodingForModel } from "js-tiktoken";
import MarkdownRenderer from './MarkdownRenderer';
import ChatLoadingBubble from './ChatLoadingBubble';
import FileUploadBar from '../files/FileUploadBar'; // Renamed

export default function ChatArea({ 
  chatHistory, 
  setChatHistory, 
  selectedProviderId, 
  selectedModel, 
  chatId 
}) {
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // --- IMAGE STATE ---
  const [attachments, setAttachments] = useState([]); // <--- 2. New State
  const fileInputRef = useRef(null);                  // <--- 3. New Ref

  // State for the "Smart" Tooltip
  const [tooltip, setTooltip] = useState({ show: false, y: 0, content: "" });
  
  // --- TOKEN COUNTERS ---
  const [inputTokens, setInputTokens] = useState(0); // Live estimate

  // Calculate Total Session Tokens (Official Data from Backend)
  const sessionStats = useMemo(() => {
    let input = 0;
    let output = 0;
    chatHistory.forEach(msg => {
      if (msg.role === 'assistant' && msg.meta) {
        input += (msg.meta.prompt_tokens || 0);
        output += (msg.meta.completion_tokens || 0);
      }
    });
    return { input, output, total: input + output };
  }, [chatHistory]);
  // ----------------------

  // --- LIVE TOKEN ESTIMATION (DEBOUNCED) ---
  useEffect(() => {
    // 1. Define the timer
    const timer = setTimeout(() => {
        if (!inputMessage) {
            setInputTokens(0);
            return;
        }
        try {
            const enc = encodingForModel("gpt-4o"); 
            const tokens = enc.encode(inputMessage);
            setInputTokens(tokens.length);
        } catch (e) {
            setInputTokens(Math.ceil(inputMessage.length / 4));
        }
    }, 2000); // <--- Wait 500ms (0.5 seconds) of inactivity before calculating

    // 2. Cleanup: If you type again before 500ms, cancel the previous timer
    return () => clearTimeout(timer);
  }, [inputMessage]);

  // 1. REFS: We store a reference to every message DOM element
  const messageRefs = useRef({});
  const [copiedId, setCopiedId] = useState(null);

  // --- FILE HANDLERS (New) ---
  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    const newAttachments = await Promise.all(files.map(async (file) => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          // Get clean base64 (remove data:application/pdf;base64, prefix)
          const base64String = reader.result.split(',')[1];
          resolve({
            file, // Raw file object
            name: file.name,
            type: file.type,
            preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : null,
            base64: base64String, // Clean base64 for backend
            fullDataUrl: reader.result // For reusing images locally
          });
        };
        reader.readAsDataURL(file);
      });
    }));

    setAttachments(prev => [...prev, ...newAttachments]);
    e.target.value = null;
  };

  const removeAttachment = (index) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

   const reuseImage = (imgBase64, imgPreview, name, type) => {
    // Add existing file back to staging
    setAttachments(prev => [...prev, { 
        file: null, 
        name: name || "Reused Image",
        type: type || "image/png",
        preview: imgPreview, 
        base64: imgBase64,
        fullDataUrl: imgPreview 
    }]);
  };

  const insertTag = (tag) => {
    setInputMessage(prev => prev + (prev.endsWith(' ') ? '' : ' ') + tag + ' ');
  };
  // ---------------------------

  const handleCopyMessage = (content, id) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000); // Reset after 2 seconds
  };

  const handleSendMessage = async () => {
    if ((!inputMessage.trim() && attachments.length === 0) || !selectedProviderId) return;

    const imagesToSend = attachments.filter(a => a.type.startsWith('image/')).map(a => a.base64);
    const docsToSend = attachments.filter(a => !a.type.startsWith('image/')).map(a => ({
        name: a.name,
        type: a.type,
        content: a.base64
    }));

    const newMessage = { 
        role: 'user', 
        content: inputMessage, 
        id: Date.now(),
        attachments: attachments 
    };
    
    const updatedHistory = [...chatHistory, newMessage];
    
    setChatHistory(updatedHistory);
    setInputMessage("");
    setAttachments([]); 
    
    setIsLoading(true);

    try {
      const res = await fetch('http://localhost:8004/api/chat/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          provider_id: selectedProviderId,
          model_id: selectedModel,
          messages: updatedHistory,
          images: imagesToSend,
          documents: docsToSend
        }),
      });
      
      const data = await res.json();
      setChatHistory(prev => [...prev, { 
        role: 'assistant', 
        content: data.content, 
        id: Date.now() + 1,
        model: selectedModel,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        meta: data.usage // Store usage from backend
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
                                {/* TOKEN DISPLAY PER MESSAGE (Official) */}
                                {msg.meta && (
                                    <span className="text-[10px] text-gray-500 border-l border-gray-700 pl-2 ml-1" title="Input / Output Tokens">
                                        ⚡ {msg.meta.total_tokens}
                                    </span>
                                )}
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

                       {/* --- RENDER ATTACHMENTS (WITH REUSE BUTTON) --- */}
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
                                        
                                        {/* --- REUSE BUTTON RESTORED --- */}
                                        <button 
                                            onClick={() => reuseImage(att.base64, att.preview || att.fullDataUrl, att.name, att.type)}
                                            className="absolute bottom-2 right-2 bg-black/60 hover:bg-accent text-white p-1.5 rounded-full backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all z-10"
                                            title="Use this file again"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
                                        </button>
                                    </div>
                                ))}
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
        
        {/* Changed padding from p-3 to p-0 to accommodate the full-width upload bar inside */}
        <div className="max-w-4xl mx-auto bg-[#1a1a1a] border border-gray-700 rounded-xl p-0 flex flex-col gap-0 shadow-2xl overflow-hidden">
            
            {/* --- NEW: Upload Bar --- */}
            <FileUploadBar 
                attachments={attachments} 
                onRemove={removeAttachment} 
                onInsertTag={insertTag} 
            />

            <input 
                type="text" 
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder={`Message ${selectedModel || '...'}...`}
                disabled={isLoading}
                className="w-full bg-transparent text-gray-200 placeholder-gray-500 text-sm focus:outline-none px-4 py-3"
            />
            
            {/* Modified Footer Bar to add Paperclip logic */}
            <div className="flex justify-between items-center px-3 pb-2 pt-1 border-t border-gray-800/50 bg-[#1a1a1a]">
                <div className="flex gap-2">
                     {/* Hidden File Input */}
                    <input 
                          type="file" 
                          multiple 
                          // Remove 'accept' to allow all files, or set specific: ".pdf,.txt,.md,.py,.js,.jpg,.png"
                          className="hidden" 
                          ref={fileInputRef} 
                          onChange={handleFileSelect} 
                        />

                     <button onClick={() => fileInputRef.current?.click()} className="w-9 h-9 flex items-center justify-center hover:bg-gray-800 rounded-md text-gray-400 text-xl transition">📎</button>
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
            {/* --- FOOTER STATUS BAR (TOKENS) --- */}
                <div className="flex justify-between items-center px-4 mt-2 text-[10px] text-gray-500 font-mono">
                     <div className="flex gap-4">
                        <span>Draft: <span className="text-gray-300">{inputTokens}</span> tokens</span>
                        <span>Session Total: <span className="text-gray-300">{sessionStats.total}</span> (In: {sessionStats.input}, Out: {sessionStats.output})</span>
                     </div>
                     <span>Onys AI v0.1</span>
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