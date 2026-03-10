import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowRight,
  Brain,
  Fingerprint,
  Microscope,
  Stethoscope,
  Quote,
  Bot,
  TrendingUp,
  ShieldCheck,
  FileText
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LuxuryChat } from '@/components/ui/luxury-chat';
import { gsap } from 'gsap';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';

// --- Sub-Million Dollar Components ---

const LiveProtocolDashboard = () => {
  const [dataStream, setDataStream] = useState([
    { id: 1, label: "HRV Index", value: "84ms", status: "Optimal" },
    { id: 2, label: "Cortisol (S)", value: "12.4", status: "Normal" },
    { id: 3, label: "VO2 Max Est.", value: "54.2", status: "Elite" }
  ]);

  useEffect(() => {
    const interval = setInterval(() => {
      setDataStream(prev => {
        const newItem = {
          id: Date.now(),
          label: ["Metabolic Flux", "Glucose Delta", "Deep Sleep v3", "O2 Saturation"][Math.floor(Math.random() * 4)],
          value: (Math.random() * 100).toFixed(1),
          status: "Syncing..."
        };
        return [newItem, ...prev.slice(0, 2)];
      });
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative w-full max-w-5xl mx-auto aspect-[16/10] md:aspect-[21/9] bg-white/20 backdrop-blur-3xl rounded-[3rem] border border-white/40 shadow-[0_50px_100px_-20px_rgba(91,14,20,0.15)] overflow-hidden group">
      <div className="scanning-bar z-20" />
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#5b0e14 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
      <div className="absolute inset-0 p-6 md:p-12 flex flex-col md:flex-row gap-10">
        <div className="flex-1 bg-white/10 rounded-[2rem] border border-white/20 p-8 relative overflow-hidden">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="w-3 h-3 rounded-full bg-[#5b0e14] pulse-marker" />
              <span className="text-[10px] font-black tracking-widest uppercase text-[#5b0e14]">Biological Telemetry Live</span>
            </div>
            <div className="flex gap-2">
              <div className="w-8 h-1 bg-[#5b0e14]/10 rounded-full" />
              <div className="w-8 h-1 bg-[#5b0e14] rounded-full" />
            </div>
          </div>
          <div className="w-full h-full max-h-[200px] mt-10">
            <svg viewBox="0 0 400 100" className="w-full h-full overflow-visible">
              <path d="M0,50 Q50,20 100,60 T200,40 T300,70 T400,30" fill="none" stroke="#5b0e14" strokeWidth="2" className="chart-line-animate" />
            </svg>
          </div>
          <div className="absolute bottom-8 left-8 flex gap-10">
            <div>
              <p className="text-[8px] font-black text-[#5b0e14]/30 uppercase tracking-widest mb-1">Vitality Score</p>
              <p className="text-3xl font-serif font-black text-[#5b0e14]">98.4</p>
            </div>
          </div>
        </div>
        <div className="w-full md:w-72 flex flex-col gap-4">
          <div className="bg-[#5b0e14] rounded-[2rem] p-6 text-[#f1e194] shadow-2xl">
            <div className="flex items-center gap-3 mb-6">
              <Bot className="w-5 h-5 animate-pulse" />
              <span className="text-[9px] font-black tracking-widest uppercase">MEDIQ Context</span>
            </div>
            <p className="text-xs font-serif italic opacity-80">"Your metabolic flux is stabilizing. Optimization recommended."</p>
          </div>
          <div className="flex-1 bg-white/10 rounded-[2rem] border border-white/20 p-6 space-y-4">
            {dataStream.map((item) => (
              <div key={item.id} className="data-stream-item flex items-center justify-between py-2 border-b border-[#5b0e14]/5 last:border-0">
                <div>
                  <p className="text-[10px] font-bold text-[#5b0e14]">{item.label}</p>
                  <p className="text-[8px] text-[#5b0e14]/40 uppercase">{item.status}</p>
                </div>
                <p className="text-sm font-black text-[#5b0e14]">{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// @ts-ignore
const PillarRow = ({ img, title, sub, detail, stats, icon: Icon, reverse = false }) => (
  <div className={`flex flex-col ${reverse ? 'lg:flex-row-reverse' : 'lg:flex-row'} items-center gap-12 lg:gap-20 py-16 md:py-24 reveal-on-scroll border-b border-[#5b0e14]/5 last:border-0`}>
    <div className="w-full lg:w-1/2">
      <figure className="relative aspect-[16/10] rounded-[2rem] overflow-hidden shadow-xl group border border-white/20">
        <img src={img} alt={title} className="w-full h-full object-cover transition-transform duration-[2s] group-hover:scale-105" />
        <div className="absolute inset-0 bg-[#5b0e14]/20 mix-blend-multiply opacity-0 group-hover:opacity-40 transition-opacity" />
        <figcaption className="absolute bottom-6 left-6">
           <div className="glass-pill px-4 py-1.5 bg-white/20 border-white/40 backdrop-blur-md inline-flex items-center gap-2">
             <div className="w-1.5 h-1.5 rounded-full bg-[#f1e194] animate-pulse" />
             <span className="text-[8px] font-black text-white uppercase tracking-[0.2em]">{stats.status}</span>
           </div>
        </figcaption>
      </figure>
    </div>
    <div className="w-full lg:w-1/2 space-y-6">
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#5b0e14] flex items-center justify-center">
            <Icon className="w-5 h-5 text-[#f1e194]" />
          </div>
          <span className="text-[10px] font-black tracking-widest uppercase text-[#5b0e14]/40">{sub}</span>
        </div>
        <h3 className="text-3xl md:text-5xl font-serif font-black text-[#5b0e14]">{title}</h3>
      </div>
      <p className="text-lg text-[#5b0e14]/60 font-serif italic">{detail}</p>
      <div className="grid grid-cols-2 gap-8 py-6 border-y border-[#5b0e14]/5">
        <div>
          <p className="text-[9px] font-black text-[#5b0e14]/30 uppercase tracking-widest mb-1">Precision</p>
          <p className="text-2xl font-serif font-bold text-[#5b0e14]">{stats.precision}</p>
        </div>
        <div>
          <p className="text-[9px] font-black text-[#5b0e14]/30 uppercase tracking-widest mb-1">Impact</p>
          <p className="text-2xl font-serif font-bold text-[#5b0e14]">{stats.impact}</p>
        </div>
      </div>
      <Button variant="ghost" className="p-0 h-auto text-[10px] font-black tracking-widest uppercase text-[#5b0e14] hover:bg-transparent group">
        Technical Details <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
      </Button>
    </div>
  </div>
);

export default function Home() {
  const navigate = useNavigate();
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [messageCount, setMessageCount] = useState(0);
  const bgTextRef = useRef(null);

  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    simulateAnalysis();
  };

  const simulateAnalysis = async () => {
    setIsAnalyzing(true);
    await new Promise(r => setTimeout(r, 3500));
    setIsAnalyzing(false);
    setIsChatOpen(true);
  };

  const handleSendMessage = async (msg: string, history: any[]) => {
    if (messageCount >= 5) {
      return "You have reached the guest message limit. Please initialize your sovereign profile to continue our deep clinical partnership.";
    }

    try {
      const response = await fetch('/api/v1/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: msg,
          userId: 'guest_user_demo',
          history: history.map(m => ({ role: m.role, content: m.content }))
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Chat failed');
      
      setMessageCount(prev => prev + 1);
      return data.response;
    } catch (error) {
      console.error('Chat Error:', error);
      return "My neural link is experiencing a temporary interference. Please try again in a moment.";
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      if (bgTextRef.current) gsap.to(bgTextRef.current, { x: window.scrollY * -0.2, ease: "none" });
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) entry.target.classList.add('visible');
      });
    }, { threshold: 0.1 });
    document.querySelectorAll('.reveal-on-scroll').forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <div className="min-h-screen bg-[#f1e194] text-[#5b0e14] selection:bg-[#5b0e14] selection:text-[#f1e194] overflow-x-hidden grainy-overlay">
      
      <Navbar />

      {/* --- Hero Section --- */}
      <section className="relative min-h-screen flex items-center pt-24 pb-16 overflow-hidden">
        <div ref={bgTextRef} className="absolute top-1/2 left-0 -translate-y-1/2 text-[20vw] font-serif font-black text-[#5b0e14]/5 whitespace-nowrap pointer-events-none select-none z-0">
          MEDIQ MEDIQ
        </div>
        <div className="section-container relative z-10 text-center space-y-16 max-w-7xl mx-auto px-6">
          <div className="max-w-4xl mx-auto space-y-8 reveal-on-scroll">
            <Badge className="bg-[#5b0e14]/5 text-[#5b0e14] border-[#5b0e14]/10 px-5 py-1.5 rounded-full text-[9px] font-black tracking-widest uppercase">Million Dollar Protocol</Badge>
            <h1 className="text-display-refined text-[#5b0e14] font-serif font-black leading-tight">
              Design Your <br />
              <span className="italic font-light opacity-60">Biological</span> Dominance.
            </h1>
            <p className="text-xl md:text-2xl text-[#5b0e14]/60 max-w-2xl mx-auto font-serif italic leading-relaxed">
              We don't just explain reports. We architect physiological legacies through live telemetry and elite AI mentorship.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-6 pt-4">
              <Button 
                onClick={() => navigate('/dashboard')}
                className="pill-button-premium h-16 px-12"
              >
                Start Live Assessment
              </Button>
              <div className="flex items-center justify-center gap-4 text-[#5b0e14]/40 font-black text-[9px] tracking-widest uppercase">
                <ShieldCheck className="w-5 h-5 text-[#5b0e14]" /> ISO-27001 SECURED
              </div>
            </div>
          </div>
          <div className="reveal-on-scroll delay-200 px-4">
             <LiveProtocolDashboard />
          </div>
        </div>
      </section>

      {/* --- MULTIPLE IMAGE SECTION (Estate) --- */}
      <section className="py-20 md:py-32 max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full reveal-on-scroll">
           {[
             { i: "/hero_bg.jpg", t: "Base", s: "Architecture" },
             { i: "/research_lab.jpg", t: "Neural", s: "Intelligence", o: true },
             { i: "/doctor_male.jpg", t: "Hub", s: "Clinical" },
             { i: "/lab_equipment.jpg", t: "Vigilance", s: "Data", o: true }
           ].map((item, i) => (
             <figure key={i} className={`relative aspect-[3/4] rounded-[2rem] overflow-hidden shadow-xl border border-white/20 ${item.o ? 'md:mt-12' : ''}`}>
                <img src={item.i} className="absolute inset-0 w-full h-full object-cover transition-transform duration-[2s] group-hover:scale-110" alt={item.t} />
                <div className="absolute inset-0 bg-[#5b0e14]/30" />
                <figcaption className="absolute bottom-5 left-5 right-5 text-left">
                   <p className="text-[7px] font-black text-[#f1e194]/60 uppercase tracking-widest mb-1">Estate 0{i+1}</p>
                   <p className="text-sm font-bold text-[#f1e194]">{item.s}</p>
                </figcaption>
             </figure>
           ))}
        </div>
      </section>

      {/* --- Biological Pillars --- */}
      <section id="architecture" className="py-24 md:py-32 max-w-7xl mx-auto px-6">
        <div className="text-center space-y-4 mb-24 reveal-on-scroll">
          <span className="text-[10px] font-black tracking-widest text-[#5b0e14]/40 uppercase">Methodology</span>
          <h2 className="text-h2-refined text-[#5b0e14] font-serif font-black">Clinical Stack.</h2>
        </div>
        <div className="space-y-8">
          <PillarRow 
            img="/research_lab.jpg" title="Neural Synthesis" sub="Intelligence" 
            detail="Adaptive networks harmonizing 50,000 biological variables per second for a real-time digital twin."
            stats={{ precision: "99.9%", impact: "High", status: "Active" }} icon={Brain} 
          />
          <PillarRow 
            img="/hands_tablet.jpg" title="Sovereign Vault" sub="Security" 
            detail="Decentralized, zero-knowledge biometric vault ensuring your genomic data remains exclusively yours."
            stats={{ precision: "AES-512", impact: "Total", status: "Secure" }} icon={Fingerprint} reverse={true}
          />
          <PillarRow 
            img="/lab_equipment.jpg" title="Quantum Analysis" sub="Diagnostic" 
            detail="Sub-molecular screening techniques reveal emerging health trends decades before they manifest clinically."
            stats={{ precision: "Nano", impact: "Early", status: "Scanning" }} icon={Microscope} 
          />
        </div>
      </section>

      {/* --- Phase 4: Mobile App Mirroring Section --- */}
      <section className="py-24 md:py-40 bg-[#5b0e14] text-[#f1e194] overflow-hidden">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-24 items-center">
            <div className="order-2 lg:order-1 relative reveal-on-scroll">
              <div className="phone-frame">
                <div className="phone-screen p-6 space-y-6">
                  <div className="flex items-center justify-between pt-4">
                    <div className="w-8 h-8 rounded-lg bg-[#5b0e14] flex items-center justify-center">
                      <Stethoscope className="w-4 h-4 text-[#f1e194]" />
                    </div>
                    <span className="text-[10px] font-black tracking-widest uppercase text-[#5b0e14]">Protocol Active</span>
                    <div className="w-8 h-8 rounded-full border border-[#5b0e14]/10" />
                  </div>
                  <div className="notification-toast bg-[#5b0e14] rounded-2xl p-4 shadow-2xl space-y-3">
                    <div className="flex items-center gap-2">
                      <Bot className="w-4 h-4 text-[#f1e194]" />
                      <span className="text-[8px] font-black uppercase tracking-widest text-[#f1e194]/60">MEDIQ Mentor</span>
                    </div>
                    <p className="text-[11px] font-serif italic text-[#f1e194]">
                      "Resting heart rate up 5% today. I've adjusted your nutritional stack for optimal recovery."
                    </p>
                  </div>
                  <div className="bg-white/40 rounded-3xl p-4 flex-1 space-y-4">
                    <div className="flex justify-between items-end">
                      <span className="text-[10px] font-black text-[#5b0e14]/40 uppercase">HRV Variance</span>
                      <TrendingUp className="w-4 h-4 text-[#5b0e14]" />
                    </div>
                    <div className="h-32 w-full border-b border-[#5b0e14]/10 flex items-end gap-1 px-2 pb-2">
                      {[40, 70, 45, 90, 65, 80, 55].map((h, i) => (
                        <div key={i} className="flex-1 bg-[#5b0e14] rounded-t-sm" style={{ height: `${h}%`, opacity: 0.1 + (i * 0.1) }} />
                      ))}
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-[#5b0e14]/5 rounded-xl p-3">
                        <p className="text-[7px] font-black text-[#5b0e14]/40 uppercase">Metabolic</p>
                        <p className="text-xs font-bold text-[#5b0e14]">Active</p>
                      </div>
                      <div className="bg-[#5b0e14]/5 rounded-xl p-3">
                        <p className="text-[7px] font-black text-[#5b0e14]/40 uppercase">Recovery</p>
                        <p className="text-xs font-bold text-[#5b0e14]">94%</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-20 h-1 bg-[#5b0e14]/20 rounded-full" />
              </div>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-[#f1e194]/5 rounded-full blur-[100px] -z-10" />
            </div>
            <div className="order-1 lg:order-2 space-y-10 reveal-on-scroll">
              <Badge className="bg-[#f1e194]/10 text-[#f1e194] border-[#f1e194]/20 px-5 py-1.5 rounded-full text-[9px] font-black tracking-widest uppercase">The Sovereign Companion</Badge>
              <h2 className="text-display-refined font-serif font-black leading-tight">Proactive <br /><span className="italic font-light opacity-60">Mentorship.</span></h2>
              <p className="text-xl font-serif italic opacity-70">
                MEDIQ doesn't wait for you to check your stats. MEDIQ monitors your biological telemetry 24/7, providing real-time interventions before you even notice a shift.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 pt-6">
                {[
                  { t: "Dynamic Protocols", d: "Real-time adjustments to nutrition and recovery." },
                  { t: "Predictive Alerts", d: "Early detection of physiological stress markers." },
                  { t: "Contextual Guidance", d: "MEDIQ knows your schedule, your goals, and your DNA." },
                  { t: "Total Sovereignty", d: "Complete control of your data, directly in your hand." }
                ].map((item, i) => (
                  <div key={i} className="space-y-2">
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full bg-[#f1e194]/10 flex items-center justify-center">
                        <ArrowRight className="w-3 h-3 text-[#f1e194]" />
                      </div>
                      <h4 className="text-sm font-black uppercase tracking-widest">{item.t}</h4>
                    </div>
                    <p className="text-xs text-[#f1e194]/50 leading-relaxed pl-9">{item.d}</p>
                  </div>
                ))}
              </div>
              <div className="pt-8">
                <Button className="pill-button-premium bg-[#f1e194] text-[#5b0e14] h-16 px-12 hover:bg-white">Reserve Your Membership</Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- Lab Report Dropzone --- */}
      <section className="py-24 md:py-32 bg-[#5b0e14] text-[#f1e194]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-20 items-center">
            <div className="space-y-10 reveal-on-scroll">
              <Badge className="bg-[#f1e194]/10 text-[#f1e194] border-[#f1e194]/20 px-5 py-1.5 rounded-full text-[9px] font-black tracking-widest uppercase">Immediate Utility</Badge>
              <h2 className="text-h2-refined font-serif font-black leading-tight">Instant Report <br /><span className="italic font-light opacity-60">Synthesis.</span></h2>
              <p className="text-lg font-serif italic opacity-70">Drag and drop any clinical report. MEDIQ will ingest, extract, and model the data in 0.4 seconds.</p>
              <ul className="space-y-4">
                {["Biomarker Extraction", "Historical Trend Interpolation", "Risk Assessment", "Optimization Stack"].map((item, i) => (
                  <li key={i} className="flex items-center gap-4 text-sm font-bold tracking-wide">
                    <TrendingUp className="w-5 h-5 opacity-40" /> {item}
                  </li>
                ))}
              </ul>
            </div>
            <div 
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={simulateAnalysis}
              className="reveal-on-scroll delay-200"
            >
              <div className={`relative aspect-video rounded-[3rem] border-2 border-dashed transition-all duration-700 flex flex-col items-center justify-center p-12 group cursor-pointer backdrop-blur-xl
                ${isAnalyzing ? 'border-[#f1e194] bg-[#f1e194]/10 animate-pulse' : 'border-[#f1e194]/30 hover:border-[#f1e194]/60 bg-white/5'}
              `}>
                {isAnalyzing ? (
                  <>
                    <div className="w-20 h-20 rounded-full border-4 border-t-[#f1e194] border-[#f1e194]/20 animate-spin mb-6" />
                    <p className="text-lg font-serif font-black text-[#f1e194]">MEDIQ is Synthesizing...</p>
                    <p className="text-[10px] font-black tracking-[0.3em] uppercase opacity-40 mt-2">Extracting 500+ Biomarkers</p>
                  </>
                ) : (
                  <>
                    <div className="w-20 h-20 rounded-full bg-[#f1e194] flex items-center justify-center mb-6 shadow-2xl group-hover:scale-110 transition-transform">
                      <FileText className="w-8 h-8 text-[#5b0e14]" />
                    </div>
                    <p className="text-lg font-serif font-black text-[#f1e194]">Drop Lab Report Here</p>
                    <p className="text-[10px] font-black tracking-[0.3em] uppercase opacity-40 mt-2 text-center text-[#f1e194]">PDF, PNG, JPG supported (AES-256 Encrypted)</p>
                  </>
                )}
                {isAnalyzing && (
                  <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    {[...Array(10)].map((_, i) => (
                      <div 
                        key={i} 
                        className="biomarker-harvest absolute text-[8px] font-black text-[#f1e194]/40 uppercase tracking-widest"
                        style={{ top: `${Math.random() * 100}%`, left: `${Math.random() * 100}%`, animationDelay: `${Math.random() * 2}s` }}
                      >
                        {['Glucose', 'HDL', 'LDL', 'CRP', 'HbA1c', 'Cortisol'][Math.floor(Math.random() * 6)]}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- Intelligence --- */}
      <section id="intelligence" className="py-24 md:py-32 bg-[#f1e194] relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 text-center relative z-10">
          <div className="flex flex-col items-center space-y-16 reveal-on-scroll">
            <h2 className="text-h2-refined font-serif font-black text-[#5b0e14]">MEDIQ.</h2>
            <p className="text-2xl md:text-3xl font-serif italic text-[#5b0e14]/60 leading-relaxed max-w-3xl mx-auto">"The world's first AI architect dedicated exclusively to biological sovereignty."</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-10 w-full max-w-4xl py-12 border-y border-[#5b0e14]/10">
              {[{ l: "DATA", v: "50M+" }, { l: "NEURAL", v: "256" }, { l: "PRECISION", v: "99.9%" }, { l: "LATENCY", v: "0.4s" }].map(s => (
                <div key={s.l}>
                   <div className="text-[9px] font-black tracking-widest text-[#5b0e14]/30 uppercase mb-2">{s.l}</div>
                   <div className="text-3xl font-serif font-bold text-[#5b0e14]">{s.v}</div>
                </div>
              ))}
            </div>
            <Button 
              onClick={() => navigate('/dashboard')} 
              className="h-20 px-16 rounded-full bg-[#5b0e14] text-[#f1e194] text-[11px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-xl"
            >
              Initialize Link
            </Button>
          </div>
        </div>
      </section>

      {/* --- Inner Circle --- */}
      <section id="circle" className="py-24 md:py-40 px-6 md:px-12">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-24 reveal-on-scroll">
            <Badge className="bg-[#5b0e14]/5 text-[#5b0e14] border-[#5b0e14]/10 px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest mb-6">Verified Success</Badge>
            <h2 className="text-h2-refined text-[#5b0e14] font-serif font-black">The Inner Circle.</h2>
            <p className="text-lg text-[#5b0e14]/40 font-serif italic mt-4 max-w-xl mx-auto">Membership is exclusive. Results are absolute.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 lg:gap-10">
            {[
              { q: "MEDIQ re-engineered my capacity for high-stakes decisions.", n: "Alistair Thorne", r: "Tech CEO", i: "/testimonial_photo.jpg", status: "Protocol 001.2" },
              { q: "At 50, my biomarkers outperform my 20-year-old self.", n: "Elena Vance", r: "Venture Partner", i: "/doctor_female.jpg", status: "Longevity v3" },
              { q: "Health is the only true currency. MEDIQ is the bank.", n: "Marcus Hellas", r: "Industrialist", i: "/family_photo.jpg", status: "Peak Vitality" }
            ].map((t, i) => (
              <figure key={i} className="reveal-on-scroll relative aspect-[4/5] rounded-[3rem] overflow-hidden group shadow-2xl border border-white/20 transition-all duration-1000 hover:-translate-y-4" style={{ transitionDelay: `${i * 150}ms` }}>
                <img src={t.i} alt={t.n} className="absolute inset-0 w-full h-full object-cover transition-transform duration-[3s] group-hover:scale-110 grayscale-[0.4] group-hover:grayscale-0" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#5b0e14] via-[#5b0e14]/40 to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />
                <div className="absolute top-6 left-6">
                  <div className="glass-pill px-4 py-1.5 bg-white/10 border-white/20 backdrop-blur-md flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#f1e194] animate-pulse" />
                    <span className="text-[8px] font-black text-white uppercase tracking-widest">{t.status}</span>
                  </div>
                </div>
                <figcaption className="absolute inset-0 p-8 flex flex-col justify-end z-10">
                  <Quote className="w-10 h-10 text-[#f1e194]/20 mb-6 group-hover:scale-110 transition-transform" />
                  <p className="text-xl md:text-2xl font-serif italic text-[#f1e194] leading-tight mb-8">"{t.q}"</p>
                  <div className="flex items-center gap-4 pt-6 border-t border-white/10">
                    <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center backdrop-blur-xl border border-white/20">
                      <Fingerprint className="w-6 h-6 text-[#f1e194]" />
                    </div>
                    <div>
                      <h5 className="text-lg font-serif font-black text-[#f1e194] leading-none">{t.n}</h5>
                      <p className="text-[9px] font-black tracking-widest text-[#f1e194]/40 uppercase mt-2">{t.r}</p>
                    </div>
                  </div>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      <Footer />

      <LuxuryChat 
        isOpen={isChatOpen} 
        onClose={() => setIsChatOpen(false)}
        userName="Guest"
        initialMessage="I am MEDIQ, your health architect. Protocol 001 initialization is ready. Shall we begin?"
        onSendMessage={handleSendMessage}
      />
    </div>
  );
}
