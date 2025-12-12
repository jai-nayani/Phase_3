import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, Download, RefreshCw, X } from 'lucide-react';
import { ChatMessage } from '../types';

interface ChatInterfaceProps {
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  isProcessing: boolean;
  onExport: () => void;
}

const SUGGESTIONS = [
  "Change primary color to Emerald",
  "Add a Testimonials section",
  "Make the font bigger",
  "Regenerate the hero image",
  "Add a 'Get Started' button"
];

const ChatInterface: React.FC<ChatInterfaceProps> = ({ messages, onSendMessage, isProcessing, onExport }) => {
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isProcessing) {
      onSendMessage(input);
      setInput('');
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#1a1a1a] border-l border-white/10">
      {/* Header */}
      <div className="p-4 border-b border-white/10 flex items-center justify-between bg-[#1a1a1a]">
        <div>
           <h3 className="font-bold text-white flex items-center gap-2">
             <Sparkles className="w-4 h-4 text-indigo-400" />
             AI Designer
           </h3>
           <p className="text-xs text-gray-500">Refine your website via chat</p>
        </div>
        <button 
          onClick={onExport}
          className="bg-white/5 hover:bg-white/10 text-white text-xs px-3 py-1.5 rounded-lg border border-white/10 flex items-center gap-2 transition-colors"
        >
            <Download className="w-3 h-3" />
            Export
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar" ref={scrollRef}>
        {messages.length === 0 && (
          <div className="text-center mt-8">
            <div className="w-12 h-12 bg-indigo-500/10 rounded-full flex items-center justify-center mx-auto mb-3">
              <Sparkles className="w-6 h-6 text-indigo-400" />
            </div>
            <p className="text-gray-400 text-sm">How can I improve this design?</p>
          </div>
        )}
        
        {messages.map((msg, idx) => (
          <div 
            key={idx} 
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div 
              className={`
                max-w-[90%] rounded-2xl px-4 py-3 text-sm leading-relaxed
                ${msg.role === 'user' 
                  ? 'bg-indigo-600 text-white rounded-br-sm' 
                  : 'bg-[#252525] text-gray-200 border border-white/5 rounded-bl-sm'
                }
              `}
            >
              {msg.text}
            </div>
          </div>
        ))}

        {isProcessing && (
          <div className="flex justify-start animate-fade-in">
             <div className="bg-[#252525] border border-white/5 rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-2">
                <RefreshCw className="w-3 h-3 text-indigo-400 animate-spin" />
                <span className="text-xs text-gray-400">Updating website code...</span>
             </div>
          </div>
        )}
      </div>

      {/* Suggested Chips */}
      <div className="px-4 py-2 flex gap-2 overflow-x-auto no-scrollbar mask-gradient">
        {SUGGESTIONS.map((s, i) => (
          <button
            key={i}
            onClick={() => setInput(s)}
            disabled={isProcessing}
            className="whitespace-nowrap bg-white/5 hover:bg-white/10 border border-white/10 text-gray-400 text-xs px-3 py-1.5 rounded-full transition-colors flex-shrink-0"
          >
            {s}
          </button>
        ))}
      </div>

      {/* Input */}
      <div className="p-4 border-t border-white/10 bg-[#1a1a1a]">
        <form onSubmit={handleSubmit} className="relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask to change colors, layout..."
            disabled={isProcessing}
            className="w-full bg-[#0f0f0f] border border-white/10 rounded-xl py-3 pl-4 pr-10 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
          />
          <button
            type="submit"
            disabled={!input.trim() || isProcessing}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-indigo-600 rounded-lg text-white hover:bg-indigo-500 disabled:opacity-0 disabled:pointer-events-none transition-all"
          >
            <Send className="w-3 h-3" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatInterface;
