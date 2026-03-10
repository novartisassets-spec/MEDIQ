import { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Lock, Mail, ArrowLeft, UserCircle } from 'lucide-react';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) alert(error.message);
    else alert('Protocol initialized. Check your email for verification.');
    setLoading(false);
  };

  const handleGoogleSignup = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin + '/dashboard' }
    });
    if (error) alert(error.message);
  };

  return (
    <div className="min-h-screen bg-[#f1e194] flex flex-col items-center justify-center p-4 relative overflow-hidden">
      <div className="fixed inset-0 fintech-grid opacity-30 pointer-events-none" />
      
      <Link to="/" className="absolute top-8 left-8 flex items-center gap-2 text-[#5b0e14] hover:opacity-70 transition-opacity font-mono-tech text-[10px] uppercase tracking-widest">
        <ArrowLeft className="w-4 h-4" /> Return to Genesis
      </Link>

      <div className="w-full max-w-md relative z-10">
        <div className="bg-[#5b0e14] p-10 md:p-12 rounded-[3.5rem] shadow-2xl relative overflow-hidden border border-white/10 text-[#f1e194]">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
          
          <div className="relative z-10 space-y-10">
            <div className="text-center space-y-6">
              <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center mx-auto border border-white/10 shadow-inner">
                <UserCircle className="w-10 h-10 text-[#f1e194]" />
              </div>
              <h2 className="text-3xl font-light tracking-tight uppercase">Identity Genesis</h2>
              <p className="text-[10px] text-[#f1e194]/40 uppercase tracking-[0.3em]">Initialize Your Biological Profile</p>
            </div>

            <form onSubmit={handleSignup} className="space-y-4">
              <div className="space-y-2">
                <label className="text-[9px] uppercase tracking-widest opacity-40 font-mono-tech ml-4">Secure ID</label>
                <div className="relative">
                  <Mail className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 opacity-30" />
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nexus@lab.ai" 
                    className="w-full bg-white/5 border border-white/10 rounded-full py-5 px-14 text-[11px] font-mono-tech uppercase tracking-widest text-[#f1e194] outline-none focus:border-white/30 transition-all" 
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[9px] uppercase tracking-widest opacity-40 font-mono-tech ml-4">Set Access Key</label>
                <div className="relative">
                  <Lock className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 opacity-30" />
                  <input 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••" 
                    className="w-full bg-white/5 border border-white/10 rounded-full py-5 px-14 text-[11px] font-mono-tech uppercase tracking-widest text-[#f1e194] outline-none focus:border-white/30 transition-all" 
                    required
                  />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full py-6 bg-[#f1e194] text-[#5b0e14] font-bold uppercase tracking-[0.3em] text-[10px] rounded-full shadow-2xl hover:scale-[1.02] active:scale-95 transition-all mt-4"
              >
                {loading ? 'Initializing...' : 'Establish Protocol'}
              </button>
            </form>

            <div className="relative flex items-center justify-center py-4">
              <div className="absolute w-full h-[1px] bg-white/10" />
              <span className="relative z-10 bg-[#5b0e14] px-4 text-[8px] font-mono-tech text-white/30 uppercase tracking-[0.4em]">OR</span>
            </div>

            <button 
              onClick={handleGoogleSignup}
              className="w-full py-5 border border-white/10 rounded-full flex items-center justify-center gap-4 text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-white/5 transition-all"
            >
              <img src="https://www.google.com/favicon.ico" className="w-4 h-4 grayscale contrast-200" alt="" />
              Initialize via Gmail
            </button>

            <p className="text-center text-[9px] font-mono-tech uppercase tracking-widest text-[#f1e194]/40">
              Already verified? <Link to="/login" className="text-[#f1e194] hover:underline">Authenticate Access</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
