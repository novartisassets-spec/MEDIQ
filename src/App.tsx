import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import LoginPage from './pages/Login';
import SignupPage from './pages/Signup';
import ArchitecturePage from './pages/Architecture';
import IntelligencePage from './pages/Intelligence';
import ProtocolPage from './pages/Protocol';
import ManifestoPage from './pages/Manifesto';
import Dashboard from './pages/Dashboard';
import ProtectedRoute from './components/layout/ProtectedRoute';
import { FloatingChatIcon } from './components/ui/FloatingChatIcon';
import { AIChatWindow } from './components/ui/AIChatWindow';
import { useState } from 'react';

export default function App() {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [hasUnreadMessages, setHasUnreadMessages] = useState(false);

  useEffect(() => {
    // Diagnostic Heartbeat
    const checkPulse = async () => {
      console.log('[Heartbeat] Checking link to biological core...');
      try {
        const response = await fetch('/api/v1/health');
        if (response.ok) {
          console.log('[Heartbeat] Biological Core ONLINE.');
        } else {
          console.error('[Heartbeat] Biological Core UNSTABLE:', response.status);
        }
      } catch (err) {
        console.error('[Heartbeat] Biological Core OFFLINE. Check proxy or Render status.', err);
      }
    };
    checkPulse();
  }, []);

  const toggleChat = () => {
    setIsChatOpen(prev => !prev);
    if (isChatOpen) {
      setHasUnreadMessages(false); // Clear unread when chat opens
    }
  };

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/architecture" element={<ArchitecturePage />} />
        <Route path="/intelligence" element={<IntelligencePage />} />
        <Route path="/protocol" element={<ProtocolPage />} />
        <Route path="/manifesto" element={<ManifestoPage />} />
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } 
        />
        {/* Redirect to Home for any unknown routes */}
        <Route path="*" element={<Home />} />
      </Routes>
      <FloatingChatIcon onClick={toggleChat} hasUnreadMessages={hasUnreadMessages} />
      <AIChatWindow isOpen={isChatOpen} onClose={toggleChat} />
    </Router>
  );
}
