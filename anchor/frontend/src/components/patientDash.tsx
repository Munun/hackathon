import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, CheckCircle, Sparkles } from "lucide-react";
import { uploadRecord, type UploadRecordResponse } from "./utils.ts";
import PDFAnalysis from "./pdfAnalysis.tsx";

export default function PatientDash() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [isScanning, setIsScanning] = useState(false);
  const [matchFound, setMatchFound] = useState(false);

  // Store backend output + errors
  const [result, setResult] = useState<UploadRecordResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showAnalysis, setShowAnalysis] = useState(false);

  // Click "Select File" -> open hidden input
  const startAnalysis = () => {
    setError(null);
    fileInputRef.current?.click();
  };

  // When a file is selected, upload to backend
  const onFileSelected = async (file: File | null) => {
    if (!file) return;

    // Reset UI state
    setIsScanning(true);
    setMatchFound(false);
    setResult(null);
    setError(null);

    try {
      const data = await uploadRecord(file);
      setResult(data);
      setIsScanning(false);
      setMatchFound(true);
    } catch (e: any) {
      setIsScanning(false);
      setMatchFound(false);
      setError(e?.message || "Upload failed");
    }
  };

  // Build tags dynamically from backend patient data
  const tags: string[] = (() => {
    const conditions = result?.patient_data?.conditions ?? [];
    const age = result?.patient_data?.age;

    const t: string[] = [];
    for (const c of conditions) t.push(c);

    if (typeof age === "number") {
      if (age < 18) t.push("Age < 18");
      else if (age <= 30) t.push("Age 18-30");
      else if (age <= 45) t.push("Age 31-45");
      else if (age <= 60) t.push("Age 46-60");
      else t.push("Age 60+");
    }

    // limit to avoid UI overflow
    return t.slice(0, 6);
  })();

  // Top matches (use backend if available; otherwise empty)
  const matches = result?.matches?.slice(0, 2) ?? [];

  return (
    <>
      {showAnalysis && result ? (
        <PDFAnalysis result={result} onBackClick={() => setShowAnalysis(false)} />
      ) : (
        <div className="max-w-7xl mx-auto px-10 py-12 grid grid-cols-12 gap-8">
          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={(e) => onFileSelected(e.target.files?.[0] ?? null)}
          />

          {/* 1. Left Sidebar: Patient Identity */}
          <div className="col-span-12 lg:col-span-3 space-y-6">
            <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/5">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-indigo-500 to-emerald-500" />
                <div>
                  <h4 className="font-bold text-white">Anonymized Patient</h4>
                  <p className="text-[10px] font-mono text-slate-500">DID: 0x7f.8a2b</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Privacy Status</span>
                  <span className="text-emerald-500 font-bold">Encrypted</span>
                </div>

                {result?.patient_data?.confidence_score != null && (
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Extraction Confidence</span>
                    <span className="text-white font-bold">
                      {(result.patient_data.confidence_score * 100).toFixed(0)}%
                    </span>
                  </div>
                )}

                {error && (
                  <div className="mt-3 text-xs text-red-400 bg-red-500/10 border border-red-500/20 p-3 rounded-xl">
                    {error}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 2. Main Analysis Area */}
          <div className="col-span-12 lg:col-span-6 space-y-6">
            <div className="relative p-12 rounded-[2.5rem] bg-white/[0.03] border border-white/10 border-dashed flex flex-col items-center justify-center text-center overflow-hidden">
              <AnimatePresence mode="wait">
                {!isScanning && !matchFound ? (
                  <motion.div key="idle" exit={{ opacity: 0 }} className="space-y-6">
                    <div className="w-20 h-20 bg-indigo-500/10 rounded-3xl flex items-center justify-center mx-auto">
                      <FileText className="text-indigo-400" size={32} />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-white">Upload Medical Records</h3>
                      <p className="text-slate-500 mt-2">
                        PDF only. AI will extract medical criteria anonymously.
                      </p>
                    </div>

                    <button
                      onClick={startAnalysis}
                      className="px-8 py-3 bg-white text-black rounded-full font-bold hover:scale-105 transition-all"
                    >
                      Select File
                    </button>
                  </motion.div>
                ) : isScanning ? (
                  <motion.div
                    key="scanning"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="space-y-8 w-full"
                  >
                    {/* Simulated PDF Scan */}
                    <div className="relative w-64 h-80 bg-white/5 rounded-xl mx-auto overflow-hidden border border-white/10">
                      <motion.div
                        animate={{ top: ["0%", "100%", "0%"] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                        className="absolute inset-x-0 h-1 bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,1)] z-10"
                      />
                      <div className="p-4 space-y-3 opacity-20">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                          <div key={i} className="h-2 w-full bg-white/40 rounded-full" />
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center justify-center gap-2 text-emerald-500 font-bold tracking-widest text-xs">
                      <Sparkles size={16} /> ANALYZING CONDITIONS...
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="done"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="space-y-6"
                  >
                    <div className="w-20 h-20 bg-emerald-500/10 rounded-3xl flex items-center justify-center mx-auto">
                      <CheckCircle className="text-emerald-500" size={32} />
                    </div>
                    <h3 className="text-2xl font-bold text-white">Analysis Complete</h3>
                    <div className="flex gap-4">
                      <button
                        onClick={() => setShowAnalysis(true)}
                        className="px-8 py-3 bg-indigo-500 text-white rounded-full font-bold hover:bg-indigo-600 transition-all"
                      >
                        View Full Analysis
                      </button>

                      <button
                        onClick={startAnalysis}
                        className="px-8 py-3 bg-white/10 text-white rounded-full font-bold hover:bg-white/20 transition-all"
                      >
                        Upload Another File
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* 3. Right Sidebar: Trial Matches */}
          <div className="col-span-12 lg:col-span-3 space-y-4">
            <h5 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4 px-2">
              Top Matches
            </h5>

            {matches.length > 0 ? (
              matches.map((m) => (
                <TrialMatchCard
                  key={m.trial_id}
                  title={m.trial_name}
                  company={m.trial_id}
                  score={m.match_score}
                />
              ))
            ) : (
              <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/5 text-slate-500 text-sm">
                Upload a PDF to see matches.
              </div>
            )}
          </div>
        </div>
      )}
    </>
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
          <h6 className="font-bold text-white group-hover:text-indigo-400 transition-colors">
            {title}
          </h6>
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
