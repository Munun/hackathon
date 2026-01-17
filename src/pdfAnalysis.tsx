import { motion } from "framer-motion";
import { FileCheck, TrendingUp, AlertCircle, CheckCircle } from "lucide-react";
import type { UploadRecordResponse } from "./utils";

interface PDFAnalysisProps {
  result: UploadRecordResponse;
  onBackClick: () => void;
}

export default function PDFAnalysis({ result, onBackClick }: PDFAnalysisProps) {
  const { patient_data, matches } = result;

  return (
    <div className="max-w-7xl mx-auto px-10 py-12">
      {/* Header */}
      <div className="mb-12">
        <button
          onClick={onBackClick}
          className="mb-6 text-indigo-400 hover:text-indigo-300 text-sm font-bold uppercase tracking-wider"
        >
          ← Back to Upload
        </button>
        <h1 className="text-4xl font-black text-white mb-2">PDF Analysis Results</h1>
        <p className="text-slate-500">Extracted medical data and clinical trial matches</p>
      </div>

      {/* Two Column Layout */}
      <div className="grid lg:grid-cols-2 gap-8 mb-8">
        {/* Patient Data Analysis */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-8 rounded-3xl bg-white/[0.02] border border-white/10"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
              <FileCheck className="text-emerald-400" size={24} />
            </div>
            <h2 className="text-2xl font-bold text-white">Patient Information</h2>
          </div>

          <div className="space-y-6">
            {/* Age */}
            <div className="pb-6 border-b border-white/5">
              <label className="text-xs uppercase font-bold text-slate-500 tracking-widest">Age</label>
              <p className="text-2xl font-bold text-white mt-2">{patient_data.age || "N/A"} years</p>
            </div>

            {/* Ethnicity */}
            <div className="pb-6 border-b border-white/5">
              <label className="text-xs uppercase font-bold text-slate-500 tracking-widest">Ethnicity</label>
              <p className="text-2xl font-bold text-white mt-2">{patient_data.ethnicity || "Not specified"}</p>
            </div>

            {/* Confidence Score */}
            <div className="pb-6 border-b border-white/5">
              <label className="text-xs uppercase font-bold text-slate-500 tracking-widest">Extraction Confidence</label>
              <div className="flex items-center gap-4 mt-2">
                <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(patient_data.confidence_score || 0) * 100}%` }}
                    className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400"
                  />
                </div>
                <span className="text-lg font-bold text-emerald-400">
                  {((patient_data.confidence_score || 0) * 100).toFixed(1)}%
                </span>
              </div>
            </div>

            {/* Conditions */}
            <div>
              <label className="text-xs uppercase font-bold text-slate-500 tracking-widest mb-3 block">
                Diagnosed Conditions
              </label>
              <div className="flex flex-wrap gap-2">
                {patient_data.conditions && patient_data.conditions.length > 0 ? (
                  patient_data.conditions.map((condition, i) => (
                    <motion.span
                      key={i}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.05 }}
                      className="px-4 py-2 bg-indigo-500/20 border border-indigo-500/30 rounded-full text-sm font-bold text-indigo-300"
                    >
                      {condition}
                    </motion.span>
                  ))
                ) : (
                  <span className="text-slate-500 text-sm">No conditions detected</span>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Lab Results */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="p-8 rounded-3xl bg-white/[0.02] border border-white/10"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20">
              <TrendingUp className="text-blue-400" size={24} />
            </div>
            <h2 className="text-2xl font-bold text-white">Lab Results</h2>
          </div>

          <div className="space-y-3">
            {patient_data.lab_results && Object.keys(patient_data.lab_results).length > 0 ? (
              Object.entries(patient_data.lab_results).map(([test, value], i) => (
                <motion.div
                  key={test}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex justify-between items-center p-4 rounded-xl bg-white/5 border border-white/5 hover:border-blue-500/20 transition-all"
                >
                  <span className="font-mono text-sm text-slate-400">{test.replace(/_/g, " ")}</span>
                  <span className="font-bold text-white">{value}</span>
                </motion.div>
              ))
            ) : (
              <p className="text-slate-500 text-sm">No lab results detected</p>
            )}
          </div>
        </motion.div>
      </div>

      {/* Clinical Trial Matches */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="p-8 rounded-3xl bg-white/[0.02] border border-white/10"
      >
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20">
              <CheckCircle className="text-purple-400" size={24} />
            </div>
            <h2 className="text-2xl font-bold text-white">Matched Clinical Trials</h2>
          </div>
          <span className="text-sm font-bold text-slate-500 bg-white/5 px-4 py-2 rounded-full">
            {matches.length} Trial{matches.length !== 1 ? "s" : ""} Found
          </span>
        </div>

        {matches.length > 0 ? (
          <div className="grid gap-6">
            {matches.map((match, i) => (
              <motion.div
                key={match.trial_id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.1 }}
                className="p-6 rounded-2xl bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 hover:border-purple-500/20 transition-all"
              >
                {/* Trial Header */}
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="text-xl font-bold text-white mb-1">{match.trial_name}</h3>
                    <p className="text-sm text-slate-500 font-mono">{match.trial_id}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-4xl font-black text-purple-400">{match.match_score}%</div>
                    <div className="text-xs font-bold text-slate-500 uppercase mt-1">Match Score</div>
                  </div>
                </div>

                {/* Recommendation Badge */}
                <div className="mb-6 inline-block">
                  <span
                    className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider ${
                      match.match_score >= 80
                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                        : match.match_score >= 60
                          ? "bg-yellow-500/20 text-yellow-300 border border-yellow-500/30"
                          : "bg-orange-500/20 text-orange-300 border border-orange-500/30"
                    }`}
                  >
                    {match.recommendation}
                  </span>
                </div>

                {/* Qualifying & Disqualifying Factors */}
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Qualifying */}
                  <div>
                    <h4 className="text-sm font-bold text-emerald-400 uppercase tracking-wider mb-3">
                      ✓ Qualifying Factors
                    </h4>
                    <ul className="space-y-2">
                      {match.qualifying_factors.map((factor, j) => (
                        <li key={j} className="text-sm text-slate-300 flex items-start gap-2">
                          <span className="text-emerald-400 font-bold mt-0.5">•</span>
                          <span>{factor}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Disqualifying */}
                  <div>
                    <h4 className="text-sm font-bold text-orange-400 uppercase tracking-wider mb-3">
                      ⚠ Potential Concerns
                    </h4>
                    <ul className="space-y-2">
                      {match.disqualifying_factors.length > 0 ? (
                        match.disqualifying_factors.map((factor, j) => (
                          <li key={j} className="text-sm text-slate-300 flex items-start gap-2">
                            <span className="text-orange-400 font-bold mt-0.5">•</span>
                            <span>{factor}</span>
                          </li>
                        ))
                      ) : (
                        <p className="text-sm text-slate-500">No concerns identified</p>
                      )}
                    </ul>
                  </div>
                </div>

                {/* Confidence Indicator */}
                <div className="mt-6 pt-6 border-t border-white/5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500 uppercase">Match Confidence</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${match.confidence * 100}%` }}
                          className="h-full bg-purple-500"
                        />
                      </div>
                      <span className="text-xs font-bold text-purple-400">{(match.confidence * 100).toFixed(0)}%</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center py-12 text-center">
            <div>
              <AlertCircle className="mx-auto text-slate-600 mb-4" size={32} />
              <p className="text-slate-500">No matching clinical trials found for this patient profile.</p>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
