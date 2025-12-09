import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';

/**
 * Internal component to handle Code Block logic (Copy & Expand)
 */
const CodeBlock = ({ inline, className, children }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const codeString = String(children).replace(/\n$/, "");
  const hasNewLine = codeString.includes('\n');
  const isBlock = hasNewLine || (className && className.includes('language-'));
  const language = className ? className.replace('language-', '') : 'text';

  // Lock body scroll when expanded
  useEffect(() => {
    if (isExpanded) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isExpanded]);

  // 1. INLINE CODE (Small Pill)
  if (!isBlock) {
    return (
      <code className="bg-[#2a2a2a] px-1.5 py-0.5 rounded text-accent font-mono text-xs border border-gray-700 break-words">
        {children}
      </code>
    );
  }

  // 2. BLOCK CODE
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(codeString);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy!', err);
    }
  };

  // Helper to render the code content (reused for normal & expanded view)
  const renderCodeContent = (fullScreen = false) => (
    <>
       {/* Header Bar */}
       <div className={`bg-[#252525] px-4 py-2 text-[10px] text-gray-400 font-mono border-b border-gray-700 flex justify-between items-center select-none ${fullScreen ? 'sticky top-0 z-10' : ''}`}>
        
        {/* Left: Lang Label */}
        <div className="flex items-center gap-3">
            <span className="font-bold text-gray-500 uppercase">CODE</span>
            <span className="bg-[#333] px-2 py-0.5 rounded text-gray-300 uppercase">{language}</span>
        </div>

        {/* Right: Controls */}
        <div className="flex items-center gap-3">
            
            {/* COPY BUTTON */}
            <button 
                onClick={handleCopy}
                className="flex items-center gap-1 hover:text-white transition-colors"
                title="Copy code"
            >
                {isCopied ? (
                    <>
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-500"><polyline points="20 6 9 17 4 12"/></svg>
                        <span className="text-green-500 font-bold">Copied</span>
                    </>
                ) : (
                    <>
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                        <span className="hidden sm:inline">Copy</span>
                    </>
                )}
            </button>

            {/* EXPAND / CLOSE BUTTON */}
            <button 
                onClick={() => setIsExpanded(!isExpanded)}
                className="flex items-center gap-1 hover:text-white transition-colors"
                title={fullScreen ? "Close Fullscreen" : "Expand Code"}
            >
                {fullScreen ? (
                    <>
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                        <span className="font-bold text-white">Close</span>
                    </>
                ) : (
                    <>
                         <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 3 21 3 21 9"></polyline><polyline points="9 21 3 21 3 15"></polyline><line x1="21" y1="3" x2="14" y2="10"></line><line x1="3" y1="21" x2="10" y2="14"></line></svg>
                         <span className="hidden sm:inline">Expand</span>
                    </>
                )}
            </button>
        </div>
      </div>

      {/* Code Area */}
      <code 
        className={`block p-4 font-mono text-gray-200 leading-5 bg-[#1e1e1e] whitespace-pre overflow-x-auto ${fullScreen ? 'text-sm h-full' : 'text-xs'}`}
      >
        {children}
      </code>
    </>
  );

  return (
    <>
      {/* 1. NORMAL VIEW (In Chat) */}
      <div className="my-4 rounded-lg overflow-hidden bg-[#1e1e1e] border border-gray-700 shadow-md">
         {renderCodeContent(false)}
      </div>

      {/* 2. EXPANDED MODAL (Fullscreen Overlay) */}
      {isExpanded && (
        <div className="fixed inset-0 z-[99999] bg-black/90 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
            {/* Modal Container */}
            <div className="w-[90vw] h-[85vh] bg-[#1e1e1e] border border-gray-700 rounded-lg shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="flex-1 overflow-auto custom-scrollbar">
                     {renderCodeContent(true)}
                </div>
            </div>
        </div>
      )}
    </>
  );
};

export default function MarkdownRenderer({ content }) {
  return (
    <div className="markdown-body text-sm leading-relaxed text-gray-200">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkBreaks]}
        components={{
          code: CodeBlock,
          // Typography
          h1: ({node, ...props}) => <h1 className="text-2xl font-bold mt-6 mb-3 text-white border-b border-gray-700 pb-2" {...props} />,
          h2: ({node, ...props}) => <h2 className="text-xl font-bold mt-5 mb-2 text-white" {...props} />,
          h3: ({node, ...props}) => <h3 className="text-lg font-bold mt-4 mb-2 text-gray-100" {...props} />,
          p: ({node, ...props}) => <p className="mb-3 last:mb-0" {...props} />,
          strong: ({node, ...props}) => <span className="font-bold text-accent" {...props} />,
          
          blockquote: ({node, ...props}) => (
            <div className="flex gap-3 my-4 bg-gray-800/40 p-3 rounded-r border-l-4 border-accent">
               <span className="text-2xl text-accent font-serif">“</span>
               <blockquote className="italic text-gray-300 pt-1" {...props} />
            </div>
          ),

          table: ({node, ...props}) => (
            <div className="overflow-x-auto my-4 rounded-lg border border-gray-700 shadow-sm">
              <table className="min-w-full text-left text-sm border-collapse" {...props} />
            </div>
          ),
          thead: ({node, ...props}) => <thead className="bg-[#252525] text-gray-200 uppercase font-bold text-xs" {...props} />,
          tbody: ({node, ...props}) => <tbody className="bg-[#1a1a1a] divide-y divide-gray-800" {...props} />,
          tr: ({node, ...props}) => <tr className="hover:bg-gray-800/50 transition-colors" {...props} />,
          th: ({node, ...props}) => <th className="px-4 py-3 border-r border-gray-700 last:border-none" {...props} />,
          td: ({node, ...props}) => <td className="px-4 py-3 text-gray-300 border-r border-gray-800 last:border-none" {...props} />,

          a: ({node, ...props}) => <a className="text-accent hover:underline cursor-pointer" target="_blank" rel="noopener noreferrer" {...props} />,
          
          ul: ({node, ...props}) => <ul className="list-disc pl-6 mb-3 space-y-1 marker:text-gray-500" {...props} />,
          ol: ({node, ...props}) => <ol className="list-decimal pl-6 mb-3 space-y-1 marker:text-gray-500" {...props} />,
          li: ({node, ...props}) => <li className="pl-1" {...props} />,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}