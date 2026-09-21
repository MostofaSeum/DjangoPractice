"use client";

import React, { useEffect, useRef, useState } from "react";

interface ScrollRevealProps {
  children: React.ReactNode;
  className?: string;
  delayMs?: number;
  direction?: "up" | "down" | "left" | "right" | "none";
}

export default function ScrollReveal({
  children,
  className = "",
  delayMs = 0,
  direction = "up",
}: ScrollRevealProps) {
  const [isVisible, setIsVisible] = useState(false);
  const domRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = domRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(element);
        }
      },
      {
        threshold: 0.12,
        rootMargin: "0px 0px -40px 0px",
      }
    );

    observer.observe(element);

    return () => {
      if (element) observer.unobserve(element);
    };
  }, []);

  const getDirectionClasses = () => {
    switch (direction) {
      case "up":
        return isVisible
          ? "opacity-100 translate-y-0 filter blur-0"
          : "opacity-0 translate-y-8 filter blur-[1px]";
      case "down":
        return isVisible
          ? "opacity-100 translate-y-0 filter blur-0"
          : "opacity-0 -translate-y-8 filter blur-[1px]";
      case "left":
        return isVisible
          ? "opacity-100 translate-x-0 filter blur-0"
          : "opacity-0 translate-x-8 filter blur-[1px]";
      case "right":
        return isVisible
          ? "opacity-100 translate-x-0 filter blur-0"
          : "opacity-0 -translate-x-8 filter blur-[1px]";
      case "none":
        return isVisible ? "opacity-100 scale-100" : "opacity-0 scale-95";
    }
  };

  return (
    <div
      ref={domRef}
      style={{
        transitionDuration: "800ms",
        transitionDelay: `${delayMs}ms`,
        transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
      }}
      className={`transition-all will-change-transform ${getDirectionClasses()} ${className}`}
    >
      {children}
    </div>
  );
}
