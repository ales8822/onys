import React, { useState, useEffect } from 'react';
import SettingsModal from '../settings/SettingsModal';
import InstructionModal from '../instructions/InstructionModal';
import ChatArea from '../chat/ChatArea';
import SidebarSessionList from '../sessions/SidebarSessionList';
import AgentLibrary from '../agents/AgentLibrary'; // Import AgentLibrary

export default function MainLayout() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isInstructionsOpen, setIsInstructionsOpen] = useState(false);

  // View State
  const [activeView, setActiveView] = useState('chat'); // 'chat' | 'agents'

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
    setActiveView('chat'); // Switch back to chat on new chat
  };

  const handleLoadSession = async (sessionId) => {
    try {
      const res = await fetch(`http://localhost:8004/api/sessions/${sessionId}`);
      const data = await res.json();

      setChatHistory(data);
      setChatId(sessionId);
      setActiveView('chat'); // Switch back to chat on load
    } catch (err) {
      console.error("Failed to load session", err);
    }
  };

  const handleDeleteSession = (deletedId) => {
    if (deletedId === chatId) {
      handleNewChat();
    }
  };

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
            refreshTrigger={chatHistory.length}
          />
          <div className="bg-accent bg-opacity-10 text-accent p-2 rounded cursor-pointer text-sm font-medium">Dashboard</div>
          <div className="text-gray-400 p-2 hover:bg-gray-800 rounded cursor-pointer text-sm">Workspaces</div>
          <div
            onClick={() => setActiveView('agents')}
            className={`p-2 rounded cursor-pointer text-sm transition ${activeView === 'agents' ? 'bg-gray-800 text-white' : 'text-gray-400 hover:bg-gray-800'}`}
          >
            Agent Library
          </div>
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

      {/* SECTION 2: Center Layout (Content) */}
      <div className="flex-1 flex flex-col min-w-0 bg-app-bg relative">
        {activeView === 'chat' ? (
          <ChatArea
            chatHistory={chatHistory}
            setChatHistory={setChatHistory}
            selectedProviderId={selectedProviderId}
            selectedModel={selectedModel}
            chatId={chatId}
            activeProviders={activeProviders}
            setSelectedProviderId={setSelectedProviderId}
            setSelectedModel={setSelectedModel}
          />
        ) : (
          <AgentLibrary onClose={() => setActiveView('chat')} />
        )}
      </div>

      {/* SECTION 3: Context/Notes (Right) - Only in Chat View */}
      {activeView === 'chat' && (
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
      )}

      {/* Modals */}
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
      <InstructionModal isOpen={isInstructionsOpen} onClose={() => setIsInstructionsOpen(false)} chatId={chatId} />
    </div>
  );
}