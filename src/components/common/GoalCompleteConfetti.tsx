import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ConfettiPiece {
  id: number;
  x: number;
  delay: number;
  size: number;
  color: string;
}

const GoalCompleteConfetti = () => {
  const [showConfetti, setShowConfetti] = useState(false);
  const [confettiPieces, setConfettiPieces] = useState<ConfettiPiece[]>([]);
  
  const colors = [
    'bg-blue-500',
    'bg-blue-400',
    'bg-green-400',
    'bg-green-500',
    'bg-purple-400',
    'bg-purple-500',
  ];
  
  // This will listen for a custom event fired when a task or habit is completed
  useEffect(() => {
    const handleGoalComplete = () => {
      const pieces = Array.from({ length: 50 }).map((_, i) => ({
        id: i,
        x: Math.random() * 100, // random horizontal position
        delay: Math.random() * 0.5, // random delay for animation start
        size: Math.random() * 10 + 5, // random size between 5-15px
        color: colors[Math.floor(Math.random() * colors.length)]
      }));
      
      setConfettiPieces(pieces);
      setShowConfetti(true);
      
      // Hide confetti after animation completes
      setTimeout(() => {
        setShowConfetti(false);
      }, 3000);
    };
    
    window.addEventListener('goalComplete', handleGoalComplete as EventListener);
    
    return () => {
      window.removeEventListener('goalComplete', handleGoalComplete as EventListener);
    };
  }, []);
  
  return (
    <AnimatePresence>
      {showConfetti && (
        <motion.div 
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 pointer-events-none overflow-hidden"
        >
          {confettiPieces.map((piece) => (
            <motion.div
              key={piece.id}
              className={`absolute rounded-full ${piece.color}`}
              style={{ 
                left: `${piece.x}%`,
                top: '-20px',
                width: `${piece.size}px`,
                height: `${piece.size}px`
              }}
              initial={{ y: -20, rotate: 0 }}
              animate={{
                y: window.innerHeight + 100,
                rotate: Math.random() * 360 * (Math.random() > 0.5 ? 1 : -1),
                x: Math.random() * 100 - 50
              }}
              transition={{
                duration: 2.5 + Math.random(),
                delay: piece.delay,
                ease: [0.1, 0.25, 0.3, 1]
              }}
            />
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default GoalCompleteConfetti;