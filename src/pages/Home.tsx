import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Activity, 
  Brain, 
  Shield, 
  Sparkles, 
  ChevronRight, 
  Menu, 
  X,
  Heart,
  Microscope,
  Stethoscope
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LuxuryChat } from '@/components/ui/luxury-chat';

export default function Home() {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const features = [
    {
      icon: <Brain className="w-6 h-6" />,
      title: "Integrative AI Intelligence",
      description: "Deep physiological analysis meeting clinical-grade artificial intelligence."
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: "Biometric Fortress",
      description: "Your health data, protected by the most advanced security protocols available."
    },
    {
      icon: <Sparkles className="w-6 h-6" />,
      title: "Predictive Longevity",
      description: "Moving beyond diagnosis to pre-emptive health architecture and optimization."
    }
  ];

  const handleSendMessage = async (msg: string) => {
    // Placeholder for Julian's response
    await new Promise(r => setTimeout(r, 2000));
    return "I've analyzed your inquiry. As Julian, your health mentor, I suggest we look deeper into these biomarkers during our next session.";
  };

  return (
    <div className="min-h-screen bg-[#f1e194] text-[#5b0e14] font-sans selection:bg-[#5b0e14] selection:text-[#f1e194]">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-[#f1e194]/80 backdrop-blur-md border-b border-[#5b0e14]/10">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-[#5b0e14] flex items-center justify-center">
              <Activity className="w-6 h-6 text-[#f1e194]" />
            </div>
            <span className="text-xl font-black tracking-tighter uppercase">LAB.AI</span>
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-12">
            <a href="#features" className="text-[10px] font-black uppercase tracking-[0.2em] hover:opacity-60 transition-opacity">Expertise</a>
            <a href="#vision" className="text-[10px] font-black uppercase tracking-[0.2em] hover:opacity-60 transition-opacity">Vision</a>
            <Link to="/login" className="text-[10px] font-black uppercase tracking-[0.2em] hover:opacity-60 transition-opacity">Access</Link>
            <Link to="/signup">
              <Button className="bg-[#5b0e14] text-[#f1e194] rounded-full px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] hover:scale-105 active:scale-95 transition-all">
                Initialize Genesis
              </Button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button className="md:hidden" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
            {isMobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 md:pt-48 md:pb-40 px-6 overflow-hidden">
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#5b0e14]/5 border border-[#5b0e14]/10 mb-8">
              <Sparkles className="w-4 h-4" />
              <span className="text-[9px] font-black uppercase tracking-[0.3em]">AI-Powered Clinical Mentorship</span>
            </div>
            
            <h1 className="text-6xl md:text-8xl font-light tracking-tight leading-[0.9] mb-12">
              YOUR BIOLOGY, <br />
              <span className="font-black italic">INTELLIGENTLY</span> <br />
              ARCHITECTED.
            </h1>
            
            <p className="text-lg md:text-xl max-w-xl opacity-80 leading-relaxed mb-12">
              Experience a new paradigm of health where data meets intuition. Meet Julian, your dedicated health partner in the pursuit of peak human performance.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link to="/signup">
                <Button className="w-full sm:w-auto bg-[#5b0e14] text-[#f1e194] rounded-full px-10 py-8 text-[11px] font-black uppercase tracking-[0.3em] hover:scale-105 transition-all shadow-2xl shadow-[#5b0e14]/20">
                  Begin Your Evolution
                </Button>
              </Link>
              <Button 
                onClick={() => setIsChatOpen(true)}
                variant="outline" 
                className="w-full sm:w-auto border-[#5b0e14]/20 bg-transparent rounded-full px-10 py-8 text-[11px] font-black uppercase tracking-[0.3em] hover:bg-[#5b0e14] hover:text-[#f1e194] transition-all"
              >
                Consult Julian
              </Button>
            </div>
          </div>
        </div>

        {/* Decorative Background Elements */}
        <div className="absolute top-20 right-0 w-1/2 h-full opacity-10 pointer-events-none">
          <img src="/hero_bg.jpg" alt="" className="w-full h-full object-cover rounded-l-[10rem]" />
        </div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-[#5b0e14]/5 rounded-full blur-[100px]" />
      </section>

      {/* Feature Grid */}
      <section id="features" className="py-24 px-6 bg-white/30 backdrop-blur-sm border-y border-[#5b0e14]/5">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-3 gap-12 md:gap-20">
            {features.map((feature, idx) => (
              <div key={idx} className="space-y-6 group">
                <div className="w-16 h-16 rounded-3xl bg-[#5b0e14] text-[#f1e194] flex items-center justify-center group-hover:scale-110 transition-transform duration-500 shadow-xl shadow-[#5b0e14]/10">
                  {feature.icon}
                </div>
                <h3 className="text-2xl font-bold tracking-tight uppercase leading-tight">{feature.title}</h3>
                <p className="text-sm opacity-60 leading-relaxed">{feature.description}</p>
                <div className="pt-4">
                  <ChevronRight className="w-5 h-5 opacity-30 group-hover:translate-x-2 transition-transform" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Expertise Section */}
      <section className="py-32 px-6">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-20 items-center">
          <div className="relative">
            <div className="aspect-[4/5] rounded-[4rem] overflow-hidden shadow-2xl">
              <img src="/medical_team.jpg" alt="Julian's Laboratory" className="w-full h-full object-cover grayscale contrast-125" />
            </div>
            <div className="absolute -bottom-10 -right-10 w-64 h-64 bg-[#f1e194] border border-[#5b0e14]/10 rounded-[3rem] p-8 shadow-xl hidden lg:block">
              <div className="flex flex-col h-full justify-between">
                <Stethoscope className="w-10 h-10" />
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-2">Clinical Standard</p>
                  <p className="font-bold leading-tight uppercase tracking-tight">Precision protocols for elite health management.</p>
                </div>
              </div>
            </div>
          </div>
          <div className="space-y-10">
            <h2 className="text-5xl md:text-7xl font-light tracking-tight uppercase leading-[0.9]">
              THE FUTURE OF <br />
              <span className="font-black italic">CARE IS HERE.</span>
            </h2>
            <p className="text-lg opacity-80 leading-relaxed">
              Julian doesn't just process data; he understands context. Our AI orchestrator integrates multiple health domains—from genomic predispositions to real-time metabolic markers—to provide a holistic strategy for your well-being.
            </p>
            <div className="space-y-4">
              {["Adaptive Biological Modeling", "Continuous Metabolic Monitoring", "Personalized Longevity Roadmaps"].map((item, i) => (
                <div key={i} className="flex items-center gap-4 py-4 border-b border-[#5b0e14]/10">
                  <div className="w-2 h-2 rounded-full bg-[#5b0e14]" />
                  <span className="text-[10px] font-black uppercase tracking-[0.4em]">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#5b0e14] text-[#f1e194] py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start gap-20">
            <div className="space-y-8 max-w-sm">
              <div className="flex items-center gap-2">
                <Activity className="w-8 h-8" />
                <span className="text-2xl font-black tracking-tighter uppercase">LAB.AI</span>
              </div>
              <p className="text-sm opacity-60 leading-relaxed uppercase tracking-wider font-medium text-[10px]">
                Redefining the boundaries of human potential through the fusion of clinical expertise and artificial intelligence.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-20">
              <div className="space-y-6">
                <p className="text-[10px] font-black uppercase tracking-widest opacity-40">Network</p>
                <div className="flex flex-col gap-4 text-xs font-bold uppercase tracking-widest">
                  <a href="#" className="hover:opacity-60">Genesis</a>
                  <a href="#" className="hover:opacity-60">Expertise</a>
                  <a href="#" className="hover:opacity-60">Nodes</a>
                </div>
              </div>
              <div className="space-y-6">
                <p className="text-[10px] font-black uppercase tracking-widest opacity-40">Protocol</p>
                <div className="flex flex-col gap-4 text-xs font-bold uppercase tracking-widest">
                  <a href="#" className="hover:opacity-60">Privacy</a>
                  <a href="#" className="hover:opacity-60">Security</a>
                  <a href="#" className="hover:opacity-60">Legal</a>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-20 pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-8">
            <p className="text-[9px] font-black uppercase tracking-[0.5em] opacity-40">© 2026 LAB.AI SYSTEMS • PROTOCOL 7.4.2</p>
            <div className="flex gap-8">
               <Heart className="w-4 h-4 opacity-40 hover:opacity-100 transition-opacity cursor-pointer" />
               <Microscope className="w-4 h-4 opacity-40 hover:opacity-100 transition-opacity cursor-pointer" />
            </div>
          </div>
        </div>
      </footer>

      {/* Luxury Chat Overlay */}
      <LuxuryChat 
        isOpen={isChatOpen} 
        onClose={() => setIsChatOpen(false)}
        userName="Guest"
        initialMessage="I am Julian. I've been monitoring the system's baseline. How can I assist in architecting your health strategy today?"
        onSendMessage={handleSendMessage}
      />
    </div>
  );
}
