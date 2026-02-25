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

  // Organize sessions into a hierarchy: [ { ...msg, children: [ ... ] } ]
  const organizedData = (() => {
    const roots = [];
    const childrenMap = {};
    const debates = [];

    sessions.forEach(s => {
      if (s.meta?.is_debate) {
        debates.push(s);
      } else if (s.meta?.parent_id) {
        if (!childrenMap[s.meta.parent_id]) childrenMap[s.meta.parent_id] = [];
        childrenMap[s.meta.parent_id].push(s);
      } else {
        roots.push(s);
      }
    });

    const orphans = [];
    Object.keys(childrenMap).forEach(parentId => {
      const parentExists = sessions.some(s => s.id === parentId);
      if (!parentExists) {
        orphans.push(...childrenMap[parentId]);
      }
    });

    return {
      chats: [...roots, ...orphans].map(root => ({
        ...root,
        branches: childrenMap[root.id] || []
      })),
      debates
    };
  })();

  const renderSessionItem = (session, isBranch = false) => (
    <div
      key={session.id}
      onClick={() => onSelectSession(session.id)}
      className={`group relative w-full text-left rounded text-sm transition-colors cursor-pointer flex justify-between items-center ${
        isBranch ? 'ml-4 mt-0.5 border-l border-gray-800' : ''
      } ${
        currentChatId === session.id 
          ? 'bg-[#2a2a2a] text-white border-l-2 border-accent' 
          : 'text-gray-400 hover:bg-[#1f1f1f] hover:text-gray-200'
      } ${isBranch ? 'px-2 py-1.5 text-xs' : 'px-3 py-2'}`}
    >
      <div className="flex items-center gap-2 truncate pr-4">
        {isBranch && (
          <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-gray-600">
            <path d="M18 9a9 9 0 0 1-9 9"></path><circle cx="18" cy="6" r="3"></circle>
          </svg>
        )}
        <span className="truncate" title={isBranch ? `Branch of ${session.meta?.parent_title || 'Original'}` : session.title}>
          {isBranch && session.title === "New Chat" 
            ? `Branch: ${session.meta?.parent_title || 'Original'}` 
            : session.title}
        </span>
      </div>
      
      {/* Delete Button */}
      <button 
        onClick={(e) => handleDeleteClick(e, session.id)}
        className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-500 transition-all p-1"
        title="Delete Chat"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
      </button>
    </div>
  );

  return (
    <div className="flex-1 overflow-y-auto px-2 py-2 space-y-4 no-scrollbar">
      {/* Clear All Button */}
      {sessions.length > 0 && (
        <div className="px-2">
          <button 
            onClick={async () => {
              if (window.confirm("Are you sure you want to PERMANENTLY delete ALL chat history? This cannot be undone.")) {
                try {
                  await fetch('http://localhost:8004/api/sessions/', { method: 'DELETE' });
                  setSessions([]);
                } catch (err) {
                  alert("Failed to clear history");
                }
              }
            }}
            className="w-full py-2 bg-red-900/20 hover:bg-red-900/40 text-red-400 text-xs font-bold rounded border border-red-900/30 transition-all flex items-center justify-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
            CLEAR ALL HISTORY
          </button>
        </div>
      )}

      {/* Regular Chats */}
      <div className="space-y-1">
        <div className="px-2 pb-2 text-xs font-bold text-gray-500 uppercase tracking-wider">
          Recent Chats
        </div>
        
        {organizedData.chats.length === 0 && (
          <div className="text-xs text-gray-600 px-2 italic">No chats yet.</div>
        )}

        {organizedData.chats.map((group) => (
          <React.Fragment key={group.id}>
            {renderSessionItem(group)}
            {group.branches.map(branch => renderSessionItem(branch, true))}
          </React.Fragment>
        ))}
      </div>

      {/* Debate Section */}
      <div className="space-y-1">
        <div className="px-2 pb-2 text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
          <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
          War Room Debates
        </div>

        {organizedData.debates.length === 0 && (
          <div className="text-xs text-gray-600 px-2 italic">No debates yet.</div>
        )}

        {organizedData.debates.map((debate) => renderSessionItem(debate))}
      </div>
    </div>
  );
}