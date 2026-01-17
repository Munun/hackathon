import { motion } from 'framer-motion';
import { Shield, Activity, Search } from 'lucide-react';

export const VisualThreeD = () => {
  return (
    <div className="relative w-full h-[400px] flex items-center justify-center [perspective:1000px]">
      <motion.div
        animate={{ 
          rotateY: [0, 10, -10, 0],
          rotateX: [0, 5, -5, 0],
          y: [0, -20, 0]
        }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        className="relative w-72 h-96 bg-white/[0.03] border border-white/10 rounded-3xl backdrop-blur-xl [transform-style:preserve-3d] shadow-2xl"
      >
        {/* Glowing scanning line */}
        <motion.div 
          animate={{ top: ['0%', '100%', '0%'] }}
          transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
          className="absolute left-0 right-0 h-1 bg-emerald-500/50 blur-sm z-20"
        />
        
        <div className="p-6 flex flex-col gap-6">
          <div className="h-4 w-1/2 bg-white/10 rounded-full" />
          <div className="space-y-3">
             <div className="h-2 w-full bg-white/5 rounded-full" />
             <div className="h-2 w-full bg-white/5 rounded-full" />
             <div className="h-2 w-3/4 bg-white/5 rounded-full" />
          </div>
          <div className="mt-auto flex justify-between items-end">
            <Activity className="text-emerald-500" size={32} />
            <div className="text-right">
              <div className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Match Score</div>
              <div className="text-2xl font-black text-white">98.2%</div>
            </div>
          </div>
        </div>

        {/* Floating elements behind/beside */}
        <div className="absolute -top-10 -right-10 p-4 bg-indigo-500/20 border border-indigo-500/30 rounded-2xl backdrop-blur-md [transform:translateZ(50px)]">
          <Shield className="text-indigo-400" />
        </div>
        <div className="absolute -bottom-10 -left-10 p-4 bg-emerald-500/20 border border-emerald-500/30 rounded-2xl backdrop-blur-md [transform:translateZ(80px)]">
          <Search className="text-emerald-400" />
        </div>
      </motion.div>
    </div>
  );
};