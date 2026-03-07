import React, { useState, useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { 
  Send, User, Sparkles, Brain, 
  ChevronDown, X, MessageCircle 
} from 'lucide-react';
import { ScrollArea } from './scroll-area';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface LuxuryChatProps {
  isOpen: boolean;
  onClose: () => void;
  userName: string;
  initialMessage?: string;
  onSendMessage: (msg: string) => Promise<string>;
}

export function LuxuryChat({ isOpen, onClose, userName, initialMessage, onSendMessage }: LuxuryChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [thinkingState, setThinkingState] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const chatRef = useRef<HTMLDivElement>(null);

  const thinkingMessages = [
    "Reading clinical narratives...",
    "Decoding physiological markers...",
    "Formulating health partnerships...",
    "Establishing context..."
  ];

  useEffect(() => {
    if (initialMessage && messages.length === 0) {
      setMessages([{
        id: 'initial',
        role: 'assistant',
        content: initialMessage,
        timestamp: new Date()
      }]);
    }
  }, [initialMessage]);

  useEffect(() => {
    if (isOpen) {
      gsap.fromTo(chatRef.current, 
        { y: 50, opacity: 0, scale: 0.95 }, 
        { y: 0, opacity: 1, scale: 1, duration: 0.8, ease: "power4.out" }
      );
    }
  }, [isOpen]);

  const handleSend = async () => {
    if (!inputValue.trim() || isThinking) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setIsThinking(true);

    for (const state of thinkingMessages) {
      setThinkingState(state);
      await new Promise(r => setTimeout(r, 600));
    }

    try {
      const response = await onSendMessage(userMsg.content);
      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, assistantMsg]);
    } catch (error) {
      console.error("Chat Error:", error);
    } finally {
      setIsThinking(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-end md:items-center justify-center bg-[#5b0e14]/5 backdrop-blur-sm p-4">
      <div 
        ref={chatRef}
        className="w-full max-w-xl h-[80vh] bg-white/40 backdrop-blur-3xl border border-white/60 rounded-[3rem] overflow-hidden shadow-[0_40px_100px_rgba(91,14,20,0.15)] flex flex-col"
      >
        {/* Header */}
        <div className="p-8 border-b border-[#5b0e14]/5 flex items-center justify-between bg-white/20">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-12 h-12 rounded-full bg-[#5b0e14] flex items-center justify-center p-0.5">
                <div className="w-full h-full rounded-full bg-[#f1e194] flex items-center justify-center">
                  <User className="w-6 h-6 text-[#5b0e14]" />
                </div>
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white" />
            </div>
            <div>
              <h3 className="text-[#5b0e14] font-bold tracking-tight">Julian</h3>
              <p className="text-[9px] text-[#5b0e14]/40 uppercase tracking-[0.2em] font-black">Clinical Expert • Online</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white/40 flex items-center justify-center hover:bg-[#5b0e14]/5 transition-colors"
          >
            <X className="w-5 h-5 text-[#5b0e14]" />
          </button>
        </div>

        {/* Chat Content */}
        <ScrollArea className="flex-1 p-8 space-y-8">
          <div className="space-y-8 pb-4">
            {messages.map((msg) => (
              <div 
                key={msg.id}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`
                  max-w-[85%] px-6 py-4 rounded-[2rem] text-sm leading-relaxed
                  ${msg.role === 'user' 
                    ? 'bg-[#5b0e14] text-[#f1e194] font-medium rounded-tr-none shadow-xl shadow-[#5b0e14]/20' 
                    : 'bg-white/60 text-[#5b0e14] rounded-tl-none border border-white/60 shadow-sm'
                  }
                `}>
                  {msg.content}
                </div>
              </div>
            ))}

            {isThinking && (
              <div className="flex justify-start">
                <div className="bg-white/30 border border-white/40 px-6 py-4 rounded-[2rem] rounded-tl-none flex items-center gap-4">
                  <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#5b0e14]/40 animate-bounce" />
                    <span className="w-1.5 h-1.5 rounded-full bg-[#5b0e14]/40 animate-bounce" style={{ animationDelay: '0.2s' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-[#5b0e14]/40 animate-bounce" style={{ animationDelay: '0.4s' }} />
                  </div>
                  <span className="text-[10px] text-[#5b0e14]/50 italic font-bold uppercase tracking-widest">{thinkingState}</span>
                </div>
              </div>
            )}
            <div ref={scrollRef} />
          </div>
        </ScrollArea>

        {/* Input */}
        <div className="p-8 border-t border-[#5b0e14]/5 bg-white/20">
          <div className="relative group">
            <input 
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Inquire with Julian..."
              className="w-full bg-white/40 border border-[#5b0e14]/10 rounded-full py-5 pl-8 pr-16 text-sm text-[#5b0e14] placeholder:text-[#5b0e14]/30 outline-none group-hover:border-[#5b0e14]/30 focus:border-[#5b0e14]/50 transition-all duration-300"
            />
            <button 
              onClick={handleSend}
              disabled={!inputValue.trim() || isThinking}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-[#5b0e14] flex items-center justify-center text-[#f1e194] shadow-lg disabled:opacity-50 hover:scale-105 active:scale-95 transition-all"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
          <p className="mt-4 text-center text-[9px] text-[#5b0e14]/40 uppercase tracking-[0.2em] font-black flex items-center justify-center gap-2">
            <Sparkles className="w-3 h-3 text-[#5b0e14]" />
            Your Private Health Partnership
          </p>
        </div>
      </div>
    </div>
  );
}
