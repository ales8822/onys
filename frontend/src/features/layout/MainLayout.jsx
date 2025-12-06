import React, { useState } from 'react';
import SettingsModal from '../settings/SettingsModal';

export default function MainLayout() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

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
                <button className="flex items-center gap-2 px-3 py-1.5 bg-[#222] hover:bg-[#333] rounded text-xs text-gray-300 border border-gray-700 transition">
                   Google Gemini ▾
                </button>
                <button className="flex items-center gap-2 px-3 py-1.5 bg-[#222] hover:bg-[#333] rounded text-xs text-accent border border-accent/20 transition">
                   ● Gemini 2.5 Flash ▾
                </button>
            </div>

            {/* Right Header Buttons */}
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
                    type="text" 
                    placeholder="Message Gemini 2.5 Flash..." 
                    className="w-full bg-transparent text-gray-200 placeholder-gray-500 text-sm focus:outline-none px-2 py-1"
                />
                <div className="flex justify-between items-center mt-2 border-t border-gray-800 pt-2">
                    <div className="flex gap-1">
                        <button className="p-2 hover:bg-gray-800 rounded text-gray-400 text-lg transition">📎</button>
                        <button className="p-2 hover:bg-gray-800 rounded text-gray-400 text-lg transition">✨</button>
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