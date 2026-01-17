import { BarChart3, Users, Globe, ShieldCheck } from 'lucide-react';
import { motion} from 'framer-motion';

export default function ResearcherDash() {
  return (
    <div className="max-w-7xl mx-auto px-10 py-12">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
        <StatCard icon={<Users />} label="Total Matched" value="1,284" color="text-indigo-400" />
        <StatCard icon={<Globe />} label="Diversity Score" value="94%" color="text-emerald-400" />
        <StatCard icon={<ShieldCheck />} label="Verified Consent" value="100%" color="text-blue-400" />
        <StatCard icon={<BarChart3 />} label="Trial Velocity" value="+12.4%" color="text-purple-400" />
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Candidate Table */}
        <div className="lg:col-span-2 p-8 rounded-[2.5rem] bg-white/[0.02] border border-white/10">
          <div className="flex justify-between items-center mb-8">
             <h3 className="text-xl font-bold text-white">Anonymized Candidate Pool</h3>
             <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-3 py-1 rounded-full uppercase tracking-wider">Live Updates</span>
          </div>
          <div className="space-y-4">
             <CandidateRow id="DID: 0x82...a1" match={98} tag="Underrepresented Group" />
             <CandidateRow id="DID: 0xf3...c4" match={92} tag="Regional Priority" />
             <CandidateRow id="DID: 0xa9...b2" match={89} tag="General Health" />
          </div>
        </div>

        {/* Diversity Breakdown Visual */}
        <div className="p-8 rounded-[2.5rem] bg-indigo-500/5 border border-indigo-500/10 flex flex-col justify-between">
           <div>
             <h3 className="text-xl font-bold text-white mb-2">Diversity Metrics</h3>
             <p className="text-sm text-slate-500">Real-time demographic distribution based on Gemini AI extraction.</p>
           </div>
           <div className="space-y-4 mt-8">
              <ProgressBar label="Ethnic Diversity" progress={88} />
              <ProgressBar label="Socioeconomic Reach" progress={72} />
              <ProgressBar label="Age Distribution" progress={95} />
           </div>
        </div>
      </div>
    </div>
  );
}

// Sub-components to keep clean
const StatCard = ({ icon, label, value, color }: any) => (
  <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/5">
    <div className={`${color} mb-3`}>{icon}</div>
    <div className="text-2xl font-black text-white">{value}</div>
    <div className="text-[10px] uppercase font-bold text-slate-500 tracking-widest">{label}</div>
  </div>
);

const CandidateRow = ({ id, match, tag }: any) => (
  <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-white/10 transition-all">
    <div className="flex items-center gap-4">
      <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
      <span className="font-mono text-xs text-slate-400">{id}</span>
    </div>
    <div className="flex items-center gap-4">
       <span className="text-[10px] text-indigo-400 font-bold uppercase">{tag}</span>
       <span className="text-white font-bold">{match}% Match</span>
    </div>
  </div>
);

const ProgressBar = ({ label, progress }: any) => (
  <div className="space-y-2">
    <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest">
      <span>{label}</span>
      <span>{progress}%</span>
    </div>
    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
      <motion.div 
        initial={{ width: 0 }}
        whileInView={{ width: `${progress}%` }}
        className="h-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.4)]"
      />
    </div>
  </div>
);