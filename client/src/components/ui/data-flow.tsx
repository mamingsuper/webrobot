'use client';

import { motion } from 'framer-motion';

export function DataFlow() {
  const waveVariants = {
    animate: (i: number) => ({
      x: ['-100%', '100%'],
      transition: {
        repeat: Infinity,
        duration: 8 - i * 0.5, // 每行速度不同
        ease: "linear",
        delay: i * 0.2 // 错开启动时间
      }
    })
  };

  return (
    <div className="absolute inset-0 overflow-hidden opacity-20">
      {[...Array(12)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute h-[1px] bg-gradient-to-r from-transparent via-blue-500/50 to-transparent"
          style={{
            top: `${8 + i * 8}%`,
            left: '-100%',
            right: '-100%',
            filter: 'blur(4px)',
          }}
          variants={waveVariants}
          animate="animate"
          custom={i}
        />
      ))}
      {/* 添加交叉流 */}
      {[...Array(8)].map((_, i) => (
        <motion.div
          key={`cross-${i}`}
          className="absolute h-[1px] bg-gradient-to-r from-transparent via-purple-500/30 to-transparent"
          style={{
            top: `${15 + i * 10}%`,
            left: '100%',
            right: '-100%',
            filter: 'blur(3px)',
          }}
          variants={waveVariants}
          animate="animate"
          custom={i + 4}
        />
      ))}
    </div>
  );
}