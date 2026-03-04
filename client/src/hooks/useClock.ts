import { useEffect, useMemo, useState } from 'react';
import { getOrdinalSuffix } from '../utils/moduleHelpers';

export default function useClock() {
  const [currentDateTime, setCurrentDateTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formattedDateTime = useMemo(() => {
    const weekday = currentDateTime.toLocaleDateString(undefined, { weekday: 'long' });
    const month = currentDateTime.toLocaleDateString(undefined, { month: 'long' });
    const day = currentDateTime.getDate();
    const time = currentDateTime
      .toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
      .toLowerCase();
    return `${weekday}, ${month} ${day}${getOrdinalSuffix(day)}, ${time}`;
  }, [currentDateTime]);

  return { currentDateTime, formattedDateTime };
}
