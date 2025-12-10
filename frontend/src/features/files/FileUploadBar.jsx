// frontend/src/features/files/FileUploadBar.jsx
import React from 'react';

export default function FileUploadBar({ attachments, onRemove, onInsertTag }) {
  if (attachments.length === 0) return null;

  return (
    <div className="flex gap-3 px-6 pb-2 overflow-x-auto no-scrollbar pt-2">
      {attachments.map((file, idx) => {
        const isImage = file.type.startsWith('image/');
        
        return (
          <div key={idx} className="relative group shrink-0 animate-in fade-in slide-in-from-bottom-2 duration-300">
            
            {/* File Preview Card */}
            <div 
              className="w-16 h-16 rounded-lg border border-gray-600 bg-[#222] cursor-pointer hover:opacity-80 transition shadow-lg flex flex-col items-center justify-center overflow-hidden"
              onClick={() => onInsertTag(`@file${idx + 1}`)}
              title={file.name}
            >
              {isImage ? (
                <img src={file.preview} alt="preview" className="w-full h-full object-cover" />
              ) : (
                // Generic Doc Icon
                <div className="flex flex-col items-center">
                    <span className="text-2xl text-gray-400">📄</span>
                    <span className="text-[8px] text-gray-500 w-14 text-center truncate px-1">{file.name}</span>
                </div>
              )}

              {/* Tag Badge */}
              <div className="absolute bottom-0 right-0 bg-black/70 text-[10px] text-white px-1.5 rounded-tl-md backdrop-blur-sm">
                @{idx + 1}
              </div>
            </div>

            {/* Remove Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRemove(idx);
              }}
              className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition shadow-md hover:scale-110 z-10"
            >
              ✕
            </button>
          </div>
        );
      })}
    </div>
  );
}