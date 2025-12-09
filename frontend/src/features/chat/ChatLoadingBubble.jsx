import React, { useState, useEffect } from 'react';

export default function ChatLoadingBubble({ provider, model }) {
  const [statusText, setStatusText] = useState(`Contacting ${provider}...`);
  const [seconds, setSeconds] = useState(0);

  // Timer logic to make the status feel "alive"
  useEffect(() => {
    const timer = setInterval(() => {
      setSeconds(s => s + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Update text based on how long we've been waiting
  useEffect(() => {
    if (seconds === 2) setStatusText(`Sending prompt to ${model}...`);
    if (seconds === 5) setStatusText("Generating response...");
    if (seconds === 10) setStatusText("Processing complex logic...");
    if (seconds === 15) setStatusText("Still working (large response expected)...");
  }, [seconds, model]);

  return (
    <div className="flex items-start gap-4 text-left w-full animate-in fade-in slide-in-from-bottom-2 duration-300">
        
        {/* Avatar (Pulsing) */}
        <div className="w-8 h-8 rounded-full bg-gray-800 flex-shrink-0 flex items-center justify-center shadow-lg relative">
             <div className="w-8 h-8 bg-accent/20 rounded-full absolute animate-ping opacity-75"></div>
             <span className="relative z-10 text-[10px] font-bold text-gray-400">...</span>
        </div>
        
        {/* Status Box */}
        <div className="bg-[#1e1e1e] border border-gray-700/50 rounded-2xl rounded-tl-sm px-5 py-3 shadow-md flex items-center gap-3">
             
             {/* Spinner */}
             <div className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin"></div>
             
             {/* Dynamic Text */}
             <div className="flex flex-col">
                <span className="text-xs text-gray-200 font-medium tracking-wide">
                    {statusText}
                </span>
                <span className="text-[10px] text-gray-500 font-mono mt-0.5">
                    {seconds.toFixed(1)}s elapsed
                </span>
             </div>
        </div>
    </div>
  );
}