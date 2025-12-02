import React, { useState } from 'react';
import { Sparkles, X, Send, Loader2 } from 'lucide-react';
import { askLMSAssistant } from '../services/geminiService';

interface GeminiAssistantProps {
  currentContext: string;
}

export const GeminiAssistant: React.FC<GeminiAssistantProps> = ({ currentContext }) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<{role: 'user' | 'ai', text: string}[]>([
    { role: 'ai', text: 'Hi! I can help you understand the current module. What do you need help with?' }
  ]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setLoading(true);

    const response = await askLMSAssistant(userMsg, currentContext);
    
    setMessages(prev => [...prev, { role: 'ai', text: response }]);
    setLoading(false);
  };

  if (!isVisible) return null;

  return (
    <>
      {/* Floating Action Button */}
      <div className={`fixed bottom-6 right-6 z-50 transition-all duration-300 ${isOpen ? 'translate-y-4 opacity-0 pointer-events-none' : 'translate-y-0 opacity-100'}`}>
        <div className="relative group">
          <button
            onClick={() => setIsVisible(false)}
            className="absolute -top-2 -right-2 p-1.5 bg-white text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-all scale-90 group-hover:scale-100 z-10 border border-slate-100"
            title="Remove Assistant Permanently"
          >
            <X className="w-3 h-3" strokeWidth={3} />
          </button>
          
          <button
            onClick={() => setIsOpen(true)}
            className="p-4 bg-gradient-to-r from-brand-600 to-indigo-600 text-white rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all flex items-center gap-2 pr-6 pl-5"
            title="Open AI Assistant"
          >
            <Sparkles className="w-6 h-6 animate-pulse" />
            <span className="font-extrabold hidden sm:inline tracking-wide">Ask Genie AI</span>
          </button>
        </div>
      </div>

      {/* Chat Interface */}
      <div 
        className={`
          fixed bottom-6 right-6 w-96 max-w-[calc(100vw-3rem)] bg-white rounded-[2rem] 
          shadow-2xl border-4 border-white/50 ring-4 ring-indigo-900/5 overflow-hidden flex flex-col z-50
          transition-all duration-300 origin-bottom-right
          ${isOpen ? 'scale-100 opacity-100 translate-y-0' : 'scale-90 opacity-0 translate-y-8 pointer-events-none'}
        `}
        style={{ height: '500px' }}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-brand-600 to-indigo-600 p-4 flex justify-between items-center text-white">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            <h3 className="font-extrabold tracking-wide">Genie AI</h3>
          </div>
          <button onClick={() => setIsOpen(false)} className="hover:bg-white/20 p-1 rounded-full transition-colors" title="Close Chat">
            <X className="w-5 h-5" strokeWidth={3} />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 scrollbar-thin scrollbar-thumb-indigo-100">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div 
                className={`
                  max-w-[85%] p-3.5 rounded-2xl text-sm leading-relaxed font-medium shadow-sm
                  ${msg.role === 'user' 
                    ? 'bg-brand-600 text-white rounded-br-sm' 
                    : 'bg-white border border-slate-100 text-slate-700 rounded-bl-sm'}
                `}
              >
                {msg.text}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-white border border-slate-100 p-3 rounded-2xl rounded-bl-sm shadow-sm flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-brand-600" />
                <span className="text-xs font-bold text-slate-400">Genie is thinking...</span>
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="p-4 bg-white border-t border-slate-100">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask about this topic..."
              className="flex-1 px-4 py-3 bg-slate-100 border-2 border-transparent rounded-2xl focus:bg-white focus:border-brand-300 focus:outline-none transition-all text-sm font-bold text-slate-700 placeholder-slate-400"
            />
            <button 
              onClick={handleSend}
              disabled={loading || !input.trim()}
              className="p-3 bg-brand-600 text-white rounded-2xl hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-md hover:shadow-lg active:scale-95"
              title="Send Message"
            >
              <Send className="w-5 h-5" strokeWidth={2.5} />
            </button>
          </div>
        </div>
      </div>
    </>
  );
};