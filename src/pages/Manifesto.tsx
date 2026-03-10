import { useEffect } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Play, ArrowRight, Zap, Shield, Target } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const ManifestoPage = () => {
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

  return (
    <div className="min-h-screen bg-[#f1e194] text-[#5b0e14] overflow-x-hidden grainy-overlay">
      <Navbar />
      
      {/* --- EMOTIONAL HERO --- */}
      <section className="relative min-h-screen flex items-center pt-32 pb-20 px-6 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img src="/medical_team.jpg" className="w-full h-full object-cover grayscale opacity-20" alt="Manifesto" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#f1e194] via-transparent to-[#f1e194]" />
        </div>
        <div className="section-container relative z-10 text-center space-y-12">
          <div className="space-y-6 reveal-on-scroll">
            <Badge className="bg-[#5b0e14]/5 text-[#5b0e14] border-[#5b0e14]/10 px-6 py-2 rounded-full text-[10px] font-black tracking-widest uppercase">The Philosophy</Badge>
            <h1 className="text-[15vw] md:text-[10vw] font-serif font-black leading-[0.8] tracking-tighter opacity-10 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full pointer-events-none select-none">THE CREED</h1>
            <h2 className="text-display-refined font-serif font-black leading-tight tracking-tighter">Beyond <br /><span className="italic font-light opacity-60">Wellness.</span></h2>
          </div>
          <p className="text-3xl md:text-5xl font-serif italic text-[#5b0e14]/80 max-w-4xl mx-auto leading-tight reveal-on-scroll delay-200">
            "Generic health is for the average. MEDIQ is for the exceptional. We don't just prolong life; we expand the capacity for high-impact human achievement."
          </p>
          <div className="flex justify-center pt-10 reveal-on-scroll delay-400">
            <div className="relative group cursor-pointer">
              <div className="w-32 h-32 rounded-full border-2 border-[#5b0e14]/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-700">
                <Play className="w-10 h-10 fill-[#5b0e14]" />
              </div>
              <div className="absolute -inset-4 border border-[#5b0e14]/5 rounded-full animate-rotate-slow" />
            </div>
          </div>
        </div>
      </section>

      {/* --- THE CREED BLOCKS --- */}
      <section className="py-24 md:py-48 px-6">
        <div className="section-container space-y-32 md:space-y-64">
          {[
            { 
              t: "Health is the Ultimate Currency.", 
              d: "In the realm of elite performance, your physiological state is your primary asset. We architect your biology to ensure your capital never depreciates.",
              i: Target
            },
            { 
              t: "Precision is Not Optional.", 
              d: "Population averages are meaningless to the individual. Our focus is sub-molecular, genetic, and bespoke. We solve for 'You', not 'Them'.",
              i: Zap
            },
            { 
              t: "Biological Sovereignty.", 
              d: "Your data is your identity. We provide the encryption and the intelligence to ensure you remain the sole architect of your future.",
              i: Shield
            }
          ].map((item, i) => (
            <div key={i} className={`flex flex-col ${i % 2 !== 0 ? 'md:flex-row-reverse' : 'md:flex-row'} items-center gap-16 md:gap-32 reveal-on-scroll`}>
              <div className="w-full md:w-1/2 space-y-10 text-center md:text-left">
                <div className="w-20 h-20 rounded-[2rem] bg-[#5b0e14] flex items-center justify-center shadow-2xl mx-auto md:mx-0 group-hover:rotate-12 transition-transform">
                  <item.i className="w-10 h-10 text-[#f1e194]" />
                </div>
                <h3 className="text-5xl md:text-7xl font-serif font-black leading-[0.9] tracking-tighter">{item.t}</h3>
                <p className="text-2xl text-[#5b0e14]/60 font-serif italic leading-relaxed max-w-xl">{item.d}</p>
              </div>
              <div className="w-full md:w-1/2 h-px bg-[#5b0e14]/10 hidden md:block" />
            </div>
          ))}
        </div>
      </section>

      {/* --- CLOSING CTA --- */}
      <section className="py-24 md:py-48 bg-[#5b0e14] text-[#f1e194] px-6 text-center">
        <div className="section-container space-y-16 reveal-on-scroll">
          <Badge className="bg-white/10 text-white border-white/20 px-6 py-2 rounded-full text-[10px] font-black uppercase">Final Invitation</Badge>
          <h2 className="text-6xl md:text-[10rem] font-serif font-black leading-[0.8] tracking-tighter">Your Legacy <br /> Awaits.</h2>
          <div className="pt-10">
            <Button className="h-24 px-20 rounded-full bg-[#f1e194] text-[#5b0e14] text-xs font-black tracking-widest uppercase hover:bg-white transition-all shadow-2xl group">
              Begin Ingestion Phase <ArrowRight className="w-5 h-5 ml-4 group-hover:translate-x-2 transition-transform" />
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default ManifestoPage;
