import React, { useState, useEffect } from 'react';

export default function InstructionModal({ isOpen, onClose, chatId }) {
  const [instruction, setInstruction] = useState("");

  useEffect(() => {
    if (isOpen && chatId) {
      // Load existing instructions
      fetch(`http://localhost:8004/api/instructions/${chatId}`)
        .then(res => res.json())
        .then(data => setInstruction(data.content || ""))
        .catch(err => console.error(err));
    }
  }, [isOpen, chatId]);

  const handleSave = async () => {
    try {
      await fetch('http://localhost:8004/api/instructions/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, content: instruction }),
      });
      alert("Instructions saved!");
      onClose();
    } catch (error) {
      alert("Failed to save instructions");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
      <div className="bg-modal-bg w-[600px] rounded-lg shadow-xl flex flex-col p-6">
        <h2 className="text-xl font-bold text-white mb-4">Custom Instructions</h2>
        <p className="text-xs text-gray-400 mb-2">These instructions will be appended to every message in this chat session.</p>
        
        <textarea
          className="w-full h-40 bg-[#1a1a1a] border border-gray-600 rounded p-3 text-white text-sm focus:outline-none focus:border-accent resize-none"
          placeholder="e.g., 'You are a helpful coding assistant. Always answer in Python.'"
          value={instruction}
          onChange={(e) => setInstruction(e.target.value)}
        />

        <div className="flex justify-end gap-2 mt-4">
          <button onClick={onClose} className="px-4 py-2 text-gray-300 hover:text-white">Cancel</button>
          <button onClick={handleSave} className="bg-accent px-6 py-2 rounded text-white font-bold hover:bg-opacity-80">
            Save Instructions
          </button>
        </div>
      </div>
    </div>
  );
}