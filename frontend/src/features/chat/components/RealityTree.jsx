import React, { useState, useEffect } from 'react';

export default function RealityTree({ chatId, onSelectSession }) {
    const [tree, setTree] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchTree();
    }, [chatId]);

    const fetchTree = async () => {
        setLoading(true);
        try {
            // We fetch ALL sessions to build the local tree
            const res = await fetch('http://localhost:8004/api/sessions/');
            const allSessions = await res.json();
            
            // Current session metadata
            const currentRes = await fetch(`http://localhost:8004/api/sessions/${chatId}/meta`);
            const currentMeta = await currentRes.json();

            // Logic to build a simple lineage:
            // 1. Find ancestors (follow parent_id up)
            // 2. Find siblings (others with same parent_id)
            // 3. Find children (those with currentId as parent_id)
            
            const lineage = [];
            
            // Find parent if exists
            if (currentMeta.parent_id) {
                const parent = allSessions.find(s => s.id === currentMeta.parent_id);
                if (parent) {
                    lineage.push({ ...parent, type: 'parent' });
                }
            }

            // Current
            const current = allSessions.find(s => s.id === chatId);
            if (current) {
                lineage.push({ ...current, type: 'current' });
            }

            // Children
            const children = allSessions.filter(s => s.meta && s.meta.parent_id === chatId);
            children.forEach(child => {
                lineage.push({ ...child, type: 'child' });
            });

            setTree(lineage);
        } catch (err) {
            console.error("Failed to fetch reality tree", err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="p-4 text-xs text-gray-500 animate-pulse">Loading realities...</div>;
    if (tree.length <= 1) return null; // Only show if there's a relationship

    return (
        <div className="mt-8 border-t border-gray-800 pt-6">
            <h3 className="text-[10px] font-bold text-accent uppercase tracking-widest mb-4">
                Other Realities
            </h3>
            <div className="space-y-4">
                {tree.map((node) => (
                    <div 
                        key={node.id}
                        onClick={() => node.type !== 'current' && onSelectSession(node.id)}
                        className={`group relative pl-4 border-l-2 py-1 cursor-pointer transition-all ${
                            node.type === 'current' 
                                ? 'border-accent text-white' 
                                : 'border-gray-800 text-gray-500 hover:border-gray-400 hover:text-gray-300'
                        }`}
                    >
                        <div className="flex flex-col">
                            <span className="text-[10px] uppercase tracking-tighter opacity-50 mb-0.5">
                                {node.type === 'parent' ? '↖ Original' : node.type === 'child' ? '↘ Branch' : '● Current'}
                            </span>
                            <span className="text-xs truncate max-w-[180px] font-medium">{node.title}</span>
                        </div>
                        
                        {node.type === 'current' && (
                            <div className="absolute -left-[5px] top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-accent animate-ping opacity-20"></div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
