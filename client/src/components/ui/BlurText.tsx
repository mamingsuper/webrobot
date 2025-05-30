'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface BlurTextProps {
  text: string;
  delay?: number;
  animateBy?: 'words' | 'characters';
  direction?: 'top' | 'bottom' | 'left' | 'right';
  onAnimationComplete?: () => void;
  className?: string;
}

export function BlurText({
  text,
  delay = 150,
  animateBy = 'words',
  direction = 'top',
  onAnimationComplete,
  className = '',
}: BlurTextProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const getDirectionOffset = () => {
    switch (direction) {
      case 'top':
        return { y: -20 };
      case 'bottom':
        return { y: 20 };
      case 'left':
        return { x: -20 };
      case 'right':
        return { x: 20 };
      default:
        return { y: -20 };
    }
  };

  const elements = animateBy === 'words' ? text.split(' ') : text.split('');

  const container = {
    hidden: { opacity: 0, ...getDirectionOffset() },
    visible: (i = 1) => ({
      opacity: 1,
      ...getDirectionOffset(),
      transition: {
        staggerChildren: delay / 1000,
        delayChildren: (delay / 1000) * i,
      },
    }),
  };

  const child = {
    visible: {
      opacity: 1,
      filter: 'blur(0px)',
      ...getDirectionOffset(),
      y: 0,
      x: 0,
      transition: {
        type: 'spring',
        damping: 12,
        stiffness: 100,
      },
    },
    hidden: {
      opacity: 0,
      filter: 'blur(10px)',
      ...getDirectionOffset(),
      transition: {
        type: 'spring',
        damping: 12,
        stiffness: 100,
      },
    },
  };

  return (
    <motion.div
      style={{ display: 'inline-block' }}
      variants={container}
      initial="hidden"
      animate={isVisible ? 'visible' : 'hidden'}
      onAnimationComplete={onAnimationComplete}
      className={className}
    >
      {elements.map((element, index) => (
        <motion.span
          key={index}
          variants={child}
          style={{ display: 'inline-block', whiteSpace: 'pre' }}
        >
          {element}
          {animateBy === 'words' && index !== elements.length - 1 ? ' ' : ''}
        </motion.span>
      ))}
    </motion.div>
  );
} 