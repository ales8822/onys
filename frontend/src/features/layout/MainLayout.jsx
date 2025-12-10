import React, { useState, useEffect } from 'react';
import SettingsModal from '../settings/SettingsModal';
import InstructionModal from '../instructions/InstructionModal';
import ChatArea from '../chat/ChatArea'; // Using the dedicated ChatArea component
import SidebarSessionList from '../sessions/SidebarSessionList';

export default function MainLayout() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isInstructionsOpen, setIsInstructionsOpen] = useState(false);
  
  // Data State
  const [activeProviders, setActiveProviders] = useState([]);
  const [selectedProviderId, setSelectedProviderId] = useState('');
  const [selectedModel, setSelectedModel] = useState('');
  
  // Chat State
  const [chatHistory, setChatHistory] = useState([]); 
  const [chatId, setChatId] = useState(() => "session-" + Math.random().toString(36).substr(2, 9));

  // Fetch Providers on Load
  useEffect(() => {
    fetchProviders();
  }, [isSettingsOpen]); 

  const fetchProviders = async () => {
    try {
      const res = await fetch('http://localhost:8004/api/providers/active');
      const data = await res.json();
      setActiveProviders(data);

      if (data.length > 0 && !selectedProviderId) {
        setSelectedProviderId(data[0].id);
        setSelectedModel(data[0].models[0]);
      }
    } catch (err) {
      console.error("Failed to load providers");
    }
  };

  const handleNewChat = () => {
    setChatHistory([]);
    setChatId("session-" + Math.random().toString(36).substr(2, 9));
  };

  const handleLoadSession = async (sessionId) => {
    try {
      const res = await fetch(`http://localhost:8004/api/sessions/${sessionId}`);
      const data = await res.json();
      
      setChatHistory(data); // Restore visual history
      setChatId(sessionId); // Set internal ID so future messages append to this file
    } catch (err) {
      console.error("Failed to load session", err);
    }
  };

  const handleDeleteSession = (deletedId) => {
    // If the deleted session is the one currently open, clear the screen
    if (deletedId === chatId) {
        handleNewChat();
    }
    // Force refresh list (trigger) is handled locally in sidebar, 
    // but we can increment this to be safe if needed.
  };

  const currentProvider = activeProviders.find(p => p.id === selectedProviderId);

  return (
    <div className="flex h-screen w-screen bg-app-bg text-white overflow-hidden font-sans">
      
      {/* SECTION 1: Sidebar (Left) */}
      <div className="w-64 bg-sidebar-bg border-r border-gray-800 flex flex-col justify-between flex-shrink-0">
        <div className="p-6">
          <h1 className="text-2xl font-bold tracking-wider text-white">
            <span className="text-accent">●</span> Onys
          </h1>
          <p className="text-xs text-gray-500 mt-1">Workspace AI</p>
        </div>
        
        {/* Visual Menu Placeholders */}
        <div className="flex-1 px-4 py-2 space-y-1">
          {/* Real Session History */}
        <SidebarSessionList 
            onSelectSession={handleLoadSession} 
            currentChatId={chatId}
            onDeleteSession={handleDeleteSession}
            refreshTrigger={chatHistory.length} // Force refresh list when chat changes
        />
            <div className="bg-accent bg-opacity-10 text-accent p-2 rounded cursor-pointer text-sm font-medium">Dashboard</div>
            <div className="text-gray-400 p-2 hover:bg-gray-800 rounded cursor-pointer text-sm">Workspaces</div>
            <div className="text-gray-400 p-2 hover:bg-gray-800 rounded cursor-pointer text-sm">Agent Library</div>
            <div className="text-gray-400 p-2 hover:bg-gray-800 rounded cursor-pointer text-sm">Automation Hub</div>
        </div>

        <div className="p-4 border-t border-gray-800">
          <button 
            onClick={() => setIsSettingsOpen(true)}
            className="flex items-center gap-3 w-full p-3 text-gray-300 hover:bg-gray-800 rounded transition-colors"
          >
            <span className="text-xl">⚙️</span>
            <span>Settings</span>
          </button>
        </div>
      </div>

      {/* SECTION 2: Center Layout (Header + ChatArea) */}
      <div className="flex-1 flex flex-col min-w-0 bg-app-bg relative">
        
        {/* 2.1 Top Header Bar */}
        <div className="h-16 border-b border-gray-800 flex items-center justify-between px-6 bg-app-bg z-10 flex-shrink-0">
            <div className="flex items-center gap-3">
                {/* Agent Avatar & Selector */}
                <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-xs font-bold text-white shadow-sm">MA</div>
                <button className="flex items-center gap-2 px-3 py-1.5 bg-[#222] hover:bg-[#333] rounded text-xs text-gray-300 border border-gray-700 transition">
                    👥 2 Agents
                </button>

                {/* DYNAMIC PROVIDER DROPDOWN */}
                <div className="relative group">
                  <select 
                    value={selectedProviderId}
                    onChange={(e) => {
                      setSelectedProviderId(e.target.value);
                      const newProv = activeProviders.find(p => p.id === e.target.value);
                      if (newProv) setSelectedModel(newProv.models[0]);
                    }}
                    className="appearance-none bg-[#222] hover:bg-[#333] text-gray-300 border border-gray-700 rounded px-3 py-1.5 pr-8 text-xs cursor-pointer focus:outline-none focus:border-accent transition min-w-[100px]"
                  >
                    {activeProviders.length === 0 && <option>No Providers</option>}
                    {activeProviders.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                   <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">▼</div>
                </div>

                {/* DYNAMIC MODEL DROPDOWN */}
                {currentProvider && (
                  <div className="relative group">
                    <select 
                      value={selectedModel}
                      onChange={(e) => setSelectedModel(e.target.value)}
                      className="appearance-none bg-[#222] hover:bg-[#333] text-accent border border-accent/20 rounded px-3 py-1.5 pr-8 text-xs cursor-pointer focus:outline-none focus:border-accent transition font-medium min-w-[140px]"
                    >
                      {currentProvider.models.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-accent">▼</div>
                  </div>
                )}
            </div>

            {/* Right Header Buttons (Restored) */}
            <div className="flex items-center gap-3 text-gray-400">
                 <button 
                    className="hover:text-white px-3 py-1.5 rounded bg-[#222] text-xs border border-gray-700 transition"
                    title="View Project Notes"
                 >
                    Project Notes: Coffee Campaign
                 </button>

                 <button 
                    onClick={handleNewChat}
                    className="hover:text-white text-xs bg-red-900/30 text-red-400 border border-red-900/50 px-3 py-1.5 rounded transition flex items-center gap-2"
                 >
                    <span>🗑️</span> New Chat
                 </button>

                 <button 
                    onClick={() => setIsInstructionsOpen(true)}
                    className="hover:text-white text-xs bg-gray-800 text-gray-300 border border-gray-700 px-3 py-1.5 rounded transition"
                 >
                    📜 Instructions
                 </button>

                 <button className="hover:text-white text-xs bg-accent text-white px-3 py-1.5 rounded transition shadow-md hover:shadow-lg">Save</button>
                 <button className="hover:text-white text-xs border border-gray-700 px-3 py-1.5 rounded transition hover:bg-gray-800">Export</button>
            </div>
        </div>
                
        {/* 2.2 MAIN CHAT AREA (Component) */}
        {/* We use the ChatArea component here to handle messages, input, and timeline */}
        <ChatArea 
          chatHistory={chatHistory} 
          setChatHistory={setChatHistory}
          selectedProviderId={selectedProviderId}
          selectedModel={selectedModel}
          chatId={chatId}
        />

      </div>

      {/* SECTION 3: Context/Notes (Right) */}
      <div className="w-80 border-l border-gray-800 bg-[#151515] p-6 hidden xl:block flex-shrink-0">
        <div className="flex justify-between items-center mb-6">
            <h3 className="text-xs font-bold text-accent uppercase tracking-widest">
            Project Notes
            </h3>
            <span className="text-xs text-gray-500 bg-[#222] px-2 py-1 rounded">Coffee Campaign</span>
        </div>
        
        <div className="space-y-6">
            <div>
                <h4 className="text-white text-sm font-bold mb-2">Marketing Slogans</h4>
                <p className="text-xs text-gray-500 mb-2 italic">Drag responses here or start typing.</p>
                <ul className="text-sm text-gray-300 space-y-2 list-disc pl-4 marker:text-gray-600">
                    <li className="pl-1">Sip Sustainably.</li>
                    <li className="pl-1">Your Daily Grind, Kind to the Earth.</li>
                    <li className="pl-1">Goodness in Every Cup.</li>
                </ul>
            </div>

            <div className="border-t border-gray-800 pt-4">
                <h4 className="text-white text-sm font-bold mb-2">Next Steps</h4>
                <p className="text-sm text-gray-400 leading-relaxed">
                    We need to select the top 3 slogans and run a small poll with our target audience.
                </p>
            </div>
            
             <div className="mt-4 p-3 bg-accent bg-opacity-10 border border-accent/20 rounded text-xs text-accent font-mono break-all">
                /switch_agent Market Analyst
            </div>
        </div>
      </div>

      {/* Modals */}
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
      <InstructionModal isOpen={isInstructionsOpen} onClose={() => setIsInstructionsOpen(false)} chatId={chatId} />
    </div>
  );
}