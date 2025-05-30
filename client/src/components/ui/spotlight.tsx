'use client';
import React, { useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

type SpotlightProps = {
  className?: string;
  particleSize?: number;
  trailLength?: number;
  colors?: string[];
};

export function Spotlight({
  className,
  particleSize = 25,
  trailLength = 25,
  colors = ['#FF1CF7', '#00FFE0', '#00FF85', '#FFF500', '#FF8E00']
}: SpotlightProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [particles, setParticles] = useState<Array<{
    x: number;
    y: number;
    id: number;
    color: string;
  }>>([]);
  const [isActive, setIsActive] = useState(true);
  const currentIdRef = useRef(0);
  const lastMoveTimeRef = useRef(Date.now());

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isActive) return;
      
      lastMoveTimeRef.current = Date.now();
      const newParticle = {
        x: e.clientX,
        y: e.clientY,
        id: currentIdRef.current++,
        color: colors[Math.floor(Math.random() * colors.length)]
      };

      setParticles(prev => {
        const newParticles = [...prev, newParticle];
        if (newParticles.length > trailLength) {
          return newParticles.slice(-trailLength);
        }
        return newParticles;
      });
    };

    const clearInactiveParticles = () => {
      const now = Date.now();
      if (now - lastMoveTimeRef.current > 50) { // 50ms 无移动就清除粒子
        setParticles([]);
      }
    };

    const intervalId = setInterval(clearInactiveParticles, 50);

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseenter', () => setIsActive(true));
    document.addEventListener('mouseleave', () => {
      setIsActive(false);
      setParticles([]);
    });

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseenter', () => setIsActive(true));
      document.removeEventListener('mouseleave', () => {
        setIsActive(false);
        setParticles([]);
      });
      clearInterval(intervalId);
    };
  }, [colors, isActive, trailLength]);

  return (
    <div 
      ref={containerRef}
      className={cn("particle-container", className)}
      style={{ zIndex: 9999 }}
    >
      {particles.map((particle, index) => {
        const scale = 1 - (index / particles.length) * 0.5;
        const opacity = (1 - index / particles.length);

        return (
          <motion.div
            key={particle.id}
            className="particle"
            style={{
              left: particle.x,
              top: particle.y,
              width: particleSize,
              height: particleSize,
              backgroundColor: particle.color,
              opacity,
              filter: 'blur(10px)',
              transform: `translate(-50%, -50%) scale(${scale})`,
            }}
            initial={{ scale: 0 }}
            animate={{ 
              scale,
              x: Math.random() * 60 - 30,
              y: Math.random() * 60 - 30,
            }}
            transition={{
              duration: 0.5,
              ease: "easeOut"
            }}
          />
        );
      })}
    </div>
  );
}