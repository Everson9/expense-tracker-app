import React, { useEffect, useRef, useState } from 'react';
import { Text, TextStyle } from 'react-native';

interface Props {
  value: number;
  style?: TextStyle | TextStyle[];
  color?: string;
  animate?: boolean;
  showSign?: boolean;
  duration?: number;
}

function formatBRL(v: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

export default function AmountText({
  value,
  style,
  color,
  animate = true,
  showSign = false,
  duration = 650,
}: Props) {
  const [display, setDisplay] = useState(animate ? 0 : value);
  const rafRef = useRef<number | null>(null);
  const prevValueRef = useRef(animate ? 0 : value);

  useEffect(() => {
    if (!animate) {
      setDisplay(value);
      prevValueRef.current = value;
      return;
    }
    const startVal = prevValueRef.current;
    const endVal = value;
    const startTime = Date.now();

    const tick = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = easeOutCubic(progress);
      setDisplay(startVal + (endVal - startVal) * eased);
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        prevValueRef.current = endVal;
      }
    };

    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(tick);

    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [value, animate, duration]);

  const sign = showSign && display >= 0 ? '+' : '';
  const text = sign + formatBRL(display);

  const flatStyle: TextStyle = {
    fontVariant: ['tabular-nums'],
    ...(color ? { color } : {}),
    ...(Array.isArray(style) ? Object.assign({}, ...style) : style),
  };

  return <Text style={flatStyle}>{text}</Text>;
}
