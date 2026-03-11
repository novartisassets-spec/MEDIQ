import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { 
  Lock, Mail, ArrowLeft, UserCircle, 
  MessageCircle, Globe, ChevronDown, 
  ShieldCheck, Sparkles, Zap, Fingerprint 
} from 'lucide-react';
import { toast } from 'sonner';
import { gsap } from 'gsap';

const countryCodes = [
  { code: '+234', flag: '🇳🇬', name: 'Nigeria' },
  { code: '+1', flag: '🇺🇸', name: 'USA' },
  { code: '+44', flag: '🇬🇧', name: 'UK' },
  { code: '+91', flag: '🇮🇳', name: 'India' },
  { code: '+27', flag: '🇿🇦', name: 'South Africa' },
  { code: '+971', flag: '🇦🇪', name: 'UAE' },
  { code: '+254', flag: '🇰🇪', name: 'Kenya' },
  { code: '+233', flag: '🇬🇭', name: 'Ghana' },
];

export default function SignupPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [countryCode, setCountryCode] = useState('+234');
  const [whatsapp, setWhatsapp] = useState('');
  const [password, setPassword] = useState('');
  const [country, setCountry] = useState('Nigeria');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const mainRef = useRef<HTMLDivElement>(null);
  const orbsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Entry Animation
      gsap.from(".main-card", {
        scale: 0.95,
        opacity: 0,
        duration: 1.2,
        ease: "power3.out"
      });

      // Animated 3D Orbs
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

  useEffect(() => {
    const match = countryCodes.find(c => c.code === countryCode);
    if (match) setCountry(match.name);
  }, [countryCode]);

  useEffect(() => {
    const wa = searchParams.get('whatsapp');
    if (wa) setWhatsapp(wa.replace(/\D/g, ''));
  }, [searchParams]);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const cleanWhatsapp = (countryCode + whatsapp).replace(/\D/g, '');
    const fullJid = cleanWhatsapp + '@s.whatsapp.net';
    const authEmail = email || `${cleanWhatsapp}@mediq.ai`;
    
    const { data: authData, error: authError } = await supabase.auth.signUp({ 
      email: authEmail, 
      password,
      options: {
        data: { username, whatsapp_number: fullJid, country }
      }
    });
    
    if (authError) {
      toast.error(authError.message);
      setLoading(false);
      return;
    }

    if (authData.user) {
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({ 
          id: authData.user.id,
          username,
          whatsapp_number: fullJid,
          full_name: username,
          email: email || null,
          country: country || null,
          is_registered: true
        }, { onConflict: 'whatsapp_number' });
      
      if (profileError) {
        toast.error(`Sync failure: ${profileError.message}`);
      } else {
        toast.success('Protocol Initialized.');
        navigate('/dashboard');
      }
    }
    setLoading(false);
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

      <div className="w-full max-w-xl relative z-10 py-6">
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
                <p className="text-[9px] text-[#5b0e14]/40 uppercase tracking-[0.6em] font-mono">Identity Protocol v2.0</p>
              </div>
            </header>

            <form onSubmit={handleSignup} className="space-y-4">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[8px] font-black uppercase tracking-[0.3em] opacity-40 ml-4">Codename</label>
                  <div className="relative group">
                    <UserCircle className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5b0e14] group-focus-within:text-[#5b0e14] transition-colors" />
                    <input 
                      type="text" value={username} onChange={(e) => setUsername(e.target.value)}
                      placeholder="Protocol ID" 
                      className="w-full bg-white/80 border border-transparent focus:border-[#5b0e14]/10 rounded-2xl py-4 px-12 text-[12px] font-bold uppercase tracking-widest text-[#5b0e14] outline-none transition-all placeholder:text-[#5b0e14]/10 shadow-sm"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[8px] font-black uppercase tracking-[0.3em] opacity-40 ml-4">Node</label>
                  <div className="relative">
                    <Globe className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5b0e14]" />
                    <input 
                      type="text" value={country} readOnly
                      className="w-full bg-[#5b0e14]/5 border border-transparent rounded-2xl py-4 px-12 text-[12px] font-bold uppercase tracking-widest text-[#5b0e14]/40 outline-none cursor-not-allowed"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[8px] font-black uppercase tracking-[0.3em] opacity-40 ml-4">Clinical Link (WhatsApp)</label>
                <div className="flex gap-3">
                  <select
                    value={countryCode} onChange={(e) => setCountryCode(e.target.value)}
                    className="w-28 bg-white/80 border border-transparent focus:border-[#5b0e14]/10 rounded-2xl py-4 px-2 text-[12px] font-bold text-[#5b0e14] outline-none shadow-sm appearance-none text-center cursor-pointer"
                  >
                    {countryCodes.map((c) => <option key={c.code} value={c.code} className="bg-white">{c.flag} {c.code}</option>)}
                  </select>
                  <div className="relative flex-1 group">
                    <MessageCircle className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5b0e14] group-focus-within:text-[#5b0e14] transition-colors" />
                    <input 
                      type="tel" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value.replace(/\D/g, ''))}
                      placeholder="812..." 
                      className="w-full bg-white/80 border border-transparent focus:border-[#5b0e14]/10 rounded-2xl py-4 px-12 text-[12px] font-bold tracking-[0.2em] text-[#5b0e14] outline-none transition-all shadow-sm placeholder:opacity-10"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* RE-ADDING EMAIL INPUT */}
              <div className="space-y-1.5">
                <label className="text-[8px] font-black uppercase tracking-[0.3em] opacity-40 ml-4">Secure ID (Optional)</label>
                <div className="relative group">
                  <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5b0e14] group-focus-within:text-[#5b0e14] transition-colors" />
                  <input 
                    type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                    placeholder="nexus@mediq.ai" 
                    className="w-full bg-white/80 border border-transparent focus:border-[#5b0e14]/10 rounded-2xl py-4 px-12 text-[12px] font-bold uppercase tracking-widest text-[#5b0e14] outline-none transition-all shadow-sm placeholder:opacity-10"
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
                  {loading ? 'INITIALIZING...' : 'Register Protocol'}
                </span>
              </button>
            </form>

            <div className="relative flex items-center justify-center py-2">
              <div className="absolute w-full h-[1px] bg-[#5b0e14]/10" />
              <span className="relative z-10 bg-[#f1e194]/20 backdrop-blur-md px-6 text-[8px] font-mono text-[#5b0e14]/30 uppercase tracking-[0.6em]">Neural Bridge</span>
            </div>

            <div className="flex flex-col items-center gap-2"> {/* Reduced gap */}
              <p className="text-[9px] font-black uppercase tracking-[0.3em] opacity-40">Already Verified?</p>
              <Link 
                to="/login" 
                className="w-full max-w-[260px] py-3 rounded-full border border-[#5b0e14]/10 bg-white/40 text-[#5b0e14] text-[10px] font-black uppercase tracking-[0.3em] text-center hover:bg-[#5b0e14] hover:text-[#f1e194] transition-all flex items-center justify-center gap-2 group"
              >
                <Sparkles className="w-3 h-3 opacity-30 group-hover:opacity-100 transition-opacity" /> 
                Authenticate Identity
              </Link>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
