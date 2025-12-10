// frontend/src/features/chat/ChatArea.jsx

import React, { useState, useRef, useMemo, useEffect } from 'react';
import { encodingForModel } from "js-tiktoken";

// Import new sub-components
import MessageList from './components/MessageList';
import TimelineSidebar from './components/TimelineSidebar';
import InputArea from './components/InputArea';

export default function ChatArea({ 
  chatHistory, 
  setChatHistory, 
  selectedProviderId, 
  selectedModel, 
  chatId 
}) {
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [attachments, setAttachments] = useState([]); 
  const fileInputRef = useRef(null);
  const [tooltip, setTooltip] = useState({ show: false, x: 0, y: 0, content: "" });
  const [inputTokens, setInputTokens] = useState(0); 
  const messageRefs = useRef({});
  const scrollContainerRef = useRef(null); 
  const endRef = useRef(null); 

  // --- TOKEN LOGIC ---
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

  useEffect(() => {
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
    }, 500); 
    return () => clearTimeout(timer);
  }, [inputMessage]);

  // --- FILE HANDLERS ---
  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    const newAttachments = await Promise.all(files.map(async (file) => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64String = reader.result.split(',')[1];
          resolve({
            file, name: file.name, type: file.type,
            preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : null,
            base64: base64String, fullDataUrl: reader.result 
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
    setAttachments(prev => [...prev, { file: null, name: name || "Reused", type: type || "image/png", preview: imgPreview, base64: imgBase64, fullDataUrl: imgPreview }]);
  };

  const insertTag = (tag) => {
    setInputMessage(prev => prev + (prev.endsWith(' ') ? '' : ' ') + tag + ' ');
  };

  // --- SEND HANDLER ---
  const handleSendMessage = async () => {
    if ((!inputMessage.trim() && attachments.length === 0) || !selectedProviderId) return;

    const imagesToSend = attachments.filter(a => a.type.startsWith('image/')).map(a => a.base64);
    const docsToSend = attachments.filter(a => !a.type.startsWith('image/')).map(a => ({
        name: a.name, type: a.type, content: a.base64
    }));

    const newMessage = { 
        role: 'user', content: inputMessage, id: Date.now(),
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
          chat_id: chatId, provider_id: selectedProviderId, model_id: selectedModel,
          messages: updatedHistory, images: imagesToSend, documents: docsToSend
        }),
      });
      const data = await res.json();
      setChatHistory(prev => [...prev, { 
        role: 'assistant', content: data.content, id: Date.now() + 1,
        model: selectedModel, timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        meta: data.usage 
      }]);
    } catch (error) {
      console.error("Chat error:", error);
      alert("Failed to send message");
    } finally {
      setIsLoading(false);
    }
  };

  const scrollToMessage = (index) => {
    const element = messageRefs.current[index];
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  // --- RENDER ---
  return (
    <div ref={scrollContainerRef} className="flex-1 overflow-y-auto custom-scrollbar bg-app-bg flex relative">
      
      {/* LEFT COLUMN */}
      <div className="flex-1 flex flex-col min-h-full relative">
         {/* Messages */}
         <MessageList 
            chatHistory={chatHistory} 
            messageRefs={messageRefs}
            reuseImage={reuseImage}
            isLoading={isLoading}
            selectedProviderId={selectedProviderId}
            selectedModel={selectedModel}
            endRef={endRef}
         />

         {/* Sticky Input */}
         <InputArea 
            inputMessage={inputMessage}
            setInputMessage={setInputMessage}
            handleSendMessage={handleSendMessage}
            isLoading={isLoading}
            attachments={attachments}
            removeAttachment={removeAttachment}
            insertTag={insertTag}
            fileInputRef={fileInputRef}
            handleFileSelect={handleFileSelect}
            inputTokens={inputTokens}
            sessionStats={sessionStats}
            selectedModel={selectedModel}
         />
      </div>

      {/* RIGHT COLUMN: Timeline */}
      <TimelineSidebar 
        chatHistory={chatHistory} 
        scrollToMessage={scrollToMessage} 
        setTooltip={setTooltip} 
      />

      {/* Floating Tooltip */}
      {tooltip.show && (
        <div 
            className="fixed z-[9999] max-w-xs bg-[#222] text-xs text-gray-200 px-3 py-2 rounded-md shadow-2xl border border-gray-700 animate-in fade-in zoom-in-95 duration-100 pointer-events-none"
            style={{ top: tooltip.y - 15, left: tooltip.x - 12, transform: 'translateX(-100%)' }}
        >
            <div className="absolute top-1/2 -right-1.5 -translate-y-1/2 w-3 h-3 bg-[#222] border-t border-r border-gray-700 rotate-45"></div>
            <p className="truncate w-48">{tooltip.content}</p>
        </div>
      )}

    </div>
  );
}