import React, { useState, useEffect, useRef } from 'react';
import MarkdownRenderer from '../chat/MarkdownRenderer';

export default function DebateRoom({ activeProviders, onClose }) {
    const [agents, setAgents] = useState([]);
    const [agent1, setAgent1] = useState(null);
    const [agent2, setAgent2] = useState(null);
    const [topic, setTopic] = useState("");
    const [rounds, setRounds] = useState(3);
    const [isDebating, setIsDebating] = useState(false);
    const [chatHistory, setChatHistory] = useState([]);
    const [chatId, setChatId] = useState(() => "debate-" + Math.random().toString(36).substr(2, 9));
    const [currentTurn, setCurrentTurn] = useState(0);
    const endRef = useRef(null);
    const stopRef = useRef(false);
    const abortControllerRef = useRef(null);

    const startNewDebate = () => {
        setChatId("debate-" + Math.random().toString(36).substr(2, 9));
        setChatHistory([]);
        setIsDebating(false);
        setCurrentTurn(0);
        stopRef.current = false;
    };

    const [agent1Prov, setAgent1Prov] = useState("");
    const [agent1Model, setAgent1Model] = useState("");
    const [agent2Prov, setAgent2Prov] = useState("");
    const [agent2Model, setAgent2Model] = useState("");

    useEffect(() => {
        fetchAgents();
    }, []);

    useEffect(() => {
        if (agent1) {
            const defaultProv = agent1.provider_id || activeProviders[0]?.id || "";
            setAgent1Prov(defaultProv);
            const prov = activeProviders.find(p => p.id === defaultProv);
            setAgent1Model(agent1.model_id || prov?.models[0] || "");
        }
    }, [agent1, activeProviders]);

    useEffect(() => {
        if (agent2) {
            const defaultProv = agent2.provider_id || (activeProviders.length > 1 ? activeProviders[1].id : activeProviders[0]?.id) || "";
            setAgent2Prov(defaultProv);
            const prov = activeProviders.find(p => p.id === defaultProv);
            setAgent2Model(agent2.model_id || prov?.models[0] || "");
        }
    }, [agent2, activeProviders]);

    useEffect(() => {
        if (endRef.current) {
            endRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [chatHistory]);

    const fetchAgents = async () => {
        try {
            const res = await fetch('http://localhost:8004/api/agents/');
            const data = await res.json();
            setAgents(data);
            if (data.length >= 2) {
                setAgent1(data[0]);
                setAgent2(data[1]);
            } else if (data.length === 1) {
                setAgent1(data[0]);
                setAgent2(data[0]);
            }
        } catch (err) {
            console.error("Failed to fetch agents", err);
        }
    };

    const startDebate = async () => {
        if (!agent1 || !agent2 || !topic.trim()) return;
        setIsDebating(true);
        stopRef.current = false;
        setChatHistory([]);

        // Initial setup message
        const initialMsg = {
            role: 'user',
            content: `A debate has started between ${agent1.name} and ${agent2.name} on the topic: "${topic}".`,
            id: Date.now()
        };
        setChatHistory([initialMsg]);

        // Start the loop
        let currentHistory = [initialMsg];

        for (let i = 0; i < rounds; i++) {
            if (stopRef.current) break;

            // Agent 1 Turn
            const a1Response = await getAgentResponse(agent1, agent2, currentHistory, topic, i + 1, 1, agent1Prov, agent1Model);
            if (!a1Response || stopRef.current) break;
            currentHistory = [...currentHistory, a1Response];
            setChatHistory(currentHistory);

            // Agent 2 Turn
            const a2Response = await getAgentResponse(agent2, agent1, currentHistory, topic, i + 1, 2, agent2Prov, agent2Model);
            if (!a2Response || stopRef.current) break;
            currentHistory = [...currentHistory, a2Response];
            setChatHistory(currentHistory);
        }
        setIsDebating(false);
    };

    const getAgentResponse = async (actor, opponent, history, topic, roundNum, turn, provId, modelId) => {
        setCurrentTurn(turn);
        const assistantMsgId = Date.now();

        // Add placeholder
        const placeholder = {
            role: 'assistant',
            content: "",
            id: assistantMsgId,
            agent: actor,
            round: roundNum
        };
        setChatHistory(prev => [...prev, placeholder]);

        // map history to persona-aware roles: 
        // actor's previous turns are assistant, everything else (opponent, setup) is user
        const mappedMessages = history.map(m => {
            let role = m.role;
            if (m.agent) {
                role = (m.agent.id === actor.id) ? 'assistant' : 'user';
            }
            return { role, content: m.content };
        });

        try {
            abortControllerRef.current = new AbortController();
            const res = await fetch('http://localhost:8004/api/chat/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                signal: abortControllerRef.current.signal,
                body: JSON.stringify({
                    chat_id: chatId,
                    provider_id: provId || actor.provider_id || activeProviders[0]?.id,
                    model_id: modelId || actor.model_id || activeProviders[0]?.models[0],
                    messages: mappedMessages,
                    agent_id: actor.id,
                    custom_prompt: `You are ${actor.name}. You are in a debate with ${opponent.name} about "${topic}". This is round ${roundNum}.\n\nSTRICT RULES:\n1. Speak ONLY as ${actor.name}.\n2. Do NOT generate any dialogue or reactions for ${opponent.name}.\n3. Respond to the previous points and advance your argument.`
                }),
            });

            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                console.error("Debate API error:", errData);
                return null;
            }

            if (!res.body) throw new Error("No response body");

            const reader = res.body.getReader();
            const decoder = new TextDecoder();
            let fullContent = "";
            let hasError = false;
            let buffer = "";

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop(); // Keep partial line in buffer

                for (const line of lines) {
                    if (!line.trim()) continue;
                    try {
                        const data = JSON.parse(line);
                        if (data.chunk) {
                            fullContent += data.chunk;
                            setChatHistory(prev => prev.map(msg =>
                                msg.id === assistantMsgId ? { ...msg, content: fullContent } : msg
                            ));
                        }
                        if (data.usage) {
                            setChatHistory(prev => prev.map(msg =>
                                msg.id === assistantMsgId ? { ...msg, meta: data.usage } : msg
                            ));
                        }
                        if (data.error) {
                            console.error("Backend debate error:", data.error);
                            setChatHistory(prev => prev.map(msg =>
                                msg.id === assistantMsgId ? { ...msg, content: msg.content + "\n\n[Error: " + data.error + "]" } : msg
                            ));
                            hasError = true;
                        }
                    } catch (e) {
                        console.error("Debate chunk parse error:", e, "Line:", line);
                    }
                }
            }

            // Log final result for debugging
            console.log(`Debate Response for ${actor.name}:`, { length: fullContent.length, hasError });

            if (hasError || !fullContent.trim()) {
                console.warn(`Turn failed for ${actor.name}. Content empty? ${!fullContent.trim()}`);
                return null;
            }

            return { role: 'assistant', content: fullContent, agent: actor, id: assistantMsgId };
        } catch (error) {
            if (error.name === 'AbortError') {
                console.log(`Turn for ${actor.name} aborted.`);
                setChatHistory(prev => prev.map(msg =>
                    msg.id === assistantMsgId ? { ...msg, content: msg.content + "\n\n*[Debate Aborted]*" } : msg
                ));
                return { role: 'assistant', content: "Aborted", agent: actor, id: assistantMsgId };
            }
            console.error("Debate network error:", error);
            return null;
        } finally {
            abortControllerRef.current = null;
        }
    };

    return (
        <div className="flex flex-col h-full bg-[#0a0a0a] text-white">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800 bg-[#111]">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-red-600 rounded flex items-center justify-center font-bold text-xs shadow-[0_0_15px_rgba(220,38,38,0.5)]">WR</div>
                    <div>
                        <h2 className="text-lg font-bold tracking-tight">The War Room</h2>
                        <p className="text-[10px] text-gray-500 uppercase tracking-widest font-medium">Agent Debate Arena</p>
                    </div>
                </div>
                <button onClick={onClose} className="text-xs text-gray-500 hover:text-white transition">Exit Arena</button>
            </div>

            {!isDebating && chatHistory.length === 0 ? (
                /* Setup View */
                <div className="flex-1 flex items-center justify-center p-6">
                    <div className="w-full max-w-2xl bg-[#111] border border-gray-800 rounded-xl p-8 shadow-2xl">
                        <h3 className="text-xl font-bold mb-6 text-center">Prepare the Debate</h3>

                        <div className="grid grid-cols-2 gap-6 mb-8">
                            {/* Agent 1 Setup */}
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Affirmative Participant</label>
                                    <select
                                        className="w-full bg-[#1a1a1a] border border-gray-700 rounded-lg p-3 text-sm focus:border-red-500 outline-none transition"
                                        value={agent1?.id || ""}
                                        onChange={(e) => setAgent1(agents.find(a => a.id === e.target.value))}
                                    >
                                        {agents.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                                    </select>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="space-y-1">
                                        <label className="text-[9px] font-bold text-gray-500 uppercase">Provider</label>
                                        <select
                                            className="w-full bg-[#111] border border-gray-800 rounded px-2 py-1.5 text-[10px] focus:border-red-900 outline-none"
                                            value={agent1Prov}
                                            onChange={(e) => {
                                                const pId = e.target.value;
                                                setAgent1Prov(pId);
                                                const p = activeProviders.find(ap => ap.id === pId);
                                                if (p) setAgent1Model(p.models[0]);
                                            }}
                                        >
                                            {activeProviders.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[9px] font-bold text-gray-500 uppercase">Model</label>
                                        <select
                                            className="w-full bg-[#111] border border-gray-800 rounded px-2 py-1.5 text-[10px] focus:border-red-900 outline-none text-red-400 font-medium"
                                            value={agent1Model}
                                            onChange={(e) => setAgent1Model(e.target.value)}
                                        >
                                            {activeProviders.find(p => p.id === agent1Prov)?.models.map(m => (
                                                <option key={m} value={m}>{m}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Agent 2 Setup */}
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Opponent Participant</label>
                                    <select
                                        className="w-full bg-[#1a1a1a] border border-gray-700 rounded-lg p-3 text-sm focus:border-blue-500 outline-none transition"
                                        value={agent2?.id || ""}
                                        onChange={(e) => setAgent2(agents.find(a => a.id === e.target.value))}
                                    >
                                        {agents.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                                    </select>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="space-y-1">
                                        <label className="text-[9px] font-bold text-gray-500 uppercase">Provider</label>
                                        <select
                                            className="w-full bg-[#111] border border-gray-800 rounded px-2 py-1.5 text-[10px] focus:border-blue-900 outline-none"
                                            value={agent2Prov}
                                            onChange={(e) => {
                                                const pId = e.target.value;
                                                setAgent2Prov(pId);
                                                const p = activeProviders.find(ap => ap.id === pId);
                                                if (p) setAgent2Model(p.models[0]);
                                            }}
                                        >
                                            {activeProviders.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[9px] font-bold text-gray-500 uppercase">Model</label>
                                        <select
                                            className="w-full bg-[#111] border border-gray-800 rounded px-2 py-1.5 text-[10px] focus:border-blue-900 outline-none text-blue-400 font-medium"
                                            value={agent2Model}
                                            onChange={(e) => setAgent2Model(e.target.value)}
                                        >
                                            {activeProviders.find(p => p.id === agent2Prov)?.models.map(m => (
                                                <option key={m} value={m}>{m}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4 mb-8">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-500 uppercase">Battleground (Topic)</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Is remote work better for innovation?"
                                    className="w-full bg-[#1a1a1a] border border-gray-700 rounded-lg p-4 text-white focus:border-accent outline-none transition"
                                    value={topic}
                                    onChange={(e) => setTopic(e.target.value)}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-500 uppercase flex justify-between">
                                    <span>Intensity (Rounds)</span>
                                    <span className="text-accent">{rounds}</span>
                                </label>
                                <input
                                    type="range" min="1" max="10"
                                    className="w-full accent-accent"
                                    value={rounds}
                                    onChange={(e) => setRounds(parseInt(e.target.value))}
                                />
                            </div>
                        </div>

                        <button
                            onClick={startDebate}
                            disabled={!topic.trim() || agent1?.id === agent2?.id}
                            className="w-full bg-red-600 hover:bg-red-500 py-4 rounded-xl font-bold transition shadow-[0_0_20px_rgba(220,38,38,0.3)] disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {!topic.trim() ? "ENTER A TOPIC" : (agent1?.id === agent2?.id ? "SELECT DIFFERENT AGENTS" : "ENGAGE DEBATE")}
                        </button>
                        {(!agent1?.provider_id && !activeProviders[0]) && (
                            <p className="text-[10px] text-red-500 mt-2 text-center">Warning: No active providers found. Debate may fail.</p>
                        )}
                    </div>
                </div>
            ) : (
                /* Debate View */
                <div className="flex-1 flex flex-col overflow-hidden">
                    <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-[radial-gradient(circle_at_center,rgba(220,38,38,0.05)_0%,transparent_100%)]">
                        {chatHistory.map((msg, i) => (
                            <div key={i} className={`flex flex-col ${msg.role === 'system' ? 'items-center' : 'items-start'}`}>
                                {msg.role === 'system' ? (
                                    <div className="px-4 py-1.5 bg-gray-800/50 border border-gray-700 rounded-full text-[10px] text-gray-400 uppercase tracking-widest font-bold">
                                        {msg.content}
                                    </div>
                                ) : (
                                    <div className={`w-full max-w-4xl mx-auto flex gap-4 ${msg.agent?.id === agent2?.id ? 'flex-row-reverse' : ''}`}>
                                        <div className={`w-10 h-10 rounded-full border-2 flex-shrink-0 flex items-center justify-center font-bold text-xs ${msg.agent?.id === agent1?.id ? 'border-red-600 bg-red-950/30' : 'border-blue-600 bg-blue-950/30'}`}>
                                            {msg.agent?.name?.substring(0, 1)}
                                        </div>
                                        <div className={`flex flex-col ${msg.agent?.id === agent2?.id ? 'items-end' : 'items-start'} flex-1`}>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className={`text-[10px] font-bold uppercase tracking-widest ${msg.agent?.id === agent1?.id ? 'text-red-400' : 'text-blue-400'}`}>{msg.agent?.name}</span>
                                                <span className="text-[9px] text-gray-500">ROUND {msg.round}</span>
                                            </div>
                                            <div className={`p-4 rounded-2xl bg-[#111] border border-gray-800 text-sm text-gray-200 shadow-lg w-fit max-w-full ${msg.agent?.id === agent2?.id ? 'rounded-tr-none border-blue-900/30' : 'rounded-tl-none border-red-900/30'}`}>
                                                <MarkdownRenderer content={msg.content} />
                                                {msg.content === "" && !isDebating && (
                                                    <span className="text-red-500 italic text-xs">[Silent or Failed Turn]</span>
                                                )}
                                                {msg.content === "" && isDebating && (
                                                    <div className="flex gap-1 items-center py-1">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-gray-600 animate-bounce"></div>
                                                        <div className="w-1.5 h-1.5 rounded-full bg-gray-600 animate-bounce [animation-delay:0.2s]"></div>
                                                        <div className="w-1.5 h-1.5 rounded-full bg-gray-600 animate-bounce [animation-delay:0.4s]"></div>
                                                    </div>
                                                )}
                                            </div>
                                            {msg.meta && (
                                                <div className="mt-1 text-[9px] text-gray-600 px-2 italic">
                                                    Generated with {msg.meta.total_tokens} tokens
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                        <div ref={endRef} className="h-4 w-full" />
                    </div>

                    {/* Foot Control */}
                    {isDebating && (
                        <div className="p-4 border-t border-gray-800 bg-[#0a0a0a] flex justify-center">
                            <button
                                onClick={() => {
                                    setIsDebating(false);
                                    stopRef.current = true;
                                    if (abortControllerRef.current) abortControllerRef.current.abort();
                                }}
                                className="px-6 py-2 bg-red-600 hover:bg-red-500 text-white rounded-full text-xs font-bold border border-red-900 shadow-lg flex items-center gap-2"
                            >
                                <div className="flex gap-1 items-center">
                                    <div className="w-1.5 h-1.5 rounded-full bg-white animate-bounce"></div>
                                    <div className="w-1.5 h-1.5 rounded-full bg-white animate-bounce [animation-delay:0.2s]"></div>
                                    <div className="w-1.5 h-1.5 rounded-full bg-white animate-bounce [animation-delay:0.4s]"></div>
                                </div>
                                ABORT BATTLE
                            </button>
                        </div>
                    )}
                    {!isDebating && chatHistory.length > 0 && (
                        <div className="p-4 border-t border-gray-800 bg-[#0a0a0a] flex justify-center">
                            <button
                                onClick={startNewDebate}
                                className="px-6 py-2 bg-red-600 hover:bg-red-500 text-white rounded-full text-xs font-bold shadow-lg"
                            >
                                ARCHIVE & NEW DEBATE
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
