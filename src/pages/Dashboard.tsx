import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { 
  Send, Camera, User, Bot, 
  Plus, X,
  Activity, Brain, Shield,
  Menu, Phone, Stethoscope, MessageSquare,
  HeartPulse, Zap, MessageCircle, LogOut,
  Settings, Save
} from 'lucide-react';
import { gsap } from 'gsap';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  type?: 'text' | 'analysis' | 'image';
  metadata?: any;
}

const WHATSAPP_NUMBER = '+1234567890'; // Placeholder

const getBackendUrl = () => {
  return `/api/v1`;
};

const MEDIQAvatar = ({ isThinking }: { isThinking: boolean }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const coreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      gsap.to(containerRef.current, {
        y: -4,
        duration: 2,
        repeat: -1,
        yoyo: true,
        ease: "power1.inOut"
      });
    }
  }, []);

  useEffect(() => {
    if (isThinking) {
      gsap.to(coreRef.current, {
        scale: 1.2,
        duration: 0.6,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut"
      });
    } else {
      gsap.killTweensOf(coreRef.current);
      gsap.to(coreRef.current, { scale: 1, duration: 0.5 });
    }
  }, [isThinking]);

  return (
    <div ref={containerRef} className="relative w-12 h-12 flex items-center justify-center">
      <div className="absolute inset-0 border border-[#5b0e14]/20 rounded-full animate-spin-slow" />
      <div ref={coreRef} className="w-8 h-8 bg-[#5b0e14] rounded-full flex items-center justify-center shadow-lg border border-[#f1e194]/30">
        <Bot className="w-4 h-4 text-[#f1e194]" />
      </div>
    </div>
  );
};

export default function Dashboard() {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<any[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [hasEngaged, setHasEngaged] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [thinkingStage, setThinkingStage] = useState('Consulting MEDIQ Core...');
  const [streamingText, setStreamingText] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isBackendOnline, setIsBackendOnline] = useState<boolean | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editName, setEditName] = useState('');
  const [editWhatsapp, setEditWhatsapp] = useState('');
  const [latestBiomarkers, setLatestBiomarkers] = useState<any[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const BACKEND_URL = getBackendUrl();
  
  // 0. Auth & Profile Check
  useEffect(() => {
    const initDashboard = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/login');
        return;
      }
      setUserId(session.user.id);
      
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();
      
      if (profileData) {
        setProfile(profileData);
        setEditName(profileData.full_name || '');
        setEditWhatsapp(profileData.whatsapp_number?.split('@')[0] || '');
      } else {
        // Identity not found in database (likely after a nuke)
        console.warn('Sovereign identity not found in database. Purging ghost session...');
        await supabase.auth.signOut();
        navigate('/login');
      }
    };
    initDashboard();
  }, [navigate]);

  const updateProfile = async () => {
    if (!userId) return;
    try {
      const cleanWhatsapp = editWhatsapp.replace(/\D/g, '');
      const fullJid = cleanWhatsapp.includes('@') ? cleanWhatsapp : `${cleanWhatsapp}@s.whatsapp.net`;
      
      const res = await fetch(`${BACKEND_URL}/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          updates: {
            full_name: editName,
            whatsapp_number: fullJid
          }
        })
      });

      if (res.ok) {
        toast.success('Identity Protocol Updated');
        const updated = await res.json();
        setProfile(updated);
        setIsEditingProfile(false);
      }
    } catch (e) {
      toast.error('Failed to update identity');
    }
  };

  // 1. Fetch User Sessions & Biomarkers
  const fetchDashboardData = async () => {
    if (!userId) return;
    try {
      const [sessionsRes, biomarkersRes] = await Promise.all([
        fetch(`${BACKEND_URL}/sessions?userId=${userId}`),
        fetch(`${BACKEND_URL}/biomarkers/latest?userId=${userId}`)
      ]);
      
      if (sessionsRes.ok) setSessions(await sessionsRes.json());
      if (biomarkersRes.ok) setLatestBiomarkers(await biomarkersRes.json());
    } catch (e) {
      console.warn('Backend data unreachable');
    }
  };

  useEffect(() => {
    if (userId) fetchDashboardData();
  }, [userId]);

  // 2. Load Session History
  const deleteSession = async (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();
    if (!window.confirm('Terminate this protocol session? Data will be archived.')) return;
    
    try {
      const res = await fetch(`${BACKEND_URL}/session/${sessionId}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Session Terminated');
        if (activeSessionId === sessionId) {
          setMessages([]);
          setHasEngaged(false);
          setActiveSessionId(null);
        }
        fetchDashboardData();
      }
    } catch (e) {
      toast.error('Failed to terminate session');
    }
  };

  const loadSession = async (sessionId: string) => {
    setIsThinking(true);
    setThinkingStage('Retrieving clinical history...');
    try {
      const res = await fetch(`${BACKEND_URL}/history/${sessionId}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.map((m: any) => ({
          id: m.id,
          role: m.role,
          content: m.content,
          timestamp: new Date(m.created_at)
        })));
        setActiveSessionId(sessionId);
        setHasEngaged(true);
      }
    } catch (e) {
      toast.error('Failed to load history');
    } finally {
      setIsThinking(false);
    }
  };

  // 3. Connection Health Check
  useEffect(() => {
    const checkConnection = async () => {
      try {
        const res = await fetch(`/api/v1/health`);
        setIsBackendOnline(res.ok);
      } catch (e) {
        setIsBackendOnline(false);
      }
    };
    checkConnection();
  }, []);

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

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [messages, isThinking]);

  const handleSend = async (forcedValue?: string) => {
    const text = forcedValue || inputValue;
    if (!text.trim() || isThinking) return;

    if (!hasEngaged) setHasEngaged(true);

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsThinking(true);
    setThinkingStage('Synthesizing biological data...');

    try {
      const response = await fetch(`${BACKEND_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          userId,
          sessionId: activeSessionId,
          history: messages.map(m => ({ 
            role: m.role, 
            content: m.content,
            timestamp: m.timestamp 
          }))
        }),
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      
      // Update active session if it's new
      // Update active session if it's new
      if (!activeSessionId && data.sessionId) {
        setActiveSessionId(data.sessionId);
        fetchDashboardData();
      }

      setIsThinking(false);
      const fullText = await typeText(data.response || "Clinical synthesis complete.");

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: fullText,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
      setStreamingText('');
    } catch (error) {
      console.error('Chat error:', error);
      setIsThinking(false);
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "Neural link recalibrating. I am currently unable to reach the core processor.",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMsg]);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!hasEngaged) setHasEngaged(true);

    setIsUploading(true);
    setIsThinking(true);
    
    const uploadMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: `Media Stream: ${file.name}`,
      type: 'image',
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, uploadMsg]);

    setIsThinking(true);
    setThinkingStage('Initiating clinical scan...');

    try {
      const response = await fetch(`${BACKEND_URL}/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileUrl: 'https://example.com/mock.jpg', // In production, upload to storage first
          userId,
          sessionId: activeSessionId
        }),
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      
      // Update active session if it's new
      if (!activeSessionId && data.sessionId) {
        setActiveSessionId(data.sessionId);
        fetchDashboardData();
      }

      setIsThinking(false);
      const fullText = await typeText(data.summary || "Biomarkers extracted and mapped to protocol.");

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: fullText,
        type: 'analysis',
        metadata: data.findings,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
      setStreamingText('');
    } catch (error) {
      console.error('Analysis error:', error);
      setIsThinking(false);
      toast.error('Analysis failed.');
    }
  };

  return (
    <div className="flex h-[100dvh] w-full bg-[#f1e194] text-[#5b0e14] overflow-hidden font-sans selection:bg-[#5b0e14] selection:text-[#f1e194]">
      {/* --- SIDEBAR --- */}
      <aside 
        className={`fixed lg:static inset-y-0 left-0 z-50 w-72 bg-[#5b0e14] text-[#f1e194] transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] shadow-2xl transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        <div className="flex flex-col h-full p-6">
          <div className="flex items-center justify-between mb-10">
            <div className="flex items-center gap-3 group cursor-pointer" onClick={() => navigate('/')}>
              <div className="w-10 h-10 bg-[#f1e194] rounded-xl flex items-center justify-center shadow-lg transition-transform group-hover:rotate-6">
                <Stethoscope className="w-5 h-5 text-[#5b0e14]" />
              </div>
              <span className="font-serif font-black text-xl tracking-tight uppercase">MEDIQ</span>
            </div>
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-2 hover:bg-white/10 rounded-full">
              <X className="w-6 h-6" />
            </button>
          </div>

          <Button 
            variant="outline" 
            className="w-full justify-start gap-3 mb-10 bg-white/5 border-white/10 hover:bg-white/10 text-[#f1e194] rounded-2xl py-8 transition-all"
            onClick={() => { 
              setMessages([]); 
              setHasEngaged(false); 
              setActiveSessionId(null);
            }}
          >
            <Plus className="w-5 h-5" />
            <span className="text-xs font-black uppercase tracking-widest">New Session</span>
          </Button>

          <div className="flex-1 space-y-8 overflow-y-auto no-scrollbar">
            {sessions.length > 0 && (
              <div className="space-y-4">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-30 px-2 font-mono">History</p>
                <div className="space-y-2">
                  {sessions.map((session) => (
                    <div key={session.id} className="relative group">
                      <button 
                        onClick={() => loadSession(session.id)}
                        className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left ${activeSessionId === session.id ? 'bg-[#f1e194] text-[#5b0e14]' : 'hover:bg-white/5 text-[#f1e194]/70 hover:text-[#f1e194]'}`}
                      >
                        {session.platform === 'whatsapp' ? (
                          <MessageCircle className={`w-4 h-4 ${activeSessionId === session.id ? 'text-[#5b0e14]' : 'text-emerald-400 opacity-60'}`} />
                        ) : (
                          <MessageSquare className={`w-4 h-4 ${activeSessionId === session.id ? 'text-[#5b0e14]' : 'opacity-40 group-hover:opacity-100'}`} />
                        )}
                        <div className="flex-1 min-w-0">
                          <span className="text-xs font-medium truncate block">{session.title}</span>
                          {session.platform === 'whatsapp' && (
                            <span className="text-[7px] font-black uppercase tracking-widest opacity-40">WhatsApp Neural Link</span>
                          )}
                        </div>
                      </button>
                      
                      {/* DELETE BUTTON */}
                      <button 
                        onClick={(e) => deleteSession(e, session.id)}
                        className={`absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-500/20 text-red-400 transition-all ${activeSessionId === session.id ? 'group-hover:text-red-600' : ''}`}
                        title="Archive Session"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-4">
              <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-30 px-2 flex items-center justify-between font-mono">
                <span>Clinical Nodes</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              </p>
              <div className="grid grid-cols-1 gap-3">
                {[
                  { 
                    n: 'Metabolic', 
                    s: latestBiomarkers.find(b => b.category === 'Metabolic' || b.name.includes('Glucose'))?.value 
                      ? `${latestBiomarkers.find(b => b.category === 'Metabolic' || b.name.includes('Glucose'))?.value} ${latestBiomarkers.find(b => b.category === 'Metabolic' || b.name.includes('Glucose'))?.unit || ''}`
                      : 'Baseline Pending', 
                    c: 'text-emerald-400', 
                    i: Zap 
                  },
                  { 
                    n: 'Inflammation', 
                    s: latestBiomarkers.find(b => b.name.includes('CRP'))?.value 
                      ? `${latestBiomarkers.find(b => b.name.includes('CRP'))?.value} ${latestBiomarkers.find(b => b.name.includes('CRP'))?.unit || ''}`
                      : 'Elite', 
                    c: 'text-amber-400', 
                    i: HeartPulse 
                  }
                ].map((node, i) => (
                  <div key={i} className="p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors cursor-pointer group">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <node.i className="w-3 h-3 opacity-40" />
                        <span className="text-[10px] font-bold uppercase tracking-wider">{node.n}</span>
                      </div>
                      <span className={`text-[8px] font-black tracking-widest ${node.c}`}>{node.s}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-auto pt-6 border-t border-white/10">
            <div className="flex items-center gap-4 p-4 bg-white/5 rounded-3xl border border-white/5">
              <div className="w-10 h-10 rounded-2xl bg-[#f1e194] flex items-center justify-center text-[#5b0e14] font-black text-xs uppercase">
                {profile?.username?.[0] || profile?.full_name?.[0] || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-black truncate uppercase tracking-widest">{profile?.username || profile?.full_name || 'Sovereign'}</p>
                <p className="text-[9px] opacity-40 uppercase font-bold">{profile?.country || 'Global'} Node</p>
              </div>
              <div className="flex flex-col gap-1">
                <button 
                  onClick={() => setIsEditingProfile(true)}
                  className="p-1.5 hover:bg-white/10 rounded-lg transition-colors group"
                  title="Profile Settings"
                >
                  <Settings className="w-3.5 h-3.5 opacity-30 group-hover:opacity-100" />
                </button>
                <button 
                  onClick={async () => {
                    await supabase.auth.signOut();
                    navigate('/login');
                  }}
                  className="p-1.5 hover:bg-white/10 rounded-lg transition-colors group"
                  title="Logout"
                >
                  <LogOut className="w-3.5 h-3.5 opacity-30 group-hover:opacity-100 group-hover:text-red-400" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* --- MAIN INTERFACE --- */}
      <main className="flex-1 flex flex-col relative h-full bg-transparent">
        {/* ULTRA-SLIM HEADER */}
        <header className="h-14 flex items-center justify-between px-6 border-b border-[#5b0e14]/5 bg-transparent z-40">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 hover:bg-[#5b0e14]/5 rounded-full text-[#5b0e14] transition-colors">
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3 logo-bounce cursor-pointer" onClick={() => navigate('/')}>
              <Stethoscope className="w-4 h-4 text-[#5b0e14]" />
              <h1 className="text-sm font-serif font-black tracking-tight text-[#5b0e14] uppercase">MEDIQ</h1>
              <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full border transition-colors ${isBackendOnline ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-red-500/5 border-red-500/20'}`}>
                <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${isBackendOnline ? 'bg-emerald-500' : 'bg-red-500'}`} />
                <span className={`text-[7px] font-black uppercase tracking-widest ${isBackendOnline ? 'text-emerald-600' : 'text-red-600'}`}>
                  {isBackendOnline ? 'Connected' : 'Offline'}
                </span>
              </div>
            </div>
          </div>
          
          <a 
            href={`https://wa.me/${WHATSAPP_NUMBER.replace('+', '')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 bg-[#5b0e14] text-[#f1e194] px-4 py-1.5 rounded-full hover:scale-105 transition-all active:scale-95 shadow-xl shadow-[#5b0e14]/10 call-bounce"
          >
            <Phone className="w-3 h-3" />
            <span className="text-[8px] font-black uppercase tracking-[0.2em] hidden xs:inline">WhatsApp Support</span>
          </a>
        </header>

        {/* CHAT OR LANDING */}
        <div 
          ref={scrollRef} 
          className={`flex-1 overflow-y-auto scroll-smooth no-scrollbar relative ${hasEngaged ? 'p-4 md:p-10' : 'flex flex-col items-center justify-center p-6'}`}
        >
          {!hasEngaged ? (
            <div className="w-full max-w-2xl space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-1000">
              <div className="text-center space-y-6">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-[#5b0e14] text-[#f1e194] shadow-2xl mb-4 relative">
                  <Stethoscope className="w-10 h-10" />
                  <div className="absolute -inset-2 border border-[#5b0e14]/10 rounded-full animate-ping opacity-20" />
                </div>
                <h2 className="text-4xl md:text-6xl font-serif font-black tracking-tighter text-[#5b0e14]">How shall we <br /> <span className="italic font-light opacity-60">optimize?</span></h2>
                <p className="text-lg md:text-xl font-serif italic text-[#5b0e14]/60">Input your clinical data or query the neural core.</p>
              </div>

              {/* CENTERED INPUT PREVIEW */}
              <div className="relative group scale-100 transform transition-all duration-700 w-full max-w-xl input-bounce">
                <div className="absolute -inset-1 bg-gradient-to-r from-[#f1e194]/20 to-[#f1e194]/5 rounded-[2rem] blur opacity-40 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-pulse" />
                <div className="relative">
                  <input 
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    placeholder="Query your biological protocol..."
                    className="w-full h-16 pl-8 pr-32 rounded-[2rem] bg-[#000000] border border-[#f1e194]/30 text-[#f1e194] placeholder:text-[#f1e194]/20 focus:outline-none focus:border-[#f1e194]/60 transition-all shadow-[0_0_30px_rgba(241,225,148,0.1)] text-lg font-serif italic"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="w-10 h-10 rounded-full bg-[#f1e194]/10 text-[#f1e194] hover:bg-[#f1e194]/20 transition-all flex items-center justify-center group/cam"
                    >
                      <Camera className="w-5 h-5 group-hover/cam:scale-110 transition-transform" />
                    </button>
                    <button 
                      onClick={() => handleSend()}
                      className="w-10 h-10 rounded-full bg-[#f1e194] text-[#5b0e14] flex items-center justify-center shadow-[0_0_15px_rgba(241,225,148,0.4)] hover:scale-105 active:scale-95 transition-all"
                    >
                      <Send className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* TINY DATA CARDS */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-8">
                {[
                  { 
                    l: 'HRV Index', 
                    v: latestBiomarkers.find(b => b.name.includes('HRV'))?.value || '---', 
                    i: Activity, 
                    c: 'text-emerald-500' 
                  },
                  { 
                    l: 'Metabolic', 
                    v: latestBiomarkers.find(b => b.name.includes('Glucose'))?.value ? 'Active' : 'Pending', 
                    i: Zap, 
                    c: 'text-amber-500' 
                  },
                  { 
                    l: 'Neural', 
                    v: 'Elite', 
                    i: Brain, 
                    c: 'text-[#5b0e14]' 
                  },
                  { 
                    l: 'Core Status', 
                    v: 'Connected', 
                    i: Shield, 
                    c: 'text-emerald-500' 
                  }
                ].map((card, i) => (
                  <div key={i} className="bg-white/60 backdrop-blur-xl p-4 rounded-2xl border border-[#5b0e14]/5 shadow-sm hover:-translate-y-1 transition-transform cursor-help group">
                    <div className="flex items-center gap-2 mb-2 opacity-40 group-hover:opacity-100 transition-opacity">
                      <card.i className="w-3 h-3" />
                      <span className="text-[8px] font-black uppercase tracking-widest">{card.l}</span>
                    </div>
                    <p className={`text-sm font-black font-serif ${card.c}`}>{card.v}</p>
                  </div>
                ))}
              </div>

              {/* SUGGESTED ACTIONS */}
              <div className="flex flex-wrap justify-center gap-3 opacity-60">
                {['Analyze Blood Panel', 'Optimization Strategy', 'Epigenetic Audit', 'Sleep Protocol'].map((action, i) => (
                  <button 
                    key={i} 
                    onClick={() => handleSend(action)}
                    className="px-5 py-2.5 rounded-full border border-[#5b0e14]/10 text-[10px] font-bold uppercase tracking-widest hover:bg-[#5b0e14] hover:text-[#f1e194] transition-all duration-500"
                  >
                    {action}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="max-w-4xl mx-auto w-full space-y-10 pb-40">
              {messages.map((msg, i) => (
                <div 
                  key={msg.id} 
                  className={`flex gap-5 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'} items-start animate-in fade-in slide-in-from-bottom-4 duration-500`}
                >
                  <div className="flex-shrink-0 mt-1">
                    {msg.role === 'assistant' ? (
                      <MEDIQAvatar isThinking={isThinking && i === messages.length - 1} />
                    ) : (
                      <div className="w-10 h-10 rounded-2xl bg-[#5b0e14] flex items-center justify-center shadow-xl border border-white/10">
                        <User className="w-5 h-5 text-[#f1e194]" />
                      </div>
                    )}
                  </div>

                  <div className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} max-w-[88%]`}>
                    <div className={`relative p-6 sm:p-8 rounded-[2rem] text-sm sm:text-base leading-relaxed ${msg.role === 'user' ? 'bg-[#5b0e14] text-[#f1e194] font-medium rounded-tr-none shadow-2xl' : 'bg-white/90 backdrop-blur-xl border border-[#5b0e14]/5 text-[#5b0e14] rounded-tl-none font-serif italic shadow-sm'}`}>
                      {msg.type === 'image' && (
                        <div className="mb-4 rounded-2xl overflow-hidden border border-black/5 bg-[#5b0e14]/5 p-6 flex flex-col items-center gap-3">
                          <Camera className="w-8 h-8 opacity-20" />
                          <span className="text-[9px] font-black uppercase tracking-[0.3em] opacity-30">Biometric Stream Active</span>
                        </div>
                      )}
                      {msg.content}
                    </div>
                    <span className="mt-3 text-[7px] font-black uppercase tracking-[0.4em] opacity-20 px-4">
                      {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))}

              {streamingText && (
                <div className="flex gap-5 items-start animate-in fade-in duration-300">
                  <MEDIQAvatar isThinking={false} />
                  <div className="flex flex-col items-start max-w-[88%]">
                    <div className="relative p-6 sm:p-8 rounded-[2rem] text-sm sm:text-base leading-relaxed bg-white/90 backdrop-blur-xl border border-[#5b0e14]/5 text-[#5b0e14] rounded-tl-none font-serif italic shadow-sm">
                      {streamingText}
                      <span className="inline-block w-1 h-4 bg-[#5b0e14] ml-1 animate-pulse" />
                    </div>
                  </div>
                </div>
              )}

              {isThinking && (
                <div className="flex gap-5 items-start">
                  <MEDIQAvatar isThinking={true} />
                  <div className="mt-5 flex flex-col gap-3">
                    <div className="flex gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#5b0e14] animate-bounce" style={{ animationDelay: '0s' }} />
                      <div className="w-1.5 h-1.5 rounded-full bg-[#5b0e14] animate-bounce" style={{ animationDelay: '0.2s' }} />
                      <div className="w-1.5 h-1.5 rounded-full bg-[#5b0e14] animate-bounce" style={{ animationDelay: '0.4s' }} />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] opacity-30">{thinkingStage}</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* PRO INPUT BAR - STICKY BOTTOM */}
        {hasEngaged && (
          <div className="absolute bottom-0 left-0 right-0 p-4 md:p-8 bg-gradient-to-t from-[#f1e194] via-[#f1e194]/95 to-transparent z-40">
            <div className="max-w-4xl mx-auto w-full relative">
              <div className="relative group input-bounce">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-[#f1e194]/30 to-[#f1e194]/10 rounded-full blur opacity-20 group-hover:opacity-50 transition duration-1000" />
                <div className="relative flex items-center">
                  <input 
                    type="text"
                    value={inputValue}
                    disabled={isUploading}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    placeholder={isUploading ? "MEDIQ is synthesizing..." : "Update biological protocol..."}
                    className="w-full h-14 sm:h-16 pl-8 pr-36 rounded-full bg-[#000000] border border-[#f1e194]/30 text-[#f1e194] placeholder:text-[#f1e194]/20 focus:outline-none focus:border-[#f1e194]/60 transition-all shadow-2xl text-base sm:text-lg font-serif italic"
                  />
                  
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2 pr-1">
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-[#f1e194]/10 text-[#f1e194] hover:bg-[#f1e194]/20 transition-all flex items-center justify-center group active:scale-90"
                      title="Scan Biomarkers"
                    >
                      <Camera className="w-4 h-4 sm:w-5 sm:h-5 group-hover:scale-110 transition-transform" />
                    </button>
                    <a 
                      href={`https://wa.me/${WHATSAPP_NUMBER.replace('+', '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500 hover:text-white transition-all flex items-center justify-center active:scale-90"
                    >
                      <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                    </a>
                    <button 
                      onClick={() => handleSend()}
                      disabled={!inputValue.trim() || isThinking}
                      className="w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-[#f1e194] text-[#5b0e14] flex items-center justify-center shadow-lg disabled:opacity-20 hover:scale-105 active:scale-95 transition-all"
                    >
                      <Send className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>
                  </div>
                </div>
              </div>
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />
            </div>
          </div>
        )}
      </main>

      {/* --- PROFILE EDIT MODAL --- */}
      {isEditingProfile && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#5b0e14]/60 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="bg-[#f1e194] w-full max-w-md rounded-[3rem] p-8 md:p-12 shadow-2xl border border-white/20 space-y-8 animate-in zoom-in-95 duration-300">
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-serif font-black text-[#5b0e14] uppercase italic">Update Identity</h3>
              <button onClick={() => setIsEditingProfile(false)} className="p-2 hover:bg-[#5b0e14]/5 rounded-full transition-colors">
                <X className="w-6 h-6 text-[#5b0e14]" />
              </button>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase tracking-widest opacity-40 ml-4">Full Name</label>
                <input 
                  type="text" value={editName} onChange={(e) => setEditName(e.target.value)}
                  className="w-full bg-[#5b0e14]/5 border border-transparent focus:border-[#5b0e14]/10 rounded-2xl py-4 px-6 text-sm font-bold text-[#5b0e14] outline-none transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase tracking-widest opacity-40 ml-4">WhatsApp Link</label>
                <input 
                  type="text" value={editWhatsapp} onChange={(e) => setEditWhatsapp(e.target.value)}
                  placeholder="e.g. 2348123456789"
                  className="w-full bg-[#5b0e14]/5 border border-transparent focus:border-[#5b0e14]/10 rounded-2xl py-4 px-6 text-sm font-bold text-[#5b0e14] outline-none transition-all"
                />
              </div>

              <div className="pt-4 space-y-3">
                <Button 
                  onClick={updateProfile}
                  className="w-full py-7 bg-[#5b0e14] text-[#f1e194] rounded-2xl font-black uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  Save Changes
                </Button>
                
                <div className="relative py-4">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-[#5b0e14]/10"></div></div>
                  <div className="relative flex justify-center text-[8px] font-black uppercase tracking-widest text-[#5b0e14]/30 bg-[#f1e194] px-4">Danger Zone</div>
                </div>

                <Button 
                  variant="outline"
                  className="w-full py-7 border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white rounded-2xl font-black uppercase tracking-widest transition-all"
                  onClick={async () => {
                    if (window.confirm("NUKE ALERT: This will permanently wipe ALL your clinical data, sessions, and biomarkers. This is irreversible. Proceed?")) {
                      const toastId = toast.loading("Initiating Core Reset...");
                      try {
                        const res = await fetch(`${BACKEND_URL}/nuke-user`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ userId })
                        });
                        if (res.ok) {
                          toast.success('Core Reset Complete.', { id: toastId });
                          await supabase.auth.signOut();
                          navigate('/login');
                        } else {
                          toast.error('Reset failed.', { id: toastId });
                        }
                      } catch (e) {
                        toast.error('Critical reset failure.', { id: toastId });
                      }
                    }
                  }}
                >
                  Reset Core Data
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
