import { useState, useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { 
  Send, Sparkles, X, Bot
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
  userName?: string;
  initialMessage?: string;
  onSendMessage: (msg: string, history: Message[]) => Promise<string>;
}

export function LuxuryChat({ isOpen, onClose, initialMessage, onSendMessage }: LuxuryChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [thinkingState, setThinkingState] = useState('');
  const [streamingText, setStreamingText] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const chatRef = useRef<HTMLDivElement>(null);

  const thinkingMessages = [
    "Synchronizing with clinical database...",
    "Analyzing physiological patterns...",
    "Formulating personalized protocol..."
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
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isThinking, streamingText]);

  useEffect(() => {
    if (isOpen) {
      gsap.fromTo(chatRef.current, 
        { y: 30, opacity: 0, scale: 0.98 }, 
        { y: 0, opacity: 1, scale: 1, duration: 0.6, ease: "power3.out" }
      );
    }
  }, [isOpen]);

  const typeText = async (text: string) => {
    setStreamingText('');
    const words = text.split(' ');
    let current = '';
    for (const word of words) {
      current += (current ? ' ' : '') + word;
      setStreamingText(current);
      await new Promise(r => setTimeout(r, 30 + Math.random() * 40));
    }
    return current;
  };

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

    // Dynamic Thinking UX
    for (const state of thinkingMessages) {
      setThinkingState(state);
      await new Promise(r => setTimeout(r, 800));
    }

    try {
      const response = await onSendMessage(userMsg.content, messages);
      setIsThinking(false);
      
      const fullText = await typeText(response);
      
      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: fullText,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, assistantMsg]);
      setStreamingText('');
    } catch (error) {
      console.error("Chat Error:", error);
      setIsThinking(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-[#5b0e14]/10 backdrop-blur-md p-4">
      <div 
        ref={chatRef}
        className="w-full max-w-2xl h-[85vh] bg-[#f1e194] border border-[#5b0e14]/10 rounded-[2.5rem] overflow-hidden shadow-[0_50px_100px_rgba(91,14,20,0.2)] flex flex-col relative"
      >
        <div className="grainy-overlay absolute inset-0 pointer-events-none opacity-20" />
        
        {/* Header */}
        <div className="p-6 md:p-8 border-b border-[#5b0e14]/5 flex items-center justify-between bg-white/20 backdrop-blur-xl relative z-10">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-12 h-12 rounded-2xl bg-[#5b0e14] flex items-center justify-center">
                <Bot className="w-6 h-6 text-[#f1e194]" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-[#f1e194]" />
            </div>
            <div>
              <h3 className="text-[#5b0e14] font-black tracking-tight text-lg">MEDIQ</h3>
              <p className="text-[9px] text-[#5b0e14]/40 uppercase tracking-[0.3em] font-bold">Neural Health Architect • Live</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-10 h-10 rounded-full hover:bg-[#5b0e14]/5 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5 text-[#5b0e14]" />
          </button>
        </div>

        {/* Chat Content */}
        <ScrollArea className="flex-1 p-6 md:p-10 space-y-10 relative z-10">
          <div className="space-y-10 pb-10">
            {messages.map((msg) => (
              <div 
                key={msg.id}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`
                  max-w-[85%] px-8 py-5 rounded-[2rem] text-sm md:text-base leading-relaxed
                  ${msg.role === 'user' 
                    ? 'bg-[#5b0e14] text-[#f1e194] font-medium rounded-tr-none shadow-xl' 
                    : 'bg-white/60 text-[#5b0e14] rounded-tl-none border border-white/40 shadow-sm font-serif italic'
                  }
                `}>
                  {msg.content}
                </div>
              </div>
            ))}

            {isThinking && (
              <div className="flex justify-start">
                <div className="bg-white/30 border border-white/40 px-8 py-5 rounded-[2rem] rounded-tl-none flex items-center gap-4 shadow-sm">
                  <div className="flex gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#5b0e14] animate-bounce" style={{ animationDelay: '0s' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-[#5b0e14] animate-bounce" style={{ animationDelay: '0.2s' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-[#5b0e14] animate-bounce" style={{ animationDelay: '0.4s' }} />
                  </div>
                  <span className="text-[10px] text-[#5b0e14]/60 font-black uppercase tracking-widest">{thinkingState}</span>
                </div>
              </div>
            )}

            {streamingText && (
              <div className="flex justify-start">
                <div className="max-w-[85%] bg-white/60 text-[#5b0e14] px-8 py-5 rounded-[2rem] rounded-tl-none border border-white/40 shadow-sm font-serif italic text-sm md:text-base leading-relaxed">
                  {streamingText}
                  <span className="inline-block w-1.5 h-4 bg-[#5b0e14] ml-1 animate-pulse" />
                </div>
              </div>
            )}
            
            <div ref={scrollRef} className="h-4" />
          </div>
        </ScrollArea>

        {/* Input */}
        <div className="p-6 md:p-10 border-t border-[#5b0e14]/5 bg-white/20 backdrop-blur-xl relative z-10">
          <div className="relative group">
            <input 
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Query your biological architecture..."
              className="w-full bg-white/40 border border-[#5b0e14]/10 rounded-full py-6 pl-10 pr-20 text-sm md:text-base text-[#5b0e14] placeholder:text-[#5b0e14]/30 outline-none focus:border-[#5b0e14]/30 transition-all shadow-inner"
            />
            <button 
              onClick={handleSend}
              disabled={!inputValue.trim() || isThinking}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-14 h-14 rounded-full bg-[#5b0e14] flex items-center justify-center text-[#f1e194] shadow-2xl disabled:opacity-50 hover:scale-105 active:scale-95 transition-all"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
          <p className="mt-6 text-center text-[10px] text-[#5b0e14]/30 uppercase tracking-[0.4em] font-black flex items-center justify-center gap-3">
            <Sparkles className="w-3.5 h-3.5" />
            Military-Grade Encryption Active
          </p>
        </div>
      </div>
    </div>
  );
}
