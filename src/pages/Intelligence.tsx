import { useEffect } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { 
  Bot, Network, ShieldCheck, Brain, BarChart3
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const IntelligencePage = () => {
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

  const metrics = [
    { l: "DATA POINTS", v: "50M+", d: "Trained on high-fidelity clinical records." },
    { l: "NEURAL LAYERS", v: "256", d: "Deep learning architecture for complex synthesis." },
    { l: "ACCURACY RATE", v: "99.9%", d: "Validated against gold-standard diagnostics." },
    { l: "LATENCY", v: "0.4s", d: "Real-time responses for critical interventions." },
  ];

  return (
    <div className="min-h-screen bg-[#f1e194] text-[#5b0e14] overflow-x-hidden grainy-overlay">
      <Navbar />
      
      {/* --- HOLOGRAPHIC HERO --- */}
      <section className="relative min-h-[90vh] flex items-center pt-40 pb-20 px-6 overflow-hidden bg-[#5b0e14] text-[#f1e194]">
        <div className="absolute inset-0 opacity-10 bg-[url('/hospital_modern.jpg')] bg-cover grayscale" />
        <div className="section-container relative z-10 grid lg:grid-cols-2 gap-20 items-center">
          <div className="space-y-10 reveal-on-scroll">
            <Badge className="bg-[#f1e194]/10 text-[#f1e194] border-[#f1e194]/20 px-6 py-2 rounded-full text-[10px] font-black tracking-widest uppercase">The Neural Core</Badge>
            <h1 className="text-display-refined font-serif font-black leading-tight tracking-tighter">Clinical <br /><span className="italic font-light opacity-80">Intelligence.</span></h1>
            <p className="text-2xl font-serif italic text-[#f1e194]/60 leading-relaxed max-w-xl border-l-4 border-[#f1e194]/20 pl-10">
              "MEDIQ is the world's first AI architect dedicated exclusively to biological sovereignty."
            </p>
          </div>
          <div className="relative flex items-center justify-center reveal-on-scroll delay-300">
            <div className="relative w-full aspect-square max-w-md border border-[#f1e194]/10 rounded-full p-12 animate-rotate-slow">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-4 h-4 bg-[#f1e194] rounded-full shadow-[0_0_20px_#f1e194]" />
              <div className="w-full h-full rounded-full border-2 border-[#f1e194]/20 flex items-center justify-center p-10">
                <div className="w-full h-full rounded-full bg-[#f1e194]/5 flex items-center justify-center backdrop-blur-3xl">
                  <Bot className="w-24 h-24 text-[#f1e194] animate-pulse" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- METRICS GRID --- */}
      <section className="py-24 md:py-40 px-6">
        <div className="section-container grid md:grid-cols-2 lg:grid-cols-4 gap-12">
          {metrics.map((m, i) => (
            <div key={i} className="reveal-on-scroll space-y-6 text-center group">
              <div className="text-[10px] font-black tracking-[0.4em] text-[#5b0e14]/30 uppercase">{m.l}</div>
              <div className="text-6xl font-serif font-black transition-transform group-hover:scale-110 duration-500">{m.v}</div>
              <p className="text-xs text-[#5b0e14]/50 leading-relaxed max-w-[200px] mx-auto">{m.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* --- CAPABILITIES DETAIL --- */}
      <section className="py-24 md:py-40 bg-[#5b0e14]/5 px-6">
        <div className="section-container">
          <div className="grid lg:grid-cols-2 gap-20">
            <div className="space-y-12 reveal-on-scroll">
              <div className="space-y-4">
                <Badge className="bg-[#5b0e14]/5 text-[#5b0e14] border-[#5b0e14]/10 px-5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest">Capabilities</Badge>
                <h2 className="text-5xl font-serif font-black">Technical Superiority.</h2>
              </div>
              <div className="space-y-8">
                {[
                  { i: Brain, t: "Pattern Recognition", d: "Detecting sub-clinical shifts before symptoms emerge." },
                  { i: Network, t: "Synthesis Engine", d: "Coordinating 50,000 biological variables per second." },
                  { i: ShieldCheck, t: "Sovereign Privacy", d: "Zero-knowledge encryption for total data control." },
                  { i: BarChart3, t: "Trend Interpolation", d: "Modeling 10,000 potential futures for your DNA." }
                ].map((item, i) => (
                  <div key={i} className="flex gap-6 items-start">
                    <div className="w-12 h-12 rounded-xl bg-[#5b0e14] flex items-center justify-center flex-shrink-0">
                      <item.i className="w-6 h-6 text-[#f1e194]" />
                    </div>
                    <div className="space-y-2">
                      <h4 className="text-xl font-bold uppercase tracking-tight">{item.t}</h4>
                      <p className="text-sm text-[#5b0e14]/60 leading-relaxed">{item.d}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="reveal-on-scroll delay-300">
              <figure className="relative aspect-[4/5] rounded-[4rem] overflow-hidden shadow-2xl border-4 border-white">
                <img src="/research_lab.jpg" className="w-full h-full object-cover" alt="Research" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#5b0e14] via-transparent to-transparent opacity-60" />
                <figcaption className="absolute bottom-12 left-12 right-12 text-white">
                  <p className="text-2xl font-serif italic">"Precision is the only variable that matters."</p>
                </figcaption>
              </figure>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default IntelligencePage;
