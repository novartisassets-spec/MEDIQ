import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Lock, Mail, ArrowLeft, Sparkles, Zap, Fingerprint, ShieldCheck } from 'lucide-react';
import { gsap } from 'gsap';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  
  const mainRef = useRef<HTMLDivElement>(null);
  const orbsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(".main-card", {
        scale: 0.95,
        opacity: 0,
        duration: 1.2,
        ease: "power3.out"
      });

      gsap.to(".luxury-orb", {
        y: "random(-30, 30)",
        x: "random(-30, 30)",
        duration: "random(5, 8)",
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut"
      });
    }, mainRef);

    const handleMouseMove = (e: MouseEvent) => {
      const { clientX, clientY } = e;
      const xPos = (clientX / window.innerWidth - 0.5) * 20;
      const yPos = (clientY / window.innerHeight - 0.5) * 20;
      gsap.to(orbsRef.current, { x: xPos, y: yPos, duration: 1.5, ease: "power2.out" });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      ctx.revert();
    };
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    let loginId = email;
    if (!email.includes('@')) {
      const cleanWhatsapp = email.replace(/\D/g, '');
      loginId = `${cleanWhatsapp}@mediq.ai`;
    }

    const { error } = await supabase.auth.signInWithPassword({ 
      email: loginId, 
      password 
    });
    
    if (error) alert(error.message);
    else navigate('/dashboard');
    setLoading(false);
  };

  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin + '/dashboard' }
    });
    if (error) alert(error.message);
  };

  return (
    <div ref={mainRef} className="min-h-screen bg-[#f1e194] text-[#5b0e14] flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans selection:bg-[#5b0e14] selection:text-[#f1e194]">
      
      {/* --- LUSTROUS 3D BACKGROUND --- */}
      <div ref={orbsRef} className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[10%] left-[10%] w-72 h-72 bg-white/40 rounded-full blur-[100px] luxury-orb" />
        <div className="absolute bottom-[10%] right-[10%] w-96 h-96 bg-[#5b0e14]/5 rounded-full blur-[120px] luxury-orb" />
        <div className="absolute inset-0 fintech-grid opacity-[0.1]" />
        <div className="absolute inset-0 grainy-overlay opacity-20" />
      </div>

      {/* PILL-SHAPED BACK BUTTON */}
      <Link to="/" className="absolute top-8 left-8 z-50">
        <button className="group px-6 py-3 rounded-full border border-[#5b0e14]/20 bg-white/40 backdrop-blur-md text-[#5b0e14] text-[10px] font-black uppercase tracking-[0.3em] hover:bg-[#5b0e14] hover:text-[#f1e194] transition-all flex items-center justify-center gap-2">
          <ArrowLeft className="w-4 h-4 opacity-70 group-hover:opacity-100 transition-opacity" /> 
          Genesis Core
        </button>
      </Link>

      <div className="w-full max-w-md relative z-10 py-6">
        <div className="main-card bg-white/40 backdrop-blur-3xl p-6 md:p-12 rounded-[3.5rem] border border-white/60 shadow-[0_40px_100px_-20px_rgba(91,14,20,0.1)] relative overflow-hidden">
          
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#5b0e14]/20 to-transparent pointer-events-none" />

          <div className="relative z-10 space-y-8">
            
            <header className="text-center space-y-4">
              <div className="w-20 h-20 rounded-[2rem] bg-[#5b0e14] flex items-center justify-center mx-auto shadow-2xl relative overflow-hidden group">
                <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity animate-pulse" />
                <Fingerprint className="w-10 h-10 text-[#f1e194]" />
              </div>
              <div className="space-y-1">
                <h1 className="text-4xl md:text-5xl font-serif font-black tracking-tighter uppercase italic">MEDIQ</h1>
                <p className="text-[9px] text-[#5b0e14]/40 uppercase tracking-[0.6em] font-mono">Access Protocol v2.0</p>
              </div>
            </header>

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[8px] font-black uppercase tracking-[0.3em] opacity-40 ml-4">Secure ID</label>
                <div className="relative group">
                  <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5b0e14] group-focus-within:text-[#5b0e14] transition-colors" />
                  <input 
                    type="text" value={email} onChange={(e) => setEmail(e.target.value)}
                    placeholder="nexus@mediq.ai or +234..." 
                    className="w-full bg-white/80 border border-transparent focus:border-[#5b0e14]/10 rounded-2xl py-4 px-12 text-[12px] font-bold uppercase tracking-widest text-[#5b0e14] outline-none transition-all shadow-sm placeholder:opacity-10" 
                    required
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[8px] font-black uppercase tracking-[0.3em] opacity-40 ml-4">Access Key</label>
                <div className="relative group">
                  <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5b0e14] group-focus-within:text-[#5b0e14] transition-colors" />
                  <input 
                    type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••" 
                    className="w-full bg-white/80 border border-transparent focus:border-[#5b0e14]/10 rounded-2xl py-4 px-12 text-[12px] font-bold tracking-[0.3em] text-[#5b0e14] outline-none transition-all shadow-sm" 
                    required
                  />
                </div>
              </div>

              <button 
                type="submit" disabled={loading}
                className="w-full group relative overflow-hidden rounded-full py-5 bg-[#5b0e14] text-[#f1e194] font-black uppercase tracking-[0.4em] text-[11px] shadow-xl hover:scale-[1.01] active:scale-98 transition-all disabled:opacity-50 mt-4 flex items-center justify-center gap-3"
              >
                <div className="absolute inset-0 bg-white/10 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-[1.2s] skew-x-[-20deg]" />
                <span className="relative flex items-center justify-center gap-3">
                  {loading ? <Zap className="w-4 h-4 animate-pulse" /> : <ShieldCheck className="w-4 h-4" />}
                  {loading ? 'AUTHENTICATING...' : 'Initialize Access'}
                </span>
              </button>
            </form>

            <div className="relative flex items-center justify-center py-2">
              <div className="absolute w-full h-[1px] bg-[#5b0e14]/10" />
              <span className="relative z-10 bg-[#f1e194]/20 backdrop-blur-md px-6 text-[8px] font-mono text-[#5b0e14]/30 uppercase tracking-[0.6em]">Neural Bridge</span>
            </div>

            <button 
              onClick={handleGoogleLogin}
              className="w-full max-w-[260px] py-3 rounded-full border border-[#5b0e14]/10 bg-white/40 text-[#5b0e14] text-[10px] font-black uppercase tracking-[0.3em] text-center hover:bg-[#5b0e14] hover:text-[#f1e194] transition-all flex items-center justify-center gap-2 group mx-auto"
            >
              <img src="https://www.google.com/favicon.ico" className="w-3 h-3 grayscale contrast-200" alt="" />
              Neural Auth (Gmail)
            </button>

            <div className="flex flex-col items-center gap-2 w-full">
                <p className="text-[9px] font-black uppercase tracking-[0.3em] opacity-30 text-center">New To The Node?</p>
                <Link 
                  to="/signup" 
                  className="w-full max-w-[260px] py-3 rounded-full border border-[#5b0e14]/10 bg-white/40 text-[#5b0e14] text-[10px] font-black uppercase tracking-[0.3em] text-center hover:bg-[#5b0e14] hover:text-[#f1e194] transition-all flex items-center justify-center gap-2 group"
                >
                  <Sparkles className="w-3 h-3 opacity-30 group-hover:opacity-100 transition-opacity" /> 
                  Initialize Protocol
                </Link>
              </div>
          </div>
        </div>
      </div>
    </div>
  );
}
