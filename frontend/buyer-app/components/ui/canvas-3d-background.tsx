"use client";

import React, { useEffect, useRef, useState } from "react";

interface Node3D {
  x: number;
  y: number;
  z: number;
  ox: number; // original coordinates
  oy: number;
  oz: number;
}

interface Canvas3DBackgroundProps {
  accent?: "emerald" | "cyan" | "purple" | "none";
  centerX?: number;
  centerY?: number;
}

export function Canvas3DBackground({ accent = "none", centerX = 0.5, centerY = 0.5 }: Canvas3DBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: 0, y: 0, tx: 0, ty: 0, cx: -1000, cy: -1000 });
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    // Check user preference for reduced motion
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mediaQuery.matches);
    const handleMotionChange = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener("change", handleMotionChange);

    return () => {
      mediaQuery.removeEventListener("change", handleMotionChange);
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // Track mouse coordinates
    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current.tx = (e.clientX - width * centerX) * 0.12;
      mouseRef.current.ty = (e.clientY - height * centerY) * 0.12;
      mouseRef.current.cx = e.clientX - rect.left;
      mouseRef.current.cy = e.clientY - rect.top;
    };

    const handleMouseLeave = () => {
      mouseRef.current.cx = -1000;
      mouseRef.current.cy = -1000;
    };

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseleave", handleMouseLeave);
    window.addEventListener("resize", handleResize);

    // Generate 3D grid nodes
    const nodes: Node3D[] = [];
    const count = 45; // slightly increased node density for better structure

    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      const r = 180 + Math.random() * 140;

      const x = r * Math.sin(phi) * Math.cos(theta);
      const y = r * Math.sin(phi) * Math.sin(theta);
      const z = r * Math.cos(phi);

      nodes.push({ x, y, z, ox: x, oy: y, oz: z });
    }

    const fov = 380; // Field of View projection distance
    let angleX = 0.0006; // slower, more premium drift
    let angleY = 0.0008;

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Smooth mouse input interpolations
      const mouse = mouseRef.current;
      mouse.x += (mouse.tx - mouse.x) * 0.06;
      mouse.y += (mouse.ty - mouse.y) * 0.06;

      // Base rotations + mouse influence
      // If prefersReducedMotion is true, rotation angle remains 0
      const radX = prefersReducedMotion ? 0 : angleX + mouse.y * 0.00015;
      const radY = prefersReducedMotion ? 0 : angleY + mouse.x * 0.00015;

      const cosX = Math.cos(radX);
      const sinX = Math.sin(radX);
      const cosY = Math.cos(radY);
      const sinY = Math.sin(radY);

      interface ProjectedNode {
        x: number;
        y: number;
        scale: number;
        pullX: number;
        pullY: number;
        distToMouse: number;
      }

      const projected: ProjectedNode[] = [];

      nodes.forEach((node) => {
        let x1 = node.ox;
        let y2 = node.oy;
        let z2 = node.oz;

        if (!prefersReducedMotion) {
          // Rotate around Y axis
          x1 = node.ox * cosY - node.oz * sinY;
          const z1 = node.ox * sinY + node.oz * cosY;

          // Rotate around X axis
          y2 = node.oy * cosX - z1 * sinX;
          z2 = node.oy * sinX + z1 * cosX;

          // Save rotated states back
          node.ox = x1;
          node.oy = y2;
          node.oz = z2;
        }

        // Depth perspective projection calculation
        const scale = fov / (fov + z2 + 200);
        const projX = x1 * scale + width * centerX;
        const projY = y2 * scale + height * centerY;

        // Calculate magnetic physics pull (dodging/attraction)
        let pullX = 0;
        let pullY = 0;
        let distToMouse = 9999;

        if (mouse.cx !== -1000) {
          const dx = projX - mouse.cx;
          const dy = projY - mouse.cy;
          distToMouse = Math.sqrt(dx * dx + dy * dy);

          const maxDist = 200;
          if (distToMouse < maxDist && !prefersReducedMotion) {
            // Spring/physics force: pulling closer on hover
            const force = (1 - distToMouse / maxDist) * 15; 
            pullX = (dx / distToMouse) * force * -0.5; // pull toward cursor
            pullY = (dy / distToMouse) * force * -0.5;
          }
        }

        projected.push({ x: projX, y: projY, scale, pullX, pullY, distToMouse });
      });

      // Connect nodes dynamically based on distance thresholds
      for (let i = 0; i < projected.length; i++) {
        for (let j = i + 1; j < projected.length; j++) {
          const p1 = projected[i];
          const p2 = projected[j];

          const p1x = p1.x + p1.pullX;
          const p1y = p1.y + p1.pullY;
          const p2x = p2.x + p2.pullX;
          const p2y = p2.y + p2.pullY;

          const dx = p1x - p2x;
          const dy = p1y - p2y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 160) {
            ctx.beginPath();
            ctx.moveTo(p1x, p1y);
            ctx.lineTo(p2x, p2y);

            const opacity = Math.max(0, 0.28 - dist / 160);
            const minDistMouse = Math.min(p1.distToMouse, p2.distToMouse);

            if (accent !== "none" && minDistMouse < 180) {
              const blend = (1 - minDistMouse / 180) * 0.8;
              let targetR = 6, targetG = 182, targetB = 212; // default cyan
              if (accent === "emerald") {
                targetR = 16; targetG = 185; targetB = 129;
              } else if (accent === "purple") {
                targetR = 168; targetG = 85; targetB = 247;
              }
              const r = Math.round(63 + (targetR - 63) * blend);
              const g = Math.round(63 + (targetG - 63) * blend);
              const b = Math.round(70 + (targetB - 70) * blend);
              ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${opacity + blend * 0.2})`;
            } else {
              ctx.strokeStyle = `rgba(63, 63, 70, ${opacity})`;
            }

            ctx.lineWidth = 0.65;
            ctx.stroke();
          }
        }
      }

      // Draw node dots
      projected.forEach((p) => {
        ctx.beginPath();
        const finalX = p.x + p.pullX;
        const finalY = p.y + p.pullY;
        const baseRadius = Math.max(1, p.scale * 2.2);
        
        let radius = baseRadius;
        if (p.distToMouse < 150) {
          const scaleFactor = 1 + (1 - p.distToMouse / 150) * 0.8;
          radius = baseRadius * scaleFactor;
        }

        ctx.arc(finalX, finalY, radius, 0, Math.PI * 2);

        const baseOpacity = Math.min(1, p.scale * 0.7);
        if (accent !== "none" && p.distToMouse < 150) {
          const blend = (1 - p.distToMouse / 150);
          let targetR = 6, targetG = 182, targetB = 212; // default cyan
          if (accent === "emerald") {
            targetR = 16; targetG = 185; targetB = 129;
          } else if (accent === "purple") {
            targetR = 168; targetG = 85; targetB = 247;
          }
          const r = Math.round(244 + (targetR - 244) * blend);
          const g = Math.round(244 + (targetG - 244) * blend);
          const b = Math.round(245 + (targetB - 245) * blend);
          ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${baseOpacity + blend * 0.3})`;
        } else {
          ctx.fillStyle = `rgba(244, 244, 245, ${baseOpacity})`;
        }
        ctx.fill();
      });

      if (!prefersReducedMotion) {
        animationId = requestAnimationFrame(render);
      }
    };

    render();

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseleave", handleMouseLeave);
      window.removeEventListener("resize", handleResize);
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [accent, prefersReducedMotion, centerX, centerY]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full bg-zinc-950 pointer-events-none z-0"
    />
  );
}
