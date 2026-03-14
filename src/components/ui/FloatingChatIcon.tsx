import React from 'react';
import { Bot } from 'lucide-react';
import { motion } from 'framer-motion';

interface FloatingChatIconProps {
  onClick: () => void;
  hasUnreadMessages: boolean;
}

export const FloatingChatIcon: React.FC<FloatingChatIconProps> = ({ onClick, hasUnreadMessages }) => {
  return (
    <motion.button
      onClick={onClick}
      className="fixed bottom-6 right-6 z-50 p-4 rounded-full bg-[#5b0e14] text-[#f1e194] shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-110 flex items-center justify-center cursor-pointer"
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.5 }}
    >
      <Bot className="w-7 h-7" />
      {hasUnreadMessages && (
        <span className="absolute top-0 right-0 block h-3 w-3 rounded-full ring-2 ring-white bg-red-500" />
      )}
    </motion.button>
  );
};
