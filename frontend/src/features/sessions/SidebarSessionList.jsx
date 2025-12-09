import React, { useEffect, useState } from 'react';

export default function SidebarSessionList({ onSelectSession, currentChatId, refreshTrigger }) {
  const [sessions, setSessions] = useState([]);

  useEffect(() => {
    fetchSessions();
  }, [refreshTrigger]); // Reload list when a new chat starts

  const fetchSessions = async () => {
    try {
      const res = await fetch('http://localhost:8004/api/sessions/');
      const data = await res.json();
      setSessions(data);
    } catch (err) {
      console.error("Failed to load sessions");
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
        <button
          key={session.id}
          onClick={() => onSelectSession(session.id)}
          className={`w-full text-left px-3 py-2 rounded text-sm transition-colors truncate ${
            currentChatId === session.id 
              ? 'bg-[#2a2a2a] text-white border-l-2 border-accent' 
              : 'text-gray-400 hover:bg-[#1f1f1f] hover:text-gray-200'
          }`}
        >
          {session.title}
        </button>
      ))}
    </div>
  );
}