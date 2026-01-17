import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, CheckCircle } from 'lucide-react'; 
import { useSolanaProgram } from '../hooks/useSolanaProgram';

export default function PatientDash() {
  const [isScanning, setIsScanning] = useState(false);
  const [matchFound, setMatchFound] = useState(false);
  const { signConsent } = useSolanaProgram();

  const startAnalysis = () => {
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
      setMatchFound(true);
    }, 3000);
  };

  return (
    <div className="max-w-7xl mx-auto px-10 py-12 grid grid-cols-12 gap-8">
      {/* Analysis Area */}
      <div className="col-span-12 lg:col-span-8">
        <div className="p-12 rounded-[2.5rem] bg-white/[0.03] border border-white/10 border-dashed flex flex-col items-center text-center">
          <AnimatePresence mode="wait">
            {!isScanning && !matchFound ? (
              <motion.div exit={{ opacity: 0 }} className="space-y-6">
                <FileText className="text-indigo-400 mx-auto" size={48} />
                <h3 className="text-2xl font-bold text-white">Upload Medical Records</h3>
                <button onClick={startAnalysis} className="px-8 py-3 bg-white text-black rounded-full font-bold">
                  Select File
                </button>
              </motion.div>
            ) : isScanning ? (
              <div className="text-emerald-500 font-bold animate-pulse">GEMINI AI ANALYZING...</div>
            ) : (
              <div className="space-y-4">
                <CheckCircle className="text-emerald-500 mx-auto" size={48} />
                <h3 className="text-xl text-white">Analysis Complete</h3>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Trial Sidebar */}
      <div className="col-span-12 lg:col-span-4 space-y-4">
        <TrialMatchCard signConsent={signConsent} title="Insulin Resilience" company="NovoVax" score={98} />
      </div>
    </div>
  );
}

function TrialMatchCard({ title, company, score, signConsent }: any) {
  const [loading, setLoading] = useState(false);
  const handleSign = async () => {
    setLoading(true);
    try {
      const tx = await signConsent(title);
      alert(`Success! TX: ${tx}`);
    } catch (e: any) {
      alert(`Error: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/5">
      <h6 className="font-bold text-white">{title}</h6>
      <p className="text-xs text-slate-500 mb-4">{company} • {score}% match</p>
      <button 
        onClick={handleSign}
        className="w-full py-2 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-400 hover:bg-indigo-500 hover:text-white"
      >
        {loading ? "Signing..." : "Sign Consent"}
      </button>
    </div>
  );
}