import { useEffect } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { 
  Brain, Fingerprint, Microscope, Zap, HeartPulse, Globe, ArrowRight, Activity
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const ArchitecturePage = () => {

  useEffect(() => {
    window.scrollTo(0, 0);
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) entry.target.classList.add('visible');
      });
    }, { threshold: 0.1 });
    document.querySelectorAll('.reveal-on-scroll').forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const pillars = [
    { icon: Brain, title: "Neural Synthesis", desc: "Our adaptive neural networks harmonize 50,000 biological variables per second.", img: "/research_lab.jpg" },
    { icon: Fingerprint, title: "Sovereign Encryption", desc: "A decentralized, zero-knowledge biometric vault for your most personal data.", img: "/hands_tablet.jpg" },
    { icon: Microscope, title: "Quantum Diagnostics", desc: "Sub-molecular screening techniques that detect pathological shifts years in advance.", img: "/lab_equipment.jpg" },
    { icon: Zap, title: "Kinetic Protocol", desc: "Bespoke physiological stacks calibrated to your specific metabolic signature.", img: "/fitness_running.jpg" },
    { icon: HeartPulse, title: "Cellular Reversal", desc: "Utilizing epigenetic modulation to align your cellular clock with your ambitions.", img: "/wellness_yoga.jpg" },
    { icon: Globe, title: "Global Telemetry", desc: "Real-time clinical response and monitoring anywhere on the terrestrial globe.", img: "/telemedicine.jpg" },
  ];

  return (
    <div className="min-h-screen bg-[#f1e194] text-[#5b0e14] overflow-x-hidden grainy-overlay">
      <Navbar />
      
      {/* --- FUTURISTIC HERO --- */}
      <section className="relative min-h-[80vh] flex items-center pt-40 pb-20 px-6 overflow-hidden">
        <div className="absolute inset-0 z-0 opacity-10" style={{ backgroundImage: 'linear-gradient(#5b0e14 1px, transparent 1px), linear-gradient(90deg, #5b0e14 1px, transparent 1px)', backgroundSize: '50px 50px' }} />
        <div className="section-container relative z-10 text-center space-y-8">
          <Badge className="bg-[#5b0e14]/5 text-[#5b0e14] border-[#5b0e14]/10 px-6 py-2 rounded-full text-[10px] font-black tracking-widest uppercase">The Infrastructure</Badge>
          <h1 className="text-display-refined font-serif font-black tracking-tighter">Biological <br /><span className="italic font-light opacity-60">Architecture.</span></h1>
          <p className="text-2xl text-[#5b0e14]/60 max-w-2xl mx-auto font-serif italic border-b border-[#5b0e14]/5 pb-10">
            A six-layered technical stack designed to bridge the gap between clinical data and human potential.
          </p>
        </div>
      </section>

      {/* --- PILLAR GRID --- */}
      <section className="py-20 md:py-40 px-6">
        <div className="section-container grid md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-12">
          {pillars.map((p, i) => (
            <div key={i} className="reveal-on-scroll group space-y-10 bg-white/30 backdrop-blur-xl p-10 rounded-[3rem] border border-[#5b0e14]/5 hover:bg-white transition-all duration-700 hover:shadow-2xl hover:-translate-y-2">
              <div className="relative w-full aspect-video rounded-2xl overflow-hidden shadow-inner">
                <img src={p.img} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-1000" alt={p.title} />
                <div className="absolute inset-0 bg-[#5b0e14]/10" />
              </div>
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-[#5b0e14] flex items-center justify-center shadow-lg group-hover:rotate-12 transition-transform">
                    <p.icon className="w-6 h-6 text-[#f1e194]" />
                  </div>
                  <h3 className="text-2xl font-serif font-black">{p.title}</h3>
                </div>
                <p className="text-sm text-[#5b0e14]/60 leading-relaxed font-light">{p.desc}</p>
                <div className="pt-6 border-t border-[#5b0e14]/5 flex items-center justify-between opacity-40 group-hover:opacity-100 transition-opacity">
                  <span className="text-[9px] font-black tracking-widest uppercase">Layer 0{i+1}</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* --- TECHNICAL SPECS CTA --- */}
      <section className="py-24 md:py-40 bg-[#5b0e14] text-[#f1e194] text-center px-6">
        <div className="section-container space-y-12 reveal-on-scroll">
          <Activity className="w-12 h-12 mx-auto animate-pulse opacity-40" />
          <h2 className="text-4xl md:text-6xl font-serif font-black tracking-tight">Ready to Initialize?</h2>
          <p className="text-xl font-serif italic text-[#f1e194]/60 max-w-xl mx-auto leading-relaxed">
            Deployment of your personal biological operating system takes 48 hours following clinical ingestion.
          </p>
          <Button className="h-20 px-16 rounded-full bg-[#f1e194] text-[#5b0e14] text-xs font-black tracking-widest uppercase hover:bg-white transition-all shadow-2xl">Start Architecture Phase</Button>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default ArchitecturePage;
