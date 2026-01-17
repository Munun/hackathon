import { motion } from 'framer-motion';

export default function VisualThreeD() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 1 }}
      className="relative w-full h-[500px] flex items-center justify-center"
    >
      <div className="relative w-64 h-64">
        <motion.div
          animate={{ rotateY: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="w-full h-full bg-gradient-to-br from-emerald-500/20 to-indigo-500/20 rounded-3xl border border-white/10 shadow-2xl"
          style={{ transformStyle: 'preserve-3d' }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-emerald-500/10 to-transparent rounded-3xl blur-xl" />
      </div>
    </motion.div>
  );
}
