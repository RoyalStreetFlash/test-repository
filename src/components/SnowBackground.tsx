"use client";

import React, { useEffect, useState } from 'react';

interface SnowflakeProps {
  id: number;
  left: string;
  fontSize: string;
  fallDelay: string;
  fallDuration: string;
  shakeDelay: string;
  shakeDuration: string;
}

export default function SnowBackground() {
  const [snowflakes, setSnowflakes] = useState<SnowflakeProps[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    const flakes = Array.from({ length: 30 }).map((_, i) => {
      return { 
        id: i, 
        left: Math.random() * 100 + '%',
        fontSize: (Math.random() * 1 + 0.8) + 'em',
        fallDelay: (Math.random() * 10) + 's',
        fallDuration: (Math.random() * 10 + 10) + 's',
        shakeDelay: (Math.random() * 3) + 's',
        shakeDuration: (Math.random() * 2 + 3) + 's'
      };
    });
    setSnowflakes(flakes);
  }, []);

  if (!mounted) return null;

  return (
    <div className="snow-layer" aria-hidden="true">
      {snowflakes.map((flake) => (
        <div
          key={flake.id}
          className="snowflake"
          style={{
            left: flake.left,
            fontSize: flake.fontSize,
            animationDelay: flake.shakeDelay,
            animationDuration: flake.shakeDuration,
          }}
        >
          <div 
            className="inner"
            style={{
              animationDelay: flake.fallDelay,
              animationDuration: flake.fallDuration,
            }}
          >
            ❅
          </div>
        </div>
      ))}

      {/* 積雪領域を追加 */}
      <div className="snow-ground" />
    </div>
  );
}