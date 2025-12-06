// frontend/src/features/settings/SettingsModal.jsx
import React, { useState, useEffect } from 'react';

// Default configuration structure
const DEFAULT_PROVIDERS = [
  { id: 'openai', name: 'OpenAI', keys: [''], type: 'cloud' },
  { id: 'anthropic', name: 'Anthropic', keys: [''], type: 'cloud' },
  { id: 'gemini', name: 'Gemini', keys: [''], type: 'cloud' },
  { id: 'grok', name: 'Grok', keys: [''], type: 'cloud' },
  { id: 'runpod', name: 'RunPod / Ollama', url: '', type: 'local' },
];

export default function SettingsModal({ isOpen, onClose }) {
  const [providers, setProviders] = useState(DEFAULT_PROVIDERS);
  const [activeTab, setActiveTab] = useState(DEFAULT_PROVIDERS[0].id);

  // Load existing settings if any
  useEffect(() => {
    if(!isOpen) return;
    fetch('http://localhost:8004/api/settings/')
      .then(res => res.json())
      .then(data => {
        if (data.providers && data.providers.length > 0) {
           // Merge saved data with default structure to ensure all providers exist
           const merged = DEFAULT_PROVIDERS.map(def => {
             const found = data.providers.find(p => p.id === def.id);
             return found || def;
           });
           setProviders(merged);
        }
      })
      .catch(err => console.error("Error loading settings:", err));
  }, [isOpen]);

  const handleSave = async () => {
    try {
      await fetch('http://localhost:8004/api/settings/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ providers }),
      });
      alert('Settings Saved!');
      onClose();
    } catch (error) {
      alert('Error saving settings');
    }
  };

  const updateKey = (providerId, index, value) => {
    const newProviders = providers.map(p => {
      if (p.id !== providerId) return p;
      const newKeys = [...p.keys];
      newKeys[index] = value;
      return { ...p, keys: newKeys };
    });
    setProviders(newProviders);
  };

  const addKeyField = (providerId) => {
    setProviders(providers.map(p => 
      p.id === providerId ? { ...p, keys: [...p.keys, ''] } : p
    ));
  };

  const updateUrl = (providerId, value) => {
    setProviders(providers.map(p => 
      p.id === providerId ? { ...p, url: value } : p
    ));
  };

  if (!isOpen) return null;

  const currentProvider = providers.find(p => p.id === activeTab);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
      <div className="bg-modal-bg w-[800px] h-[500px] rounded-lg shadow-xl flex flex-col text-sm">
        
        {/* Header */}
        <div className="p-4 border-b border-gray-600 flex justify-between items-center">
          <h2 className="text-xl font-bold">Settings</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">✕</button>
        </div>

        {/* Content - Split 2 Sections */}
        <div className="flex-1 flex overflow-hidden">
          
          {/* Left: Provider List */}
          <div className="w-1/3 bg-[#222] border-r border-gray-600 p-2 overflow-y-auto">
            <h3 className="text-gray-400 text-xs uppercase mb-2 px-2">LLM Providers</h3>
            {providers.map(p => (
              <button
                key={p.id}
                onClick={() => setActiveTab(p.id)}
                className={`w-full text-left p-3 rounded mb-1 ${activeTab === p.id ? 'bg-accent text-white' : 'text-gray-300 hover:bg-gray-700'}`}
              >
                {p.name}
              </button>
            ))}
          </div>

          {/* Right: API Keys & URLs */}
          <div className="w-2/3 p-6 overflow-y-auto bg-modal-bg">
            <h3 className="text-lg font-bold mb-4 text-white">{currentProvider.name} Config</h3>
            
            {currentProvider.type === 'cloud' ? (
              <div>
                <label className="block text-gray-400 mb-2">API Keys</label>
                {currentProvider.keys.map((key, idx) => (
                  <div key={idx} className="flex mb-2">
                    <input 
                      type="password" 
                      value={key}
                      placeholder={`Enter ${currentProvider.name} Key`}
                      onChange={(e) => updateKey(currentProvider.id, idx, e.target.value)}
                      className="flex-1 bg-[#1a1a1a] border border-gray-600 rounded p-2 text-white focus:outline-none focus:border-accent"
                    />
                  </div>
                ))}
                <button 
                  onClick={() => addKeyField(currentProvider.id)}
                  className="text-accent text-xs font-bold hover:underline mt-1 flex items-center"
                >
                  + ADD ANOTHER KEY
                </button>
              </div>
            ) : (
              <div>
                <label className="block text-gray-400 mb-2">Endpoint URL</label>
                <input 
                  type="text" 
                  value={currentProvider.url || ''}
                  placeholder="http://localhost:11434 or RunPod URL"
                  onChange={(e) => updateUrl(currentProvider.id, e.target.value)}
                  className="w-full bg-[#1a1a1a] border border-gray-600 rounded p-2 text-white focus:outline-none focus:border-accent"
                />
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-600 flex justify-end">
          <button 
            onClick={handleSave}
            className="bg-accent px-6 py-2 rounded text-white font-bold hover:bg-opacity-80"
          >
            Save Settings
          </button>
        </div>

      </div>
    </div>
  );
}