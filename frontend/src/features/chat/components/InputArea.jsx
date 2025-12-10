import React from 'react';
import FileUploadBar from '../../files/FileUploadBar'; 

export default function InputArea({ 
  inputMessage, setInputMessage, handleSendMessage, isLoading,
  attachments, removeAttachment, insertTag,
  fileInputRef, handleFileSelect,
  inputTokens, sessionStats, selectedModel
}) {
  return (
    // 1. OUTER WRAPPER: Sticky to bottom, full width
    <div className="sticky bottom-0 z-30 w-full pointer-events-none">
       
       {/* 2. BACKGROUND MASK: Applies gradient to FULL WIDTH of the screen */}
       {/* 'from-app-bg' creates a solid color at the bottom, fading to transparent at the top */}
       <div className="w-full bg-gradient-to-t from-app-bg via-app-bg/95 to-transparent pb-6 pt-10 px-6">
           
           {/* 3. CENTERED CONTENT: Constrained width for the input box itself */}
           <div className="max-w-4xl mx-auto pointer-events-auto">
               <div className="bg-[#1a1a1a] border border-gray-700 rounded-xl p-0 flex flex-col gap-0 shadow-2xl overflow-hidden">
                   
                   {/* Upload Bar */}
                   <FileUploadBar attachments={attachments} onRemove={removeAttachment} onInsertTag={insertTag} />

                   {/* Text Input */}
                   <input 
                       type="text" 
                       value={inputMessage}
                       onChange={(e) => setInputMessage(e.target.value)}
                       onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                       placeholder={`Message ${selectedModel || '...'}...`}
                       disabled={isLoading}
                       className="w-full bg-transparent text-gray-200 placeholder-gray-500 text-sm focus:outline-none px-4 py-3"
                   />
                   
                   {/* Footer Controls */}
                   <div className="flex justify-between items-center px-3 pb-2 pt-1 border-t border-gray-800/50 bg-[#1a1a1a]">
                       <div className="flex gap-2">
                           <input type="file" multiple className="hidden" ref={fileInputRef} onChange={handleFileSelect} />
                           
                           <button onClick={() => fileInputRef.current?.click()} className="w-9 h-9 flex items-center justify-center hover:bg-gray-800 rounded-md text-gray-400 text-xl transition">📎</button>
                           <button className="w-9 h-9 flex items-center justify-center hover:bg-gray-800 rounded-md text-gray-400 text-xl transition">✨</button>
                       </div>
                       <button onClick={handleSendMessage} disabled={isLoading} className={`bg-gray-700 text-white p-2 px-4 rounded hover:bg-gray-600 transition text-xs font-bold ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                           {isLoading ? '...' : 'SEND ➤'}
                       </button>
                   </div>
               </div>
               
               {/* Footer Stats */}
               <div className="flex justify-between items-center px-4 mt-2 text-[10px] text-gray-500 font-mono">
                    <div className="flex gap-4">
                       <span>Draft: <span className="text-gray-300">{inputTokens}</span> tokens</span>
                       <span>Session Total: <span className="text-gray-300">{sessionStats.total}</span> (In: {sessionStats.input}, Out: {sessionStats.output})</span>
                    </div>
                    <span>Onys AI v0.1</span>
               </div>

           </div>
       </div>
    </div>
  );
}