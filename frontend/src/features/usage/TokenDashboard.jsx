import React, { useState, useEffect } from 'react';

export default function TokenDashboard() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const res = await fetch('http://localhost:8004/api/usage/stats');
            const data = await res.json();
            setStats(data);
        } catch (err) {
            console.error('Failed to fetch usage stats', err);
        } finally {
            setLoading(false);
        }
    };

    const formatNumber = (num) => {
        if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + 'M';
        if (num >= 1_000) return (num / 1_000).toFixed(1) + 'K';
        return num.toLocaleString();
    };

    if (loading) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <div className="text-gray-500 animate-pulse">Loading usage data...</div>
            </div>
        );
    }

    if (!stats) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <div className="text-gray-500">Failed to load usage data.</div>
            </div>
        );
    }

    const { totals, sessions, models } = stats;

    const cards = [
        {
            label: 'Total Tokens',
            value: formatNumber(totals.total_tokens),
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
            ),
            color: 'text-accent',
            bgColor: 'bg-accent/10 border-accent/20'
        },
        {
            label: 'Prompt Tokens',
            value: formatNumber(totals.prompt_tokens),
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
            ),
            color: 'text-blue-400',
            bgColor: 'bg-blue-500/10 border-blue-500/20'
        },
        {
            label: 'Completion Tokens',
            value: formatNumber(totals.completion_tokens),
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 11 12 14 22 4"></polyline><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path></svg>
            ),
            color: 'text-emerald-400',
            bgColor: 'bg-emerald-500/10 border-emerald-500/20'
        },
        {
            label: 'Total Sessions',
            value: totals.session_count,
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path><line x1="9" y1="10" x2="15" y2="10"></line></svg>
            ),
            color: 'text-purple-400',
            bgColor: 'bg-purple-500/10 border-purple-500/20'
        }
    ];

    return (
        <div className="flex-1 flex flex-col overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
                        Token Usage Dashboard
                    </h2>
                    <p className="text-xs text-gray-500 mt-1">Aggregated token usage across all sessions</p>
                </div>
                <button
                    onClick={() => { setLoading(true); fetchStats(); }}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-400 hover:text-white hover:bg-gray-800 border border-gray-700 rounded transition-colors"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>
                    Refresh
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8">
                {/* Summary Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {cards.map((card, i) => (
                        <div key={i} className={`border rounded-lg p-4 ${card.bgColor}`}>
                            <div className="flex items-center justify-between mb-3">
                                <span className={`${card.color}`}>{card.icon}</span>
                            </div>
                            <div className={`text-2xl font-bold ${card.color}`}>{card.value}</div>
                            <div className="text-xs text-gray-500 mt-1">{card.label}</div>
                        </div>
                    ))}
                </div>

                {/* Usage ratio bar */}
                {totals.total_tokens > 0 && (
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs text-gray-400 font-medium">Token Distribution</span>
                            <div className="flex items-center gap-4 text-xs text-gray-500">
                                <span className="flex items-center gap-1">
                                    <span className="w-2 h-2 rounded-full bg-blue-400 inline-block"></span>
                                    Prompt ({((totals.prompt_tokens / totals.total_tokens) * 100).toFixed(1)}%)
                                </span>
                                <span className="flex items-center gap-1">
                                    <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block"></span>
                                    Completion ({((totals.completion_tokens / totals.total_tokens) * 100).toFixed(1)}%)
                                </span>
                            </div>
                        </div>
                        <div className="w-full h-3 bg-[#111] rounded-full overflow-hidden flex">
                            <div
                                className="h-full bg-blue-400 transition-all duration-500"
                                style={{ width: `${(totals.prompt_tokens / totals.total_tokens) * 100}%` }}
                            />
                            <div
                                className="h-full bg-emerald-400 transition-all duration-500"
                                style={{ width: `${(totals.completion_tokens / totals.total_tokens) * 100}%` }}
                            />
                        </div>
                    </div>
                )}

                {/* Per-Model Table */}
                {models && models.length > 0 && (
                    <div>
                        <h3 className="text-sm font-bold text-white mb-3">Model Breakdown</h3>
                        <p className="text-xs text-gray-500 mb-3 italic">Note: Only tracks messages sent after this update.</p>
                        <div className="border border-gray-800 rounded-lg overflow-hidden">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="bg-[#111] text-gray-400 text-xs text-left">
                                        <th className="px-4 py-3 font-medium">Model</th>
                                        <th className="px-4 py-3 font-medium text-right">Calls</th>
                                        <th className="px-4 py-3 font-medium text-right">
                                            <span className="text-blue-400">Prompt</span>
                                        </th>
                                        <th className="px-4 py-3 font-medium text-right">
                                            <span className="text-emerald-400">Completion</span>
                                        </th>
                                        <th className="px-4 py-3 font-medium text-right">Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {models.map((m, i) => (
                                        <tr
                                            key={i}
                                            className={`border-t border-gray-800/50 hover:bg-gray-800/30 transition-colors ${i % 2 === 0 ? 'bg-transparent' : 'bg-[#111]/30'}`}
                                        >
                                            <td className="px-4 py-3">
                                                <div className="text-gray-300 font-medium">{m.model}</div>
                                                <div className="text-[10px] text-gray-500 uppercase tracking-tighter">{m.provider}</div>
                                            </td>
                                            <td className="px-4 py-3 text-gray-500 text-right">{m.message_count}</td>
                                            <td className="px-4 py-3 text-blue-400/80 text-right font-mono text-xs">{formatNumber(m.prompt_tokens)}</td>
                                            <td className="px-4 py-3 text-emerald-400/80 text-right font-mono text-xs">{formatNumber(m.completion_tokens)}</td>
                                            <td className="px-4 py-3 text-white text-right font-mono text-xs font-medium">{formatNumber(m.total_tokens)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Per-Agent Table */}
                {stats.agents && stats.agents.length > 0 && (
                    <div>
                        <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-400"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                            Agent Performance
                        </h3>
                        <div className="border border-gray-800 rounded-lg overflow-hidden">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="bg-[#111] text-gray-400 text-xs text-left">
                                        <th className="px-4 py-3 font-medium">Agent</th>
                                        <th className="px-4 py-3 font-medium text-right">
                                            <span className="text-blue-400">Prompt</span>
                                        </th>
                                        <th className="px-4 py-3 font-medium text-right">
                                            <span className="text-emerald-400">Completion</span>
                                        </th>
                                        <th className="px-4 py-3 font-medium text-right">Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {stats.agents.map((agent, i) => (
                                        <tr
                                            key={agent.id}
                                            className={`border-t border-gray-800/50 hover:bg-gray-800/30 transition-colors ${i % 2 === 0 ? 'bg-transparent' : 'bg-[#111]/30'}`}
                                        >
                                            <td className="px-4 py-3">
                                                <div className="text-gray-300 font-medium">{agent.name}</div>
                                                <div className="text-[10px] text-gray-500 uppercase tracking-tighter">ID: {agent.id.substring(0, 8)}</div>
                                            </td>
                                            <td className="px-4 py-3 text-blue-400/80 text-right font-mono text-xs">{formatNumber(agent.prompt_tokens)}</td>
                                            <td className="px-4 py-3 text-emerald-400/80 text-right font-mono text-xs">{formatNumber(agent.completion_tokens)}</td>
                                            <td className="px-4 py-3 text-white text-right font-mono text-xs font-medium">{formatNumber(agent.total_tokens)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Per-Session Table */}
                <div>
                    <h3 className="text-sm font-bold text-white mb-3">Per-Session Breakdown</h3>
                    {sessions.length === 0 ? (
                        <div className="text-sm text-gray-500 text-center py-8">No sessions found.</div>
                    ) : (
                        <div className="border border-gray-800 rounded-lg overflow-hidden">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="bg-[#111] text-gray-400 text-xs text-left">
                                        <th className="px-4 py-3 font-medium">Session</th>
                                        <th className="px-4 py-3 font-medium text-right">Messages</th>
                                        <th className="px-4 py-3 font-medium text-right">
                                            <span className="text-blue-400">Prompt</span>
                                        </th>
                                        <th className="px-4 py-3 font-medium text-right">
                                            <span className="text-emerald-400">Completion</span>
                                        </th>
                                        <th className="px-4 py-3 font-medium text-right">Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {sessions.map((session, i) => (
                                        <tr
                                            key={session.id}
                                            className={`border-t border-gray-800/50 hover:bg-gray-800/30 transition-colors ${i % 2 === 0 ? 'bg-transparent' : 'bg-[#111]/30'}`}
                                        >
                                            <td className="px-4 py-3 text-gray-300 max-w-[200px] truncate">{session.title}</td>
                                            <td className="px-4 py-3 text-gray-500 text-right">{session.message_count}</td>
                                            <td className="px-4 py-3 text-blue-400/80 text-right font-mono text-xs">{formatNumber(session.prompt_tokens)}</td>
                                            <td className="px-4 py-3 text-emerald-400/80 text-right font-mono text-xs">{formatNumber(session.completion_tokens)}</td>
                                            <td className="px-4 py-3 text-white text-right font-mono text-xs font-medium">{formatNumber(session.total_tokens)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
