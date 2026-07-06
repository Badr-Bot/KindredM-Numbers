"use client";

import { useEffect, useState } from "react";

/** Horloge Europe/Paris, mise à jour chaque seconde. */
export function Clock() {
  const [time, setTime] = useState<string>("--:--:--");

  useEffect(() => {
    const fmt = new Intl.DateTimeFormat("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      timeZone: "Europe/Paris",
    });
    const update = () => setTime(fmt.format(new Date()));
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <span className="tnum text-ink-dim" suppressHydrationWarning>
      {time} <span className="text-ink-faint">CET</span>
    </span>
  );
}
