import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  Menu, X, Stethoscope, ChevronRight, Scan, 
  Layers, Brain, Activity, ScrollText, ShieldCheck,
  LayoutDashboard
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isVaultOpen, setIsVaultOpen] = useState(false);
  const [vaultProgress, setVaultProgress] = useState(0);
  const [vaultStatus, setVaultStatus] = useState("Awaiting...");

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Architecture', path: '/architecture', icon: Layers },
    { name: 'Intelligence', path: '/intelligence', icon: Brain },
    { name: 'Protocol', path: '/protocol', icon: Activity },
    { name: 'Manifesto', path: '/manifesto', icon: ScrollText },
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  ];

  return (
    <>
      {/* --- Biometric Vault Overlay --- */}
      {isVaultOpen && (
        <div className="fixed inset-0 z-[300] bg-[#5b0e14]/98 backdrop-blur-3xl flex items-center justify-center p-6">
          <div className="max-w-md w-full space-y-12 text-center reveal-on-scroll visible">
            <div className="relative mx-auto w-40 h-40 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-2 border-[#f1e194]/20 animate-spin-slow" />
              <Scan className="w-16 h-16 text-[#f1e194] animate-pulse" />
              <div className="absolute top-1/2 left-0 w-full h-0.5 bg-[#f1e194] scanner-line shadow-[0_0_15px_#f1e194]" />
            </div>
            <div className="space-y-4">
              <h2 className="text-2xl font-serif font-black text-[#f1e194] tracking-tight uppercase">Sovereign Link</h2>
              <p className="text-[10px] font-black tracking-[0.5em] text-[#f1e194]/40 uppercase">{vaultStatus}</p>
            </div>
            <div className="w-full bg-[#f1e194]/10 h-1 rounded-full overflow-hidden">
              <div className="bg-[#f1e194] h-full transition-all duration-500" style={{ width: `${vaultProgress}%` }} />
            </div>
          </div>
        </div>
      )}

      {/* --- Main Navigation Bar --- */}
      <nav className={`fixed top-0 w-full z-[100] transition-all duration-700 ${scrolled ? 'bg-[#f1e194]/90 backdrop-blur-xl py-3 border-b border-[#5b0e14]/5 shadow-sm' : 'bg-transparent py-8'}`}>
        <div className="max-w-screen-2xl mx-auto px-6 md:px-12 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group transition-transform active:scale-95">
            <div className="relative w-10 h-10 bg-[#5b0e14] rounded-xl flex items-center justify-center shadow-lg group-hover:rotate-12 transition-transform duration-500">
              <Stethoscope className="w-5 h-5 text-[#f1e194]" />
            </div>
            <span className="text-xl font-serif font-black tracking-tighter text-[#5b0e14]">MEDIQ</span>
          </Link>

          {/* Desktop Links */}
          <div className="hidden lg:flex items-center gap-12">
            {navLinks.map((link) => (
              <Link 
                key={link.name} 
                to={link.path} 
                className={`text-[10px] font-black tracking-[0.3em] uppercase transition-all duration-500 relative group ${location.pathname === link.path ? 'text-[#5b0e14]' : 'text-[#5b0e14]/40 hover:text-[#5b0e14]'}`}
              >
                {link.name}
                <span className={`absolute -bottom-2 left-0 h-0.5 bg-[#5b0e14] transition-all duration-500 ${location.pathname === link.path ? 'w-full' : 'w-0 group-hover:w-full'}`} />
              </Link>
            ))}
            <div className="w-px h-8 bg-[#5b0e14]/10 mx-2" />
            <button onClick={() => {
              setIsVaultOpen(true);
              let progress = 0;
              const steps = ["Initializing...", "Scanning Iris...", "Verifying...", "Granting Access..."];
              const interval = setInterval(() => {
                progress += 25;
                setVaultProgress(progress);
                setVaultStatus(steps[Math.min(Math.floor(progress/25), 3)]);
                if (progress >= 100) {
                  clearInterval(interval);
                  setTimeout(() => {
                    setIsVaultOpen(false);
                    navigate('/dashboard');
                  }, 800);
                }
              }, 600);
            }}>
              <Button className="h-12 px-8 rounded-full bg-[#5b0e14] text-[#f1e194] text-[10px] font-black uppercase tracking-[0.2em] hover:bg-black transition-all shadow-xl shadow-[#5b0e14]/10">
                Initialize <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </button>
          </div>


          {/* Mobile Menu Button - Sleeker */}
          <button className="lg:hidden w-11 h-11 rounded-full bg-[#5b0e14] text-[#f1e194] flex items-center justify-center shadow-lg active:scale-90 transition-transform" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </nav>

      {/* --- SMART MOBILE NAVIGATION --- */}
      <div className={`fixed inset-0 z-[150] transition-all duration-700 lg:hidden ${isMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
        <div className="absolute inset-0 bg-[#5b0e14]/30 backdrop-blur-md" onClick={() => setIsMenuOpen(false)} />
        
        <div className={`absolute right-6 top-24 w-[280px] bg-[#f1e194]/95 backdrop-blur-3xl shadow-[0_30px_60px_rgba(91,14,20,0.2)] rounded-[2.5rem] border border-[#5b0e14]/10 transition-all duration-700 overflow-hidden flex flex-col ${isMenuOpen ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
          <div className="p-8 space-y-8">
            <div className="flex flex-col gap-4">
              {navLinks.map((link, i) => (
                <Link 
                  key={link.name} 
                  to={link.path} 
                  onClick={() => setIsMenuOpen(false)}
                  className={`flex items-center justify-between p-4 rounded-2xl transition-all duration-500 group ${location.pathname === link.path ? 'bg-[#5b0e14] text-[#f1e194]' : 'hover:bg-[#5b0e14]/5 text-[#5b0e14]'}`}
                  style={{ transitionDelay: `${i * 50}ms` }}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${location.pathname === link.path ? 'bg-[#f1e194]/20' : 'bg-[#5b0e14]/5'}`}>
                      <link.icon size={16} />
                    </div>
                    <span className="text-xs font-bold uppercase tracking-widest">{link.name}</span>
                  </div>
                  <ChevronRight size={14} className={`transition-transform duration-500 ${location.pathname === link.path ? 'translate-x-0' : '-translate-x-2 opacity-0 group-hover:translate-x-0 group-hover:opacity-100'}`} />
                </Link>
              ))}
            </div>

            <div className="h-px w-full bg-[#5b0e14]/5" />

            <div className="space-y-4">
              <button onClick={() => {
                setIsMenuOpen(false);
                setIsVaultOpen(true);
                let progress = 0;
                const steps = ["Initializing...", "Scanning Iris...", "Verifying...", "Granting Access..."];
                const interval = setInterval(() => {
                  progress += 25;
                  setVaultProgress(progress);
                  setVaultStatus(steps[Math.min(Math.floor(progress/25), 3)]);
                  if (progress >= 100) {
                    clearInterval(interval);
                    setTimeout(() => {
                      setIsVaultOpen(false);
                      navigate('/dashboard');
                    }, 800);
                  }
                }, 600);
              }} className="w-full">
                <Button className="w-full h-14 rounded-2xl bg-[#5b0e14] text-[#f1e194] text-[10px] font-black uppercase tracking-[0.2em] shadow-xl">
                  <ShieldCheck className="w-4 h-4 mr-2" />
                  Establish Identity
                </Button>
              </button>
              <p className="text-center text-[8px] font-black tracking-[0.3em] text-[#5b0e14]/30 uppercase">Protocol v.8.2.0 ACTIVE</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
