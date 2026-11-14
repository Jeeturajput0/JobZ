"use client";

import { useEffect, useRef, useState } from "react";
import { useInView, useReducedMotion } from "framer-motion";

export function CountUp({ value }: { value: string }) {
  const ref = useRef<HTMLElement | null>(null);
  const inView = useInView(ref, { once: true, amount: 0.5 });
  const reduceMotion = useReducedMotion();
  const [display, setDisplay] = useState(value);
  const match = value.match(/^([^\d]*)([\d,.]+)(.*)$/);

  useEffect(() => {
    if (reduceMotion || !inView || !match) {
      setDisplay(value);
      return;
    }

    const [, prefix, numeric, suffix] = match;
    const target = Number(numeric.replace(/,/g, ""));
    const decimals = numeric.split(".")[1]?.length ?? 0;
    let startedAt = 0;
    let frame = 0;

    const format = (number: number) =>
      decimals
        ? number.toLocaleString("en-US", {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals,
          })
        : Math.round(number).toLocaleString("en-US");

    setDisplay(`${prefix}${format(0)}${suffix}`);
    const tick = (time: number) => {
      if (!startedAt) startedAt = time;
      const progress = Math.min(1, (time - startedAt) / 700);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(
        progress === 1 ? value : `${prefix}${format(target * eased)}${suffix}`,
      );
      if (progress < 1) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [inView, match?.[0], reduceMotion, value]);

  return <strong ref={(element) => { ref.current = element; }}>{display}</strong>;
}
