import { useEffect, useState } from 'react';

export type TimeOfDay = 'morning' | 'day' | 'dusk' | 'night';

export function timeOfDayFor(hour: number): TimeOfDay {
  if (hour >= 5 && hour < 10) return 'morning';
  if (hour >= 10 && hour < 17) return 'day';
  if (hour >= 17 && hour < 20) return 'dusk';
  return 'night';
}

/** The visitor's local time of day, re-checked every few minutes. */
export function useTimeOfDay(): TimeOfDay {
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>(() => timeOfDayFor(new Date().getHours()));

  useEffect(() => {
    const id = window.setInterval(
      () => setTimeOfDay(timeOfDayFor(new Date().getHours())),
      5 * 60 * 1000
    );
    return () => window.clearInterval(id);
  }, []);

  return timeOfDay;
}
