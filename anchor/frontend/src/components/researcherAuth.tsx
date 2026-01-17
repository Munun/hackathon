import { useState } from 'react';
import { motion } from 'framer-motion';
import { Lock, Mail, ArrowRight } from 'lucide-react';

interface AuthProps {
  onAuthenticated: () => void;
}

export default function ResearcherAuth({ onAuthenticated }: AuthProps) {
  const [email, setEmail] = useState('');

  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    // In a hackathon, we simulate auth. Real-world: connect to Supabase/Firebase
    if (email.length > 5) onAuthenticated();
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-6">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md p-10 rounded-[2.5rem] bg-white/[0.02] border border-white/10 backdrop-blur-2xl shadow-2xl"
      >
        <div className="mb-10 text-center">
          <div className="w-16 h-16 bg-indigo-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-indigo-500/20">
            <Lock className="text-indigo-400" size={28} />
          </div>
          <h2 className="text-3xl font-black tracking-tighter text-white">Researcher Portal</h2>
          <p className="text-slate-500 mt-2 text-sm">Authorized clinical personnel only.</p>
        </div>

        <form onSubmit={handleSignIn} className="space-y-4">
          <div className="relative group">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors" size={18} />
            <input 
              type="email" 
              required
              placeholder="Institutional Email"
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-indigo-500/50 transition-all"
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <button className="w-full py-4 bg-white text-black rounded-2xl font-bold hover:bg-slate-200 transition-all flex items-center justify-center gap-2">
            Continue to Dashboard <ArrowRight size={18} />
          </button>
        </form>

        <p className="mt-8 text-center text-[10px] text-slate-600 uppercase tracking-widest font-bold">
          Protected by PharmaTrace Multi-Layer Encryption
        </p>
      </motion.div>
    </div>
  );
}