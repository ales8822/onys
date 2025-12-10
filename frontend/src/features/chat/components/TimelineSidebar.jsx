// frontend/src/features/chat/components/TimelineSidebar.jsx
// This handles the right-side dots.

import React from 'react';

export default function TimelineSidebar({ chatHistory, scrollToMessage, setTooltip }) {
  return (
    <div className="sticky top-0 h-screen w-12 border-l border-gray-800 flex flex-col items-center py-6 gap-3 z-20 bg-app-bg">
        {chatHistory.map((msg, idx) => {
          if (msg.role !== 'user') return null;
          
          return (
              <div 
                  key={idx} 
                  onClick={() => scrollToMessage(idx)}
                  onMouseEnter={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect(); 
                      setTooltip({ show: true, x: rect.left, y: rect.top, content: msg.content });
                  }}
                  onMouseLeave={() => setTooltip({ show: false, x: 0, y: 0, content: "" })}
                  className="group relative flex items-center justify-center cursor-pointer w-full py-1"
              >
                  <div className="w-2 h-2 rounded-full bg-gray-600 group-hover:bg-accent transition-all group-hover:scale-125 duration-200"></div>
              </div>
          );
        })}
    </div>
  );
}