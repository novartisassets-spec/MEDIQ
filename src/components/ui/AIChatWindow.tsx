import React, { useState, useEffect, useRef } from 'react';
import { Bot, Send, X, Loader } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

interface Message {
  sender: 'user' | 'ai';
  text: string;
}

interface AIChatWindowProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AIChatWindow: React.FC<AIChatWindowProps> = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState<string>('');
  const [isSending, setIsSending] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (inputMessage.trim() === '' || isSending) return;

    const userMessage: Message = { sender: 'user', text: inputMessage };
    setMessages((prev) => [...prev, userMessage]);
    setInputMessage('');
    setIsSending(true);

    try {
      const history = messages.map(m => ({ 
        role: m.sender === 'user' ? 'user' : 'assistant', 
        content: m.text 
      }));
      
      const response = await fetch('/api/v1/support/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: inputMessage,
          history: history,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Support link failed');

      const aiMessage: Message = { sender: 'ai', text: data.response };
      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error('AI Chat Error:', error);
      setMessages((prev) => [
        ...prev,
        { sender: 'ai', text: 'My neural link is experiencing interference. Please try again.' },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.8 }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          className="fixed bottom-4 left-4 z-50 w-full max-w-sm md:max-w-md h-[80vh] md:h-[70vh] bg-gradient-to-br from-[#f1e194]/90 to-[#f1e194]/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 flex flex-col overflow-hidden"
        >
          <div className="flex items-center justify-between p-4 border-b border-white/20 bg-[#f1e194]/70">
            <div className="flex items-center gap-3">
              <Bot className="w-6 h-6 text-[#5b0e14]" />
              <h2 className="text-xl font-bold text-[#5b0e14]">MEDIQ AI Support</h2>
            </div>
            <button onClick={onClose} className="text-[#5b0e14] hover:text-red-500 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 p-4 overflow-y-auto space-y-4 custom-scrollbar">
            {messages.length === 0 && (
              <div className="text-center text-[#5b0e14]/60 italic mt-10">
                Hi there! How can I assist you on your journey to biological dominance today?
              </div>
            )}
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className={`max-w-[80%] p-3 rounded-xl shadow-md ${
                    msg.sender === 'user'
                      ? 'bg-[#5b0e14] text-[#f1e194] rounded-br-none'
                      : 'bg-white/70 text-[#5b0e14] rounded-bl-none border border-white/30'
                  }`}
                >
                  {msg.text}
                </motion.div>
              </div>
            ))}
            {isSending && (
              <div className="flex justify-start">
                <div className="max-w-[80%] p-3 rounded-xl shadow-md bg-white/70 text-[#5b0e14] rounded-bl-none border border-white/30 flex items-center gap-2">
                  <Loader className="w-4 h-4 animate-spin" />
                  MEDIQ is thinking...
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-4 border-t border-white/20 bg-[#f1e194]/70 flex items-center gap-3">
            <input
              type="text"
              className="flex-1 p-3 rounded-full bg-white/50 border border-white/30 text-[#5b0e14] placeholder-[#5b0e14]/60 focus:outline-none focus:ring-2 focus:ring-[#5b0e14]/50 transition-all"
              placeholder="Ask MEDIQ anything..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isSending}
            />
            <button
              onClick={sendMessage}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-[#5b0e14] text-[#f1e194] hover:bg-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isSending}
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
