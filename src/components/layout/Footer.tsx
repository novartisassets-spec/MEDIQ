import { 
  Twitter, Linkedin, Instagram, Facebook, 
  Mail, MapPin, Phone, Stethoscope
} from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="bg-[#f1e194] py-24 border-t border-[#5b0e14]/10 px-6 md:px-12 relative overflow-hidden">
      <div className="max-w-screen-2xl mx-auto relative z-10">
        <div className="grid lg:grid-cols-12 gap-16 mb-20">
          <div className="lg:col-span-5 space-y-10">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-[#5b0e14] rounded-2xl flex items-center justify-center shadow-xl">
                <Stethoscope className="w-6 h-6 text-[#f1e194]" />
              </div>
              <span className="text-3xl font-serif font-black text-[#5b0e14]">MEDIQ</span>
            </div>
            <p className="text-2xl font-serif italic text-[#5b0e14]/30 leading-tight max-w-md">"The ultimate luxury is a life lived at the peak of biological potential."</p>
            <div className="space-y-4 text-xs font-black text-[#5b0e14]/50 uppercase tracking-widest">
              <div className="flex items-center gap-4"><MapPin className="w-4 h-4 text-[#5b0e14]" /> Silicon Valley, CA 94025</div>
              <div className="flex items-center gap-4"><Mail className="w-4 h-4 text-[#5b0e14]" /> architecture@mediq.ai</div>
              <div className="flex items-center gap-4"><Phone className="w-4 h-4 text-[#5b0e14]" /> +1 (800) MEDIQ-AI</div>
            </div>
            <div className="flex gap-6">
              {[Twitter, Linkedin, Instagram, Facebook].map((Icon, i) => (
                <a key={i} href="#" className="w-12 h-12 rounded-full border border-[#5b0e14]/10 flex items-center justify-center text-[#5b0e14]/40 hover:bg-[#5b0e14] hover:text-[#f1e194] transition-all duration-500 shadow-sm"><Icon className="w-5 h-5" /></a>
              ))}
            </div>
          </div>
          
          <div className="lg:col-span-7 grid grid-cols-2 md:grid-cols-3 gap-12">
            {[
              { t: "PROTOCOL", l: ["Synthesis", "Encryption", "Vigilance", "Telemetry"] },
              { t: "INTELLIGENCE", l: ["MEDIQ Core", "Security", "Vault", "Memory"] },
              { t: "ESTATE", l: ["About", "Manifesto", "Careers", "Legal"] }
            ].map((col, i) => (
              <div key={i} className="space-y-8">
                <h4 className="text-[10px] font-black tracking-widest uppercase text-[#5b0e14] opacity-30">{col.t}</h4>
                <ul className="space-y-4">
                  {col.l.map(link => <li key={link}><a href="#" className="text-base font-serif font-bold text-[#5b0e14]/50 hover:text-[#5b0e14] transition-colors">{link}</a></li>)}
                </ul>
              </div>
            ))}
          </div>
        </div>
        
        <div className="pt-16 border-t border-[#5b0e14]/10 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="text-[9px] font-black tracking-[0.4em] uppercase text-[#5b0e14]/20 text-center md:text-left">© 2026 MEDIQ SYSTEMS • SOVEREIGN HEALTH ARCHITECTURE • ALL RIGHTS RESERVED</div>
          <div className="flex gap-10">
            {['Privacy', 'Terms', 'Security'].map(l => (
              <a key={l} href="#" className="text-[9px] font-black tracking-[0.4em] uppercase text-[#5b0e14]/20 hover:text-[#5b0e14] transition-all">{l}</a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};
