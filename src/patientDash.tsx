import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, CheckCircle, Sparkles } from 'lucide-react';

export default function PatientDash() {
  const [isScanning, setIsScanning] = useState(false);
  const [matchFound, setMatchFound] = useState(false);

  const startAnalysis = () => {
    setIsScanning(true);
    // Simulate Gemini API processing time
    setTimeout(() => {
      setIsScanning(false);
      setMatchFound(true);
    }, 4000);
  };

  return (
    <div className="max-w-7xl mx-auto px-10 py-12 grid grid-cols-12 gap-8">
      
      {/* 1. Left Sidebar: Patient Identity */}
      <div className="col-span-12 lg:col-span-3 space-y-6">
        <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/5">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-indigo-500 to-emerald-500" />
            <div>
              <h4 className="font-bold text-white">Anonymized Patient</h4>
              <p className="text-[10px] font-mono text-slate-500">DID: 0x7f...8a2b</p>
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Privacy Status</span>
              <span className="text-emerald-500 font-bold">Encrypted</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Main Analysis Area */}
      <div className="col-span-12 lg:col-span-6 space-y-6">
        <div className="relative p-12 rounded-[2.5rem] bg-white/[0.03] border border-white/10 border-dashed flex flex-col items-center justify-center text-center overflow-hidden">
          
          <AnimatePresence mode="wait">
            {!isScanning && !matchFound ? (
              <motion.div exit={{ opacity: 0 }} className="space-y-6">
                <div className="w-20 h-20 bg-indigo-500/10 rounded-3xl flex items-center justify-center mx-auto">
                  <FileText className="text-indigo-400" size={32} />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white">Upload Medical Records</h3>
                  <p className="text-slate-500 mt-2">PDF, JPG, or DICOM. Gemini AI will extract medical criteria anonymously.</p>
                </div>
                <button 
                  onClick={startAnalysis}
                  className="px-8 py-3 bg-white text-black rounded-full font-bold hover:scale-105 transition-all"
                >
                  Select File
                </button>
              </motion.div>
            ) : isScanning ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8 w-full">
                {/* Simulated PDF Scan */}
                <div className="relative w-64 h-80 bg-white/5 rounded-xl mx-auto overflow-hidden border border-white/10">
                   <motion.div 
                     animate={{ top: ['0%', '100%', '0%'] }}
                     transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                     className="absolute inset-x-0 h-1 bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,1)] z-10"
                   />
                   <div className="p-4 space-y-3 opacity-20">
                     {[1,2,3,4,5,6].map(i => <div key={i} className="h-2 w-full bg-white/40 rounded-full" />)}
                   </div>
                </div>
                <div className="flex items-center justify-center gap-2 text-emerald-500 font-bold tracking-widest text-xs">
                  <Sparkles size={16} /> GEMINI AI ANALYZING CONDITIONS...
                </div>
              </motion.div>
            ) : (
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6">
                <div className="w-20 h-20 bg-emerald-500/10 rounded-3xl flex items-center justify-center mx-auto">
                  <CheckCircle className="text-emerald-500" size={32} />
                </div>
                <h3 className="text-2xl font-bold text-white">Analysis Complete</h3>
                <div className="flex flex-wrap justify-center gap-2">
                   {['Type II Diabetes', 'Stage 1 Hypertension', 'Age 45-60'].map(tag => (
                     <span key={tag} className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[10px] font-bold text-slate-400 uppercase tracking-wider">{tag}</span>
                   ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* 3. Right Sidebar: Trial Matches */}
      <div className="col-span-12 lg:col-span-3 space-y-4">
        <h5 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4 px-2">Top Matches</h5>
        <TrialMatchCard title="Insulin Resilience Study" company="NovoVax" score={98} />
        <TrialMatchCard title="Heart Health L2" company="MedGlobal" score={84} />
      </div>
    </div>
  );
}
interface TrialMatchCardProps {
    title: string;
    company: string;
    score: number;
  }

function TrialMatchCard({ title, company, score }: TrialMatchCardProps) {
  return (
    <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-indigo-500/30 transition-all group">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h6 className="font-bold text-white group-hover:text-indigo-400 transition-colors">{title}</h6>
          <p className="text-xs text-slate-500">{company}</p>
        </div>
        <div className="text-right">
          <div className="text-lg font-black text-emerald-500">{score}%</div>
          <div className="text-[8px] font-bold text-slate-600 uppercase">Match</div>
        </div>
      </div>
      <button className="w-full py-2 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-[10px] font-bold uppercase tracking-widest text-indigo-400 hover:bg-indigo-500 hover:text-white transition-all">
        Sign Consent
      </button>
    </div>
  );
}