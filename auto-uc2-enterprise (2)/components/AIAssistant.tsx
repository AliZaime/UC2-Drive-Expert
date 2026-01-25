
import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, X, Send, Bot, User, Loader2 } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';
import { MOCK_VEHICLES, MOCK_NEGOTIATIONS } from '../constants';

export const AIAssistant: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: 'ai' | 'user'; text: string }[]>([
    { role: 'ai', text: 'Hello! I am your AUTO-UC2 Intelligent Assistant. How can I help you manage your fleet or negotiations today?' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsTyping(true);

    try {
      // Use process.env.API_KEY directly for initialization
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const systemPrompt = `
        You are an expert automotive business consultant for the AUTO-UC2 platform.
        You have access to the following context:
        - Inventory: ${JSON.stringify(MOCK_VEHICLES)}
        - Active Negotiations: ${JSON.stringify(MOCK_NEGOTIATIONS)}
        
        Answer professionally. If asked about inventory, give specific recommendations based on the data provided. 
        Use markdown for formatting. Keep responses concise.
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: userMsg,
        config: {
          systemInstruction: systemPrompt,
          temperature: 0.7,
        },
      });

      const aiResponse = response.text || "I'm sorry, I couldn't process that request.";
      setMessages(prev => [...prev, { role: 'ai', text: aiResponse }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'ai', text: "Error connecting to intelligence core. Please check your system configuration." }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-50 group overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-tr from-blue-400/0 via-white/20 to-blue-400/0 group-hover:translate-x-full transition-transform duration-700" />
        <Sparkles size={24} className="group-hover:rotate-12 transition-transform" />
      </button>

      {isOpen && (
        <div className="fixed inset-y-0 right-0 w-full sm:w-[450px] bg-white shadow-2xl z-[60] flex flex-col border-l border-zinc-200 animate-in slide-in-from-right duration-300">
          <div className="p-4 border-b border-zinc-100 flex items-center justify-between bg-zinc-900 text-white">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                <Bot size={18} />
              </div>
              <div>
                <h3 className="font-bold text-sm">Fleet Intelligence</h3>
                <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">Powered by Gemini 3</p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-zinc-800 rounded-lg transition-colors">
              <X size={18} />
            </button>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-zinc-50/50">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`flex gap-3 max-w-[85%] ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div className={`w-8 h-8 shrink-0 rounded-full flex items-center justify-center ${m.role === 'user' ? 'bg-zinc-200 text-zinc-600' : 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'}`}>
                    {m.role === 'user' ? <User size={14} /> : <Bot size={14} />}
                  </div>
                  <div className={`p-3 rounded-2xl text-sm leading-relaxed ${
                    m.role === 'user' 
                      ? 'bg-zinc-900 text-white rounded-tr-none' 
                      : 'bg-white border border-zinc-200 text-zinc-800 rounded-tl-none shadow-sm'
                  }`}>
                    {m.text}
                  </div>
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start">
                <div className="flex gap-3 max-w-[85%]">
                  <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center">
                    <Loader2 size={14} className="animate-spin" />
                  </div>
                  <div className="bg-white border border-zinc-200 p-3 rounded-2xl rounded-tl-none shadow-sm">
                    <div className="flex gap-1">
                      <div className="w-1.5 h-1.5 bg-zinc-300 rounded-full animate-bounce" />
                      <div className="w-1.5 h-1.5 bg-zinc-300 rounded-full animate-bounce [animation-delay:0.2s]" />
                      <div className="w-1.5 h-1.5 bg-zinc-300 rounded-full animate-bounce [animation-delay:0.4s]" />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="p-4 border-t border-zinc-100 bg-white">
            <div className="flex gap-2">
              <input 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Ask anything about your fleet..."
                className="flex-1 px-4 py-2.5 bg-zinc-100 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white border border-transparent focus:border-blue-500 transition-all text-sm"
              />
              <button 
                onClick={handleSend}
                disabled={!input.trim() || isTyping}
                className="p-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 active:scale-95 disabled:opacity-50 transition-all shadow-lg shadow-blue-500/20"
              >
                <Send size={20} />
              </button>
            </div>
            <p className="text-[10px] text-center text-zinc-400 mt-3 font-medium uppercase tracking-widest">Confidential Enterprise Mode</p>
          </div>
        </div>
      )}
    </>
  );
};
