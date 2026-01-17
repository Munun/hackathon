import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Database, Brain, UserCheck, BarChart3 } from 'lucide-react';
import PatientDash from './components/patientDash.tsx';
import ResearcherAuth from './components/researcherAuth';
import ResearcherDash from './components/researcherDash';
import CustomCursor from './components/CustomCursor';
import VisualThreeD from "./components/VisualThreeD.tsx";
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';

// // Reusable Feature Card with Hover Effects
// interface FeatureCardProps {
//   icon: React.ReactNode;
//   title: string;
//   desc: string;
//   delay: number;
// }

// const FeatureCard = ({ icon, title, desc, delay }: FeatureCardProps) => (
//   <motion.div 
//     initial={{ opacity: 0, y: 20 }}
//     whileInView={{ opacity: 1, y: 0 }}
//     viewport={{ once: true }}
//     transition={{ delay, duration: 0.5 }}
//     className="group p-8 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/10 hover:bg-white/[0.04] transition-all duration-300"
//   >
//     <div className="mb-4 p-3 w-fit rounded-xl bg-white/5 group-hover:scale-110 group-hover:bg-indigo-500/10 transition-all duration-300">
//       {icon}
//     </div>
//     <h3 className="text-xl font-bold text-white mb-2 tracking-tight">{title}</h3>
//     <p className="text-slate-500 leading-relaxed">{desc}</p>
//   </motion.div>
// );

type ViewState = 'landing' | 'patient' | 'researcher-auth' | 'researcher-dash';

export default function App() {
    const [view, setView] = useState<ViewState>('landing');

    return (
      <div className="min-h-screen bg-[#08090a] relative overflow-hidden text-slate-200 selection:bg-indigo-500/30">
        <CustomCursor />
        <div className="absolute inset-0 bg-grid-pattern pointer-events-none" />
  
        {/* Shared Navbar */}
        <nav className="relative z-50 flex items-center justify-between px-10 py-6 max-w-7xl mx-auto">
          <div 
            className="flex items-center gap-3 cursor-pointer group" 
            onClick={() => setView('landing')}
          >
            <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 group-hover:border-emerald-500/40 transition-all">
              <ShieldCheck className="text-emerald-500" size={24} />
            </div>
            <span className="font-extrabold tracking-tighter text-2xl text-white">PharmaTrace</span>
          </div>
          
          {/* Portal Buttons Group */}
          <div className="flex items-center gap-4">
            {/* Light Version Button: Researcher */}
            <button 
              onClick={() => setView('researcher-auth')}
              className="px-5 py-2 bg-slate-100 text-black border border-white rounded-full text-sm font-bold hover:bg-white hover:scale-105 transition-all active:scale-95 shadow-[0_0_20px_rgba(255,255,255,0.1)]"
            >
              Researcher Portal
            </button>
  
            <WalletMultiButton />
          </div>
        </nav>
  
        <AnimatePresence mode="wait">
          {view === 'landing' && (
            <motion.div key="landing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
               {/* Replace with your Landing Page Hero & Bento Grid Components */}
               <section className="relative z-10 max-w-7xl mx-auto px-10 pt-15 grid lg:grid-cols-2 gap-20 items-center">
                    <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8 }}
                        >
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 mb-6">
                            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">System Live</span>
                        </div>
                        <h1 className="text-6xl md:text-8xl font-black tracking-tighter leading-tight text-white mb-8">
                            Decentralized <br /> <span className="text-gradient">Clinical Intelligence.</span>
                        </h1>
                        <p className="text-xl text-slate-400 mb-10 leading-relaxed max-w-lg">
                            PharmaTrace is a marketplace where patients securely monetize their medical data for researchers through AI matching and Solana-based micro-incentives.
                        </p>
                        <div className="flex gap-4">
                        <button 
                            onClick={() => setView('patient')}
                            className="btn-primary"
                            >
                                Start Matching
                            </button>
                            <WalletMultiButton className="btn-primary" />
                        </div>
                    </motion.div>
                    
                    <VisualThreeD />
                </section>

                {/* Bento Feature Grid */}
                <section className="relative z-10 max-w-7xl mx-auto px-10 py-40">
                    <div className="text-center mb-20">
                    <h2 className="text-4xl font-bold tracking-tight text-white mb-4">The Infrastructure of Trust</h2>
                    <p className="text-slate-500">How PharmaTrace bridges the gap in modern medical research.</p>
                    </div>

                    <div className="grid md:grid-cols-3 grid-rows-2 gap-4 h-[600px]">
                    {/* Large Primary Feature */}
                    <div className="md:col-span-2 row-span-1 p-8 rounded-3xl bg-white/[0.02] border border-white/5 flex flex-col justify-between group hover:bg-white/[0.04] transition-all">
                        <div>
                            <Brain className="text-indigo-500 mb-4" size={40} />
                            <h3 className="text-2xl font-bold text-white mb-2">Gemini AI Engine</h3>
                            <p className="text-slate-400 max-w-md">Our matching engine uses the Gemini API to extract complex conditions from messy PDFs without ever exposing your PII (Personally Identifiable Information).</p>
                        </div>
                        <div className="flex gap-2">
                            <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[10px] uppercase font-bold text-slate-500 tracking-wider">Zero-Knowledge</span>
                            <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[10px] uppercase font-bold text-slate-500 tracking-wider">OCR Verified</span>
                        </div>
                    </div>

                    {/* Square Feature 1 */}
                    <div className="p-8 rounded-3xl bg-white/[0.02] border border-white/5 group hover:border-emerald-500/20 transition-all">
                        <Database className="text-emerald-500 mb-4" />
                        <h3 className="text-xl font-bold text-white mb-2">Solana Settlement</h3>
                        <p className="text-sm text-slate-500">Instant micro-incentive payments for clinical participation, settled on the most efficient L1 blockchain.</p>
                    </div>

                    {/* Square Feature 2 */}
                    <div className="p-8 rounded-3xl bg-white/[0.02] border border-white/5 group hover:border-blue-500/20 transition-all">
                        <UserCheck className="text-blue-500 mb-4" />
                        <h3 className="text-xl font-bold text-white mb-2">Informed Consent</h3>
                        <p className="text-sm text-slate-500">Every trial agreement is cryptographically signed and stored on-chain for total transparency.</p>
                    </div>

                    {/* Medium Horizontal Feature */}
                    <div className="md:col-span-2 p-8 rounded-3xl bg-white/[0.02] border border-white/5 flex items-center justify-between group overflow-hidden">
                        <div className="max-w-sm">
                        <BarChart3 className="text-indigo-400 mb-4" />
                        <h3 className="text-xl font-bold text-white mb-2">Diversity Analytics</h3>
                        <p className="text-sm text-slate-500">Researchers view anonymized real-time dashboards to track trial diversity and demographic gaps.</p>
                        </div>
                        <div className="w-48 h-full bg-gradient-to-l from-indigo-500/10 to-transparent p-4 flex flex-col gap-2">
                        {[1,2,3].map(i => <div key={i} className="h-2 w-full bg-white/10 rounded-full animate-pulse" />)}
                        </div>
                    </div>
                    </div>
                </section>
            </motion.div>
          )}
  
          {view === 'patient' && (
            <motion.div key="patient" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <PatientDash />
            </motion.div>
          )}
  
          {view === 'researcher-auth' && (
            <motion.div key="auth" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <ResearcherAuth onAuthenticated={() => setView('researcher-dash')} />
            </motion.div>
          )}
  
          {view === 'researcher-dash' && (
            <motion.div key="dash" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <ResearcherDash />
            </motion.div>
          )}
          
        </AnimatePresence>
        {/* Hero with 3D Visual */}
        
      {/* Footer */}
      <footer className="relative z-10 py-12 border-t border-white/5 bg-black/20 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-10 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2 text-slate-500">
            <ShieldCheck size={18} />
            <span className="text-sm font-semibold tracking-tight">PharmaTrace hackathon-v1.0</span>
          </div>
          <div className="flex gap-8 text-xs font-bold uppercase tracking-widest text-slate-600">
             <a href="#" className="hover:text-white transition-colors">Privacy</a>
             <a href="#" className="hover:text-white transition-colors">Terms</a>
             <a href="#" className="hover:text-white transition-colors">Github</a>
          </div>
        </div>
      </footer>
    </div>
  );
}