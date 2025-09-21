'use client'

import { useState, useEffect } from 'react';
import { getAvailableMonths, getMonthLabel } from '@/lib/climateData';

interface TimelineProps {
  onChange: (monthKey: string) => void;
}

export default function Timeline({ onChange }: TimelineProps) {
  const [months, setMonths] = useState<string[]>([]);
  const [index, setIndex] = useState(0);

  // Load the available months on mount and default to the latest month
  useEffect(() => {
    async function init() {
      const m = await getAvailableMonths();
      if (m.length > 0) {
        setMonths(m);
        const last = m.length - 1;
        setIndex(last);
        onChange(m[last]); // Immediately load the most recent month
      }
    }
    init();
  }, [onChange]);

  // Update the selected month when the slider changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const idx = parseInt(e.target.value, 10);
    setIndex(idx);
    onChange(months[idx]);
  };

  // If no months are available, render nothing
  if (months.length === 0) return null;

  return (
    <div className="absolute bottom-0 left-0 right-0 flex flex-col items-center px-4 py-2 bg-white bg-opacity-80 backdrop-blur-md">
      <input
        type="range"
        min={0}
        max={months.length - 1}
        value={index}
        onChange={handleChange}
        className="w-full"
      />
      <span className="mt-1 text-sm font-medium">
        {getMonthLabel(months[index])}
      </span>
    </div>
  );
}
