import { useEffect, useState } from 'react';
import { motion, useSpring, useMotionValue } from 'framer-motion';

const CustomCursor = () => {
  const [isMoving, setIsMoving] = useState(false);
  const mouseX = useMotionValue(-100);
  const mouseY = useMotionValue(-100);

  // Spring settings for the "smooth" trail follow effect
  const springConfig = { damping: 25, stiffness: 250 };
  const trailX = useSpring(mouseX, springConfig);
  const trailY = useSpring(mouseY, springConfig);

  useEffect(() => {
    let moveTimeout: number;

    const handleMouseMove = (e: MouseEvent) => {
      mouseX.set(e.clientX - 8); // Offset for circle half-width (16px / 2)
      mouseY.set(e.clientY - 8);
      
      setIsMoving(true);
      
      // Reset the "moving" state when velocity drops
      clearTimeout(moveTimeout);
      moveTimeout = window.setTimeout(() => setIsMoving(false), 100);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [mouseX, mouseY]);

  return (
    <>
      {/* Main Cursor Circle */}
      <motion.div
        className="fixed top-0 left-0 w-4 h-4 bg-white rounded-full z-[10000] pointer-events-none"
        style={{ x: mouseX, y: mouseY }}
      />

      {/* Trailing Circle */}
      <motion.div
        className="fixed top-0 left-0 w-4 h-4 bg-white/30 rounded-full z-[9999] pointer-events-none"
        style={{ 
          x: trailX, 
          y: trailY,
          scale: isMoving ? 1 : 0, // Shrinks away when stationary
          opacity: isMoving ? 0.5 : 0 
        }}
        transition={{ opacity: { duration: 0.2 }, scale: { duration: 0.3 } }}
      />
    </>
  );
};

export default CustomCursor;