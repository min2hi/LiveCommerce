"use client";
import React, { useRef } from "react";
import {
  motion,
  useAnimationFrame,
  useMotionTemplate,
  useMotionValue,
  useTransform,
} from "motion/react";
import { cn } from "@/lib/utils";

export function MovingBorder({
  children,
  duration = 4,
  borderRadius = "1rem",
  className,
  containerClassName,
  borderClassName,
  as: Component = "div",
  ...otherProps
}: {
  children: React.ReactNode;
  duration?: number;
  borderRadius?: string;
  className?: string;
  containerClassName?: string;
  borderClassName?: string;
  as?: React.ElementType;
  [key: string]: unknown;
}) {
  // Convert seconds to milliseconds if needed (for backward compatibility)
  const durationInMs = duration < 100 ? duration * 1000 : duration;

  return (
    <Component
      className={cn(
        "bg-transparent relative p-[1px] overflow-hidden",
        containerClassName
      )}
      style={{
        borderRadius: borderRadius,
      }}
      {...otherProps}
    >
      <div
        className="absolute inset-0"
        style={{ borderRadius: `calc(${borderRadius} * 0.96)` }}
      >
        <MovingBorderSvg duration={durationInMs} rx="30%" ry="30%">
          <div
            className={cn(
              "h-32 w-32 opacity-[0.8] bg-[radial-gradient(#06b6d4_40%,transparent_60%)]",
              borderClassName
            )}
          />
        </MovingBorderSvg>
      </div>

      <div
        className={cn(
          "relative bg-[#0d0f14]/80 backdrop-blur-xl flex items-center justify-center w-full h-full",
          className
        )}
        style={{
          borderRadius: `calc(${borderRadius} * 0.96)`,
        }}
      >
        {children}
      </div>
    </Component>
  );
}

export const MovingBorderSvg = ({
  children,
  duration = 2000,
  rx,
  ry,
  ...otherProps
}: {
  children: React.ReactNode;
  duration?: number;
  rx?: string;
  ry?: string;
  [key: string]: unknown;
}) => {
  const pathRef = useRef<SVGRectElement>(null);
  const progress = useMotionValue<number>(0);

  useAnimationFrame((time) => {
    const length = pathRef.current?.getTotalLength();
    if (length) {
      const pxPerMillisecond = length / duration;
      progress.set((time * pxPerMillisecond) % length);
    }
  });

  const x = useTransform(
    progress,
    (val) => {
      if (!pathRef.current) return 0;
      try {
        return pathRef.current.getPointAtLength(val)?.x ?? 0;
      } catch (e) {
        return 0;
      }
    }
  );
  const y = useTransform(
    progress,
    (val) => {
      if (!pathRef.current) return 0;
      try {
        return pathRef.current.getPointAtLength(val)?.y ?? 0;
      } catch (e) {
        return 0;
      }
    }
  );

  const transform = useMotionTemplate`translateX(${x}px) translateY(${y}px) translateX(-50%) translateY(-50%)`;

  return (
    <>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="none"
        className="absolute h-full w-full"
        width="100%"
        height="100%"
        {...otherProps}
      >
        <rect
          fill="none"
          width="100%"
          height="100%"
          rx={rx}
          ry={ry}
          ref={pathRef}
        />
      </svg>
      <motion.div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          display: "inline-block",
          transform,
        }}
      >
        {children}
      </motion.div>
    </>
  );
};
