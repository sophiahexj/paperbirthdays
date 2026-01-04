'use client';

import { useEffect, useState, useCallback } from 'react';

interface ConfettiPiece {
  id: string;
  left: number;
  delay: number;
  duration: number;
  color: string;
  shape: 'circle' | 'square' | 'triangle' | 'ribbon';
  rotation: number;
}

interface ConfettiAnimationProps {
  onTrigger?: (triggerFn: () => void) => void;
}

export default function ConfettiAnimation({ onTrigger }: ConfettiAnimationProps) {
  const [confettiPieces, setConfettiPieces] = useState<ConfettiPiece[]>([]);

  const confettiTypes = [
    {
      name: 'classic',
      colors: ['#FF6B9D', '#C44569', '#FFA07A', '#FFD93D', '#6BCF7F', '#4ECDC4', '#95E1D3'],
      shapes: ['circle', 'square', 'triangle'] as const,
    },
    {
      name: 'rainbow',
      colors: ['#FF0000', '#FF7F00', '#FFFF00', '#00FF00', '#0000FF', '#4B0082', '#9400D3'],
      shapes: ['ribbon', 'square', 'circle'] as const,
    },
    {
      name: 'party',
      colors: ['#FFD700', '#FF69B4', '#00CED1', '#FF1493', '#32CD32', '#FF4500'],
      shapes: ['circle', 'triangle', 'square', 'ribbon'] as const,
    },
  ];

  const createConfetti = useCallback(() => {
    const type = confettiTypes[Math.floor(Math.random() * confettiTypes.length)];
    const pieces: ConfettiPiece[] = Array.from({ length: 60 }, (_, i) => ({
      id: `${Date.now()}-${i}`,
      left: Math.random() * 100,
      delay: Math.random() * 0.3,
      duration: 2 + Math.random() * 1.5,
      color: type.colors[Math.floor(Math.random() * type.colors.length)],
      shape: type.shapes[Math.floor(Math.random() * type.shapes.length)],
      rotation: Math.random() * 360,
    }));

    setConfettiPieces((prev) => [...prev, ...pieces]);

    // Clean up after animation
    setTimeout(() => {
      setConfettiPieces((prev) => prev.filter((p) => !pieces.find((piece) => piece.id === p.id)));
    }, 4000);
  }, []);

  useEffect(() => {
    // Trigger confetti animation on mount
    createConfetti();

    // Expose trigger function to parent
    if (onTrigger) {
      onTrigger(createConfetti);
    }
  }, [onTrigger, createConfetti]);

  if (confettiPieces.length === 0) return null;

  const getShapeStyle = (shape: string) => {
    switch (shape) {
      case 'circle':
        return 'rounded-full';
      case 'square':
        return 'rounded-none';
      case 'triangle':
        return 'triangle';
      case 'ribbon':
        return 'ribbon';
      default:
        return 'rounded-full';
    }
  };

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {confettiPieces.map((piece) => (
        <div
          key={piece.id}
          className={`absolute animate-confetti-fall ${getShapeStyle(piece.shape)}`}
          style={{
            left: `${piece.left}%`,
            top: '-10px',
            backgroundColor: piece.shape === 'triangle' ? 'transparent' : piece.color,
            borderLeft: piece.shape === 'triangle' ? '6px solid transparent' : undefined,
            borderRight: piece.shape === 'triangle' ? '6px solid transparent' : undefined,
            borderBottom: piece.shape === 'triangle' ? `10px solid ${piece.color}` : undefined,
            width: piece.shape === 'ribbon' ? '3px' : piece.shape === 'triangle' ? '0' : '8px',
            height: piece.shape === 'ribbon' ? '12px' : piece.shape === 'triangle' ? '0' : '8px',
            animationDelay: `${piece.delay}s`,
            animationDuration: `${piece.duration}s`,
            transform: `rotate(${piece.rotation}deg)`,
          }}
        />
      ))}

      <style jsx>{`
        @keyframes confetti-fall {
          0% {
            transform: translateY(0) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
          }
        }

        .animate-confetti-fall {
          animation: confetti-fall linear forwards;
        }

        .triangle {
          width: 0;
          height: 0;
        }

        .ribbon {
          border-radius: 2px;
        }
      `}</style>
    </div>
  );
}
