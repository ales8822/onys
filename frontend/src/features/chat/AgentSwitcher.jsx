import React, { useState, useEffect, useRef } from 'react';

export default function AgentSwitcher({ selectedAgent, onSelectAgent }) {
    const [isOpen, setIsOpen] = useState(false);
    const [agents, setAgents] = useState([]);
    const wrapperRef = useRef(null);

    useEffect(() => {
        fetchAgents();

        // Close on click outside
        function handleClickOutside(event) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const fetchAgents = async () => {
        try {
            const res = await fetch('http://localhost:8004/api/agents/');
            const data = await res.json();
            setAgents(data);
        } catch (err) {
            console.error("Failed to fetch agents for switcher", err);
        }
    };

    const handleSelect = (agent) => {
        onSelectAgent(agent);
        setIsOpen(false);
    };

    return (
        <div className="relative" ref={wrapperRef}>
            {/* Trigger Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-t-lg text-xs font-medium transition-all ${selectedAgent
                        ? 'bg-accent text-white'
                        : 'bg-[#222] text-gray-400 hover:text-gray-200'
                    }`}
            >
                {selectedAgent ? (
                    <>
                        <span className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center text-[8px]">
                            {selectedAgent.name.substring(0, 2).toUpperCase()}
                        </span>
                        <span>{selectedAgent.name}</span>
                    </>
                ) : (
                    <>
                        <span>🤖</span>
                        <span>Default Assistant</span>
                    </>
                )}
                <span className="opacity-50 text-[10px]">▼</span>
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="absolute bottom-full left-0 mb-1 w-64 bg-[#1a1a1a] border border-gray-700 rounded-lg shadow-xl overflow-hidden z-50 flex flex-col max-h-64">
                    <div className="p-2 border-b border-gray-800 bg-[#111]">
                        <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">Select Agent</p>
                    </div>

                    <div className="overflow-y-auto flex-1 p-1">
                        <button
                            onClick={() => handleSelect(null)}
                            className={`w-full text-left px-3 py-2 rounded text-xs flex items-center gap-2 ${!selectedAgent ? 'bg-accent text-white' : 'text-gray-300 hover:bg-gray-800'
                                }`}
                        >
                            <span className="w-5 h-5 rounded-full bg-gray-700 flex items-center justify-center text-[10px]">🤖</span>
                            <div>
                                <div className="font-medium">Default Assistant</div>
                                <div className="text-[10px] opacity-70">Standard AI behavior</div>
                            </div>
                        </button>

                        {agents.map(agent => (
                            <button
                                key={agent.id}
                                onClick={() => handleSelect(agent)}
                                className={`w-full text-left px-3 py-2 rounded text-xs flex items-center gap-2 mt-1 ${selectedAgent?.id === agent.id ? 'bg-accent text-white' : 'text-gray-300 hover:bg-gray-800'
                                    }`}
                            >
                                <span className="w-5 h-5 rounded-full bg-indigo-900 flex items-center justify-center text-[10px]">
                                    {agent.name.substring(0, 2).toUpperCase()}
                                </span>
                                <div className="min-w-0">
                                    <div className="font-medium truncate">{agent.name}</div>
                                    <div className="text-[10px] opacity-70 truncate">{agent.role}</div>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
