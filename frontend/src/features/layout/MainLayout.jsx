import React, { useState, useEffect } from 'react';
import SettingsModal from '../settings/SettingsModal';

export default function MainLayout() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  // Data State
  const [activeProviders, setActiveProviders] = useState([]);
  const [selectedProviderId, setSelectedProviderId] = useState('');
  const [selectedModel, setSelectedModel] = useState('');

  // Fetch Providers on Load (and when settings close)
  useEffect(() => {
    fetchProviders();
  }, [isSettingsOpen]); // Refetch when settings might have changed

  const fetchProviders = async () => {
    try {
      const res = await fetch('http://localhost:8004/api/providers/active');
      const data = await res.json();
      setActiveProviders(data);

      // Auto-select first provider if available and none selected
      if (data.length > 0 && !selectedProviderId) {
        setSelectedProviderId(data[0].id);
        setSelectedModel(data[0].models[0]);
      }
    } catch (err) {
      console.error("Failed to load providers");
    }
  };

  // Find the currently selected provider object to get its models
  const currentProvider = activeProviders.find(p => p.id === selectedProviderId);

  return (
    <div className="flex h-screen w-screen bg-app-bg text-white overflow-hidden font-sans">
      
      {/* SECTION 1: Sidebar (Left) */}
      <div className="w-64 bg-sidebar-bg border-r border-gray-800 flex flex-col justify-between flex-shrink-0">
        {/* Logo Area */}
        <div className="p-6">
          <h1 className="text-2xl font-bold tracking-wider text-white">
            <span className="text-accent">●</span> Onys
          </h1>
          <p className="text-xs text-gray-500 mt-1">Workspace AI</p>
        </div>
        
        {/* Sidebar Menu (Visual Placeholder) */}
        <div className="flex-1 px-4 py-2 space-y-1">
            <div className="bg-accent bg-opacity-10 text-accent p-2 rounded cursor-pointer text-sm font-medium">Dashboard</div>
            <div className="text-gray-400 p-2 hover:bg-gray-800 rounded cursor-pointer text-sm">Workspaces</div>
            <div className="text-gray-400 p-2 hover:bg-gray-800 rounded cursor-pointer text-sm">Agent Library</div>
            <div className="text-gray-400 p-2 hover:bg-gray-800 rounded cursor-pointer text-sm">Automation Hub</div>
        </div>

        {/* Settings Button */}
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

      {/* SECTION 2: Main Chat (Center) */}
      <div className="flex-1 flex flex-col min-w-0 bg-app-bg relative">
        
        {/* 2.1 Top Header Bar (Model/Agent Selectors) */}
        <div className="h-16 border-b border-gray-800 flex items-center justify-between px-6 bg-app-bg z-10">
            <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-xs font-bold text-white">MA</div>
                <button className="flex items-center gap-2 px-3 py-1.5 bg-[#222] hover:bg-[#333] rounded text-xs text-gray-300 border border-gray-700 transition">
                    👥 2 Agents
                </button>

                {/* DYNAMIC PROVIDER DROPDOWN */}
                <div className="relative">
                  <select 
                    value={selectedProviderId}
                    onChange={(e) => {
                      setSelectedProviderId(e.target.value);
                      // Reset model when provider changes
                      const newProv = activeProviders.find(p => p.id === e.target.value);
                      if (newProv) setSelectedModel(newProv.models[0]);
                    }}
                    className="appearance-none bg-[#222] hover:bg-[#333] text-gray-300 border border-gray-700 rounded px-3 py-1.5 pr-8 text-xs cursor-pointer focus:outline-none focus:border-accent transition"
                  >
                    {activeProviders.length === 0 && <option>No Providers Configured</option>}
                    {activeProviders.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                  {/* Custom Arrow Icon */}
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
                    <svg className="fill-current h-3 w-3" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"/></svg>
                  </div>
                </div>

                {/* DYNAMIC MODEL DROPDOWN */}
                {currentProvider && (
                  <div className="relative">
                    <select 
                      value={selectedModel}
                      onChange={(e) => setSelectedModel(e.target.value)}
                      className="appearance-none bg-[#222] hover:bg-[#333] text-accent border border-accent/20 rounded px-3 py-1.5 pr-8 text-xs cursor-pointer focus:outline-none focus:border-accent transition font-medium"
                    >
                      {currentProvider.models.map(m => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                     {/* Custom Arrow Icon */}
                     <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-accent">
                      <svg className="fill-current h-3 w-3" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"/></svg>
                    </div>
                  </div>
                )}
            </div>

            {/* Right Header Buttons (Kept same as before) */}
            <div className="flex items-center gap-3 text-gray-400">
                 <button className="hover:text-white px-3 py-1.5 rounded bg-[#222] text-xs border border-gray-700 transition">Project Notes: Coffee Campaign</button>
                 <button className="hover:text-white text-xs bg-accent text-white px-3 py-1.5 rounded transition">Save</button>
                 <button className="hover:text-white text-xs border border-gray-700 px-3 py-1.5 rounded transition">Export</button>
            </div>
        </div>
        

        {/* 2.2 Chat Content Area (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col items-center justify-center">
             {/* Mock Chat Conversation for Visual Check */}
             <div className="w-full max-w-3xl space-y-6">
                 
                 {/* Bot Message */}
                 <div className="flex items-start gap-4 text-left">
                    <div className="w-8 h-8 rounded-full bg-orange-600 flex-shrink-0 flex items-center justify-center text-[10px] font-bold">AI</div>
                    <div className="flex-1">
                        <div className="text-sm font-bold text-orange-400 mb-1">Creative Writer <span className="text-gray-500 text-xs font-normal ml-2">10:41 AM</span></div>
                        <p className="text-gray-300 text-sm leading-relaxed">Hello! How can I assist your creative process today? Let's brainstorm some ideas together.</p>
                    </div>
                 </div>
                 
                 {/* User Message */}
                 <div className="flex items-start gap-4 text-left justify-end">
                    <div className="bg-accent px-4 py-3 rounded-2xl rounded-tr-sm text-sm text-white max-w-[80%]">
                        I need to come up with a marketing slogan for a new eco-friendly coffee brand.
                    </div>
                    <div className="w-8 h-8 rounded-full bg-gray-500 flex-shrink-0 flex items-center justify-center text-[10px]">ME</div>
                 </div>

                  {/* Bot Reply */}
                  <div className="flex items-start gap-4 text-left">
                    <div className="w-8 h-8 rounded-full bg-orange-600 flex-shrink-0 flex items-center justify-center text-[10px] font-bold">AI</div>
                    <div className="flex-1">
                        <div className="text-sm font-bold text-orange-400 mb-1">Creative Writer <span className="text-gray-500 text-xs font-normal ml-2">10:42 AM</span></div>
                        <p className="text-gray-300 text-sm leading-relaxed mb-2">Of course! Here are a few ideas to get us started:</p>
                        <ol className="list-decimal pl-5 text-gray-300 text-sm space-y-1">
                            <li>"Sip Sustainably."</li>
                            <li>"Your Daily Grind, Kind to the Earth."</li>
                            <li>"Goodness in Every Cup."</li>
                        </ol>
                    </div>
                 </div>

            </div>
        </div>

        {/* 2.3 Bottom Input Area (Sticky) */}
        <div className="p-6 pt-2 bg-app-bg">
            <div className="max-w-4xl mx-auto bg-[#1a1a1a] border border-gray-700 rounded-xl p-3 flex flex-col gap-2 shadow-lg">
                <input 
                        type="textarea" 
                        placeholder={`Message ${selectedModel || '...'}...`}
                        className="w-full bg-transparent text-gray-200 placeholder-gray-500 text-sm focus:outline-none px-2 py-1"
                    />
                <div className="flex justify-between items-center mt-2 border-t border-gray-800 pt-2">
                    <div className="flex gap-2">
                        <button className="w-9 h-9 flex items-center justify-center hover:bg-gray-800 rounded-md text-gray-400 text-xl transition" title="Attach file">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" >
                            <path d="m16 6-8.414 8.586a2 2 0 0 0 2.829 2.829l8.414-8.586a4 4 0 1 0-5.657-5.657l-8.379 8.551a6 6 0 1 0 8.485 8.485l8.379-8.551"></path>
                        </svg>
                        </button>
                        <button className="w-9 h-9 flex items-center justify-center hover:bg-gray-800 rounded-md text-gray-400 text-xl transition" title="Enhance prompt">
                            ✨
                        </button>
                    </div>
                    <button className="bg-gray-700 text-white p-2 px-4 rounded hover:bg-gray-600 transition text-xs font-bold">
                        SEND ➤
                    </button>
                </div>
            </div>
            <div className="text-center text-[10px] text-gray-600 mt-2 flex justify-between px-2 max-w-4xl mx-auto">
                 <span>Context: 1,248 / 8192</span>
                 <span>Onys AI v0.1</span>
            </div>
        </div>

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

      {/* Settings Modal (Overlay) */}
      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
      />
    </div>
  );
}