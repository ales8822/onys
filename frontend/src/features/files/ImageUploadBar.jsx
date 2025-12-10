import React from 'react';

export default function ImageUploadBar({ images, onRemove, onInsertTag }) {
  if (images.length === 0) return null;

  return (
    <div className="flex gap-3 px-6 pb-2 overflow-x-auto no-scrollbar pt-2">
      {images.map((img, idx) => (
        <div key={idx} className="relative group shrink-0 animate-in fade-in slide-in-from-bottom-2 duration-300">
          {/* Image Thumbnail */}
          <div 
            className="w-16 h-16 rounded-lg border border-gray-600 bg-cover bg-center cursor-pointer hover:opacity-80 transition shadow-lg"
            style={{ backgroundImage: `url(${img.preview})` }}
            onClick={() => onInsertTag(`@img${idx + 1}`)}
            title="Click to insert tag"
          >
            {/* Tag Badge */}
            <div className="absolute bottom-0 right-0 bg-black/70 text-[10px] text-white px-1.5 rounded-tl-md backdrop-blur-sm">
              @{idx + 1}
            </div>
          </div>

          {/* Remove Button (X) */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemove(idx);
            }}
            className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition shadow-md hover:scale-110"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}