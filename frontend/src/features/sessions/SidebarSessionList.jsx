import React, { useEffect, useState } from 'react';

export default function SidebarSessionList({ onSelectSession, onDeleteSession, currentChatId, refreshTrigger }) {
  const [sessions, setSessions] = useState([]);

  useEffect(() => {
    fetchSessions();
  }, [refreshTrigger]);

  const fetchSessions = async () => {
    try {
      const res = await fetch('http://localhost:8004/api/sessions/');
      const data = await res.json();
      setSessions(data);
    } catch (err) {
      console.error("Failed to load sessions");
    }
  };

  const handleDeleteClick = async (e, sessionId) => {
    e.stopPropagation(); // Stop clicking the row (which loads the chat)
    if (!window.confirm("Are you sure you want to delete this chat?")) return;

    try {
        await fetch(`http://localhost:8004/api/sessions/${sessionId}`, { method: 'DELETE' });
        // Update local list immediately
        setSessions(prev => prev.filter(s => s.id !== sessionId));
        // Tell parent to clear screen if needed
        if (onDeleteSession) onDeleteSession(sessionId);
    } catch (error) {
        alert("Failed to delete");
    }
  };

  return (
    <div className="flex-1 overflow-y-auto px-2 py-2 space-y-1 no-scrollbar">
      <div className="px-2 pb-2 text-xs font-bold text-gray-500 uppercase tracking-wider">
        Recent Chats
      </div>
      
      {sessions.length === 0 && (
        <div className="text-xs text-gray-600 px-2 italic">No history yet.</div>
      )}

      {sessions.map((session) => (
        <div
          key={session.id}
          onClick={() => onSelectSession(session.id)}
          className={`group relative w-full text-left px-3 py-2 rounded text-sm transition-colors cursor-pointer flex justify-between items-center ${
            currentChatId === session.id 
              ? 'bg-[#2a2a2a] text-white border-l-2 border-accent' 
              : 'text-gray-400 hover:bg-[#1f1f1f] hover:text-gray-200'
          }`}
        >
          <span className="truncate pr-4">{session.title}</span>
          
          {/* Delete Button (Only visible on hover) */}
          <button 
            onClick={(e) => handleDeleteClick(e, session.id)}
            className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-500 transition-all p-1"
            title="Delete Chat"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
          </button>
        </div>
      ))}
    </div>
  );
}