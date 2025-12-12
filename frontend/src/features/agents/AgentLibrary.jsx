import React, { useState, useEffect } from 'react';
import AgentModal from './AgentModal';

export default function AgentLibrary({ onClose }) {
    const [agents, setAgents] = useState([]);
    const [categories, setCategories] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingAgent, setEditingAgent] = useState(null);
    const [selectedCategory, setSelectedCategory] = useState('All');

    useEffect(() => {
        fetchAgents();
        fetchCategories();
    }, []);

    const fetchAgents = async () => {
        try {
            const res = await fetch('http://localhost:8004/api/agents/');
            const data = await res.json();
            setAgents(data);
        } catch (err) {
            console.error("Failed to fetch agents", err);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchCategories = async () => {
        try {
            const res = await fetch('http://localhost:8004/api/agents/categories');
            const data = await res.json();
            setCategories(data);
        } catch (err) {
            console.error("Failed to fetch categories", err);
        }
    };

    const handleSaveAgent = async (agentData) => {
        try {
            const url = editingAgent
                ? `http://localhost:8004/api/agents/${editingAgent.id}`
                : 'http://localhost:8004/api/agents/';

            const method = editingAgent ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(agentData)
            });

            if (res.ok) {
                setIsModalOpen(false);
                setEditingAgent(null);
                fetchAgents();
                fetchCategories();
            } else {
                alert("Failed to save agent");
            }
        } catch (err) {
            console.error("Error saving agent", err);
        }
    };

    const handleDeleteAgent = async (id) => {
        if (!confirm("Are you sure you want to delete this agent?")) return;
        try {
            await fetch(`http://localhost:8004/api/agents/${id}`, { method: 'DELETE' });
            fetchAgents();
            fetchCategories();
        } catch (err) {
            console.error("Error deleting agent", err);
        }
    };

    const filteredAgents = selectedCategory === 'All'
        ? agents
        : agents.filter(a => a.category === selectedCategory);

    return (
        <div className="flex flex-col h-full bg-app-bg text-white">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800 bg-app-bg">
                <div className="flex items-center gap-4">
                    <h2 className="text-xl font-bold tracking-wide">Agent Library</h2>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setSelectedCategory('All')}
                            className={`px-3 py-1 text-xs rounded-full border transition ${selectedCategory === 'All' ? 'bg-accent border-accent text-white' : 'border-gray-700 text-gray-400 hover:border-gray-500'}`}
                        >
                            All
                        </button>
                        {categories.map(cat => (
                            <button
                                key={cat}
                                onClick={() => setSelectedCategory(cat)}
                                className={`px-3 py-1 text-xs rounded-full border transition ${selectedCategory === cat ? 'bg-accent border-accent text-white' : 'border-gray-700 text-gray-400 hover:border-gray-500'}`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-xs text-gray-400 hover:text-white border border-gray-700 rounded hover:bg-gray-800 transition"
                    >
                        Back to Chat
                    </button>
                    <button
                        onClick={() => { setEditingAgent(null); setIsModalOpen(true); }}
                        className="px-4 py-2 text-xs bg-accent text-white rounded hover:bg-accent/90 transition shadow-md flex items-center gap-2"
                    >
                        <span>+</span> Create Agent
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
                {isLoading ? (
                    <div className="text-center text-gray-500 mt-10">Loading agents...</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="text-xs text-gray-500 border-b border-gray-800 uppercase tracking-wider">
                                    <th className="p-3 font-medium">Name</th>
                                    <th className="p-3 font-medium">Role</th>
                                    <th className="p-3 font-medium">Category</th>
                                    <th className="p-3 font-medium">Expertise</th>
                                    <th className="p-3 font-medium text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm divide-y divide-gray-800">
                                {filteredAgents.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="p-8 text-center text-gray-500 italic">
                                            No agents found. Create one to get started.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredAgents.map(agent => (
                                        <tr key={agent.id} className="group hover:bg-gray-900/50 transition">
                                            <td className="p-3 font-medium text-white">{agent.name}</td>
                                            <td className="p-3 text-gray-400">{agent.role}</td>
                                            <td className="p-3">
                                                <span className="px-2 py-0.5 rounded text-[10px] bg-gray-800 text-gray-300 border border-gray-700">
                                                    {agent.category}
                                                </span>
                                            </td>
                                            <td className="p-3 text-gray-400">{agent.expertise}</td>
                                            <td className="p-3 text-right space-x-2 opacity-0 group-hover:opacity-100 transition">
                                                <button
                                                    onClick={() => { setEditingAgent(agent); setIsModalOpen(true); }}
                                                    className="text-blue-400 hover:text-blue-300 text-xs"
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteAgent(agent.id)}
                                                    className="text-red-400 hover:text-red-300 text-xs"
                                                >
                                                    Delete
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <AgentModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSaveAgent}
                initialData={editingAgent}
                categories={categories}
            />
        </div>
    );
}
