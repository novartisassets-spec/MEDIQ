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

export default function App() {
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
    </Router>
  );
}
