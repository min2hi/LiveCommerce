"use client";

import React, { useRef } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "motion/react";

interface Card3DHoverProps {
  children: React.ReactNode;
  className?: string;
}

export function Card3DHover({ children, className }: Card3DHoverProps) {
  const ref = useRef<HTMLDivElement>(null);

  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // Soft elastic spring motion physics
  const springX = useSpring(x, { damping: 25, stiffness: 200, mass: 0.5 });
  const springY = useSpring(y, { damping: 25, stiffness: 200, mass: 0.5 });

  // Map coordinate offsets to subtle degrees of rotation (max 12 deg)
  const rotateX = useTransform(springY, [-0.5, 0.5], [12, -12]);
  const rotateY = useTransform(springX, [-0.5, 0.5], [-12, 12]);

  // Shiny glaze reflection gradient position maps
  const shineX = useTransform(springX, [-0.5, 0.5], ["0%", "100%"]);
  const shineY = useTransform(springY, [-0.5, 0.5], ["0%", "100%"]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    
    // Relative coordinates between -0.5 and 0.5
    const posX = (e.clientX - rect.left) / rect.width - 0.5;
    const posY = (e.clientY - rect.top) / rect.height - 0.5;
    
    x.set(posX);
    y.set(posY);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX,
        rotateY,
        transformStyle: "preserve-3d",
      }}
      className={`relative rounded-2xl overflow-hidden cursor-pointer select-none ${className || ""}`}
    >
      {/* 3D reflection highlight overlay */}
      <motion.div
        className="absolute inset-0 z-10 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{
          background: `radial-gradient(circle 250px at ${shineX} ${shineY}, rgba(255,255,255,0.08), transparent)`,
        }}
      />
      
      {/* Content wrapper with depth translation */}
      <div style={{ transform: "translateZ(30px)" }} className="relative z-0 h-full w-full">
        {children}
      </div>
    </motion.div>
  );
}
