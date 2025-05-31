'use client';

import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

export function NeuralNetBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const nodes: Array<{ x: number; y: number; vx: number; vy: number }> = [];
    const connections: Array<[number, number]> = [];
    let animationFrameId: number;

    // Set canvas size
    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      initNodes();
    };

    // Initialize nodes
    const initNodes = () => {
      nodes.length = 0;
      connections.length = 0;

      // Create nodes
      const numNodes = Math.floor((canvas.width * canvas.height) / 20000);
      for (let i = 0; i < numNodes; i++) {
        nodes.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * 0.3, // 减慢移动速度
          vy: (Math.random() - 0.5) * 0.3,
        });
      }

      // Create connections
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          if (Math.random() < 0.15) { // 增加连接数量
            connections.push([i, j]);
          }
        }
      }
    };

    // Animation loop
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Update node positions
      nodes.forEach(node => {
        node.x += node.vx;
        node.y += node.vy;

        // Bounce off walls with damping
        if (node.x < 0 || node.x > canvas.width) {
          node.vx *= -0.9;
          node.x = Math.max(0, Math.min(node.x, canvas.width));
        }
        if (node.y < 0 || node.y > canvas.height) {
          node.vy *= -0.9;
          node.y = Math.max(0, Math.min(node.y, canvas.height));
        }
      });

      // Draw connections with gradient
      connections.forEach(([i, j]) => {
        const nodeA = nodes[i];
        const nodeB = nodes[j];
        const distance = Math.hypot(nodeA.x - nodeB.x, nodeA.y - nodeB.y);

        if (distance < 200) { // 增加连接距离
          const gradient = ctx.createLinearGradient(
            nodeA.x, nodeA.y, nodeB.x, nodeB.y
          );
          gradient.addColorStop(0, 'rgba(255, 255, 255, 0.15)');
          gradient.addColorStop(1, 'rgba(255, 255, 255, 0.05)');

          ctx.strokeStyle = gradient;
          ctx.lineWidth = Math.max(0.5, 1 - distance / 200);
          ctx.beginPath();
          ctx.moveTo(nodeA.x, nodeA.y);
          ctx.lineTo(nodeB.x, nodeB.y);
          ctx.stroke();
        }
      });

      // Draw nodes with glow effect
      ctx.shadowBlur = 15;
      ctx.shadowColor = 'rgba(255, 255, 255, 0.5)';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';

      nodes.forEach(node => {
        ctx.beginPath();
        ctx.arc(node.x, node.y, 2, 0, Math.PI * 2);
        ctx.fill();
      });

      ctx.shadowBlur = 0;

      animationFrameId = requestAnimationFrame(animate);
    };

    // Initial setup
    resize();
    window.addEventListener('resize', resize);
    animate();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full opacity-20"
    />
  );
}