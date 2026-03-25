"use client";

import { useState, useEffect, useRef } from "react";

export default function AnimatedCounter30() {
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting && !started) setStarted(true); },
      { threshold: 0.5 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [started]);

  useEffect(() => {
    if (!started) return;
    let current = 0;
    const duration = 1200;
    const steps = 30;
    const interval = duration / steps;
    const timer = setInterval(() => {
      current++;
      setCount(current);
      if (current >= 30) clearInterval(timer);
    }, interval);
    return () => clearInterval(timer);
  }, [started]);

  return (
    <span ref={ref} className="tabular-nums">
      {count}s
    </span>
  );
}
