"use client";

import React, { useState, useEffect } from 'react';

interface CSSParticlesProps {
  particleCount?: number;
  className?: string;
}

interface Particle {
  id: number;
  size: number;
  left: number;
  animationDuration: number;
  animationDelay: number;
  opacity: number;
}

const CSSParticles: React.FC<CSSParticlesProps> = ({ 
  particleCount = 100,
  className = ''
}) => {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    const generatedParticles = Array.from({ length: particleCount }, (_, i) => {
      const size = Math.random() * 3 + 1;
      const left = Math.random() * 100;
      const animationDuration = Math.random() * 20 + 10;
      const animationDelay = Math.random() * -20;
      const opacity = Math.random() * 0.5 + 0.3;

      return {
        id: i,
        size,
        left,
        animationDuration,
        animationDelay,
        opacity,
      };
    });
    setParticles(generatedParticles);
  }, [particleCount]);

  const particleElements = particles.map((particle) => (
    <div
      key={particle.id}
      className="absolute rounded-full bg-gradient-to-r from-violet-500 via-purple-500 to-violet-400"
      style={{
        width: `${particle.size}px`,
        height: `${particle.size}px`,
        left: `${particle.left}%`,
        top: `-${particle.size}px`,
        opacity: particle.opacity,
        animation: `float ${particle.animationDuration}s linear ${particle.animationDelay}s infinite`,
        boxShadow: `0 0 ${particle.size * 2}px rgba(139, 92, 246, 0.5)`,
      }}
    />
  ));

  return (
    <>
      <style jsx global>{`
        @keyframes float {
          0% {
            transform: translateY(0) translateX(0);
          }
          50% {
            transform: translateY(50vh) translateX(20px);
          }
          100% {
            transform: translateY(100vh) translateX(0);
          }
        }
      `}</style>
      <div className={`absolute inset-0 overflow-hidden ${className}`}>
        {particleElements}
      </div>
    </>
  );
};

export default CSSParticles;
