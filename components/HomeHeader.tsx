'use client';

import { useState } from 'react';
import ConfettiAnimation from './ConfettiAnimation';

interface HomeHeaderProps {
  todayFormatted: string;
  paperCount: number;
}

export default function HomeHeader({ todayFormatted, paperCount }: HomeHeaderProps) {
  const [triggerConfetti, setTriggerConfetti] = useState<(() => void) | null>(null);

  const handleConfettiClick = () => {
    if (triggerConfetti) {
      triggerConfetti();
    }
  };

  return (
    <>
      <ConfettiAnimation onTrigger={setTriggerConfetti} />

      <header className="text-center mb-8 sm:mb-12">
        <h1 className="font-display text-2xl sm:text-3xl md:text-[2.5rem] font-semibold mb-4 sm:mb-6 text-text-primary">
          🎂 Happy Birthday, Paper! 🎂
        </h1>
        <p className="font-body text-base sm:text-lg text-text-secondary mb-4">
          Celebrating papers published on this day in history ✨
        </p>
        <p className="font-body text-sm sm:text-base uppercase tracking-[0.15em] text-accent mb-4">
          {todayFormatted}
        </p>
        {paperCount > 0 ? (
          <p className="text-sm text-text-muted mb-4">
            {paperCount} {paperCount === 1 ? 'paper shares' : 'papers share'} this birthday
          </p>
        ) : (
          <p className="text-sm text-text-muted mb-4">
            No papers found for today. Run the data ingestion script!
          </p>
        )}

        {/* Confetti Button */}
        <button
          onClick={handleConfettiClick}
          className="mt-2 px-6 py-2 bg-gradient-to-r from-pink-400 to-purple-500 text-white rounded-full font-medium shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200 active:scale-95"
        >
          🎉 More Confetti!
        </button>
      </header>
    </>
  );
}
