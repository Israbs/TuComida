"use client";

import { useEffect, useState } from "react";
import { relativeTime } from "@/lib/dashboard";

export function RelativeTime({ date }: { date: Date }) {
  const [label, setLabel] = useState<string | null>(null);

  useEffect(() => {
    const update = () => setLabel(relativeTime(date));
    update();
    const t = setInterval(update, 30_000);
    return () => clearInterval(t);
  }, [date]);

  return <>{label ?? "\u00A0"}</>;
}