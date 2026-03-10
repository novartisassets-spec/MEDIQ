import { useEffect } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { 
  Database, Cpu, Activity, Zap, CheckCircle2, Waves, Bot
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const ProtocolPage = () => {
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

  const steps = [
    { s: "01", t: "Ingestion", d: "Aggregation of genomic, metabolic, and clinical datasets.", i: Database, detail: "We collect every available data point to establish a high-fidelity baseline." },
    { s: "02", t: "Synthesis", d: "MEDIQ models your unique physiology across futures.", i: Cpu, detail: "Advanced neural networks simulate the impact of 10,000 potential interventions." },
    { s: "03", t: "Protocol", d: "Bespoke lifestyle and medical stacks are curated.", i: Activity, detail: "A precision architecture designed specifically for your ambitions and biology." },
    { s: "04", t: "Optimization", d: "The system evolves as your biology improves.", i: Zap, detail: "Real-time adjustments based on continuous biometric telemetry." }
  ];

  return (
    <div className="min-h-screen bg-[#f1e194] text-[#5b0e14] overflow-x-hidden grainy-overlay">
      <Navbar />
      
      {/* --- BIOLOGICAL LIFECYCLE HERO --- */}
      <section className="relative min-h-[85vh] flex items-center pt-40 pb-20 px-6 overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] opacity-5">
          <Waves className="w-full h-full animate-pulse" />
        </div>
        <div className="section-container relative z-10 text-center space-y-10">
          <Badge className="bg-[#5b0e14]/5 text-[#5b0e14] border-[#5b0e14]/10 px-6 py-2 rounded-full text-[10px] font-black tracking-widest uppercase">The Lifecycle</Badge>
          <h1 className="text-display-refined font-serif font-black leading-tight tracking-tighter">The MEDIQ <br /><span className="italic font-light opacity-60">Protocol.</span></h1>
          <p className="text-2xl font-serif italic text-[#5b0e14]/60 max-w-3xl mx-auto border-b border-[#5b0e14]/5 pb-12 leading-relaxed">
            A structural four-stage methodology designed to transition from baseline health to biological dominance.
          </p>
        </div>
      </section>

      {/* --- STEP TIMELINE --- */}
      <section className="py-24 md:py-40 px-6">
        <div className="section-container space-y-32 md:space-y-48">
          {steps.map((step, i) => (
            <div key={i} className={`flex flex-col ${i % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'} items-center gap-16 md:gap-32 reveal-on-scroll`}>
              <div className="w-full md:w-1/2 relative group">
                <div className="text-[12rem] md:text-[20rem] font-serif font-black text-[#5b0e14]/5 leading-none absolute -top-20 md:-top-40 left-0 transition-colors group-hover:text-[#5b0e14]/10">{step.s}</div>
                <div className="relative pt-10">
                  <div className="w-20 h-20 rounded-[2rem] bg-[#5b0e14] flex items-center justify-center shadow-2xl mb-10 group-hover:rotate-12 transition-transform duration-500">
                    <step.i className="w-10 h-10 text-[#f1e194]" />
                  </div>
                  <h3 className="text-4xl md:text-6xl font-serif font-black mb-8">{step.t}</h3>
                  <p className="text-xl md:text-2xl text-[#5b0e14]/60 italic font-serif leading-relaxed mb-10">{step.d}</p>
                  <p className="text-sm text-[#5b0e14]/40 leading-relaxed font-light">{step.detail}</p>
                </div>
              </div>
              <div className="w-full md:w-1/2">
                <figure className="relative aspect-[4/3] rounded-[3rem] overflow-hidden shadow-2xl border border-white/20">
                  <img src={`/hero_bg.jpg`} className="w-full h-full object-cover grayscale opacity-40 hover:grayscale-0 hover:opacity-100 transition-all duration-[2s]" alt={step.t} />
                  <div className="absolute inset-0 bg-gradient-to-tr from-[#5b0e14]/40 to-transparent" />
                </figure>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* --- PROTOCOL FEATURES --- */}
      <section className="py-24 md:py-40 bg-[#5b0e14] text-[#f1e194] px-6">
        <div className="section-container">
          <div className="grid lg:grid-cols-2 gap-20">
            <div className="space-y-12 reveal-on-scroll">
              <h2 className="text-5xl font-serif font-black tracking-tight">Standard Requirements.</h2>
              <div className="grid sm:grid-cols-2 gap-8">
                {[
                  "Genomic Baseline Scan", "Metabolic Profile v.4", "Epigenetic Audit", "Nutritional Ingestion Map",
                  "Performance Stress Test", "Neural Sync Analysis", "Vigilance Calibration", "Secure Link Authorization"
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-4 group">
                    <CheckCircle2 className="w-5 h-5 text-[#f1e194]/20 group-hover:text-[#f1e194] transition-colors" />
                    <span className="text-sm font-black uppercase tracking-widest opacity-60 group-hover:opacity-100 transition-opacity">{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white/5 backdrop-blur-3xl p-12 rounded-[4rem] border border-white/10 flex flex-col justify-between reveal-on-scroll delay-300">
              <div className="space-y-6">
                <div className="w-16 h-16 rounded-2xl bg-[#f1e194] flex items-center justify-center">
                  <Bot className="w-8 h-8 text-[#5b0e14]" />
                </div>
                <h3 className="text-3xl font-serif italic font-light opacity-80">"Initialization is more than data entry. It is the beginning of a life-long biological partnership."</h3>
              </div>
              <div className="pt-12">
                <span className="text-[10px] font-black tracking-[0.5em] uppercase opacity-40">MEDIQ v8.2 Architect</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default ProtocolPage;
