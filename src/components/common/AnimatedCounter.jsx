import React, { useState, useEffect, useRef } from 'react';

/**
 * AnimatedCounter
 * Smoothly animates numeric transitions using requestAnimationFrame and easeOutQuad
 */
export const AnimatedCounter = ({
  value = 0,
  duration = 500,
  prefix = '',
  suffix = '',
  decimals = 0,
  className = '',
  style = {}
}) => {
  const [displayValue, setDisplayValue] = useState(Number(value) || 0);
  const prevValueRef = useRef(Number(value) || 0);

  useEffect(() => {
    const startVal = prevValueRef.current;
    const endVal = Number(value) || 0;
    prevValueRef.current = endVal;

    if (startVal === endVal) {
      setDisplayValue(endVal);
      return;
    }

    const startTime = performance.now();

    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // easeOutQuad
      const eased = progress * (2 - progress);
      const current = startVal + (endVal - startVal) * eased;

      setDisplayValue(current);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setDisplayValue(endVal);
      }
    };

    const frameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameId);
  }, [value, duration]);

  const formatted = decimals > 0
    ? displayValue.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
    : Math.round(displayValue).toLocaleString('en-US');

  return (
    <span className={className} style={{ display: 'inline-block', fontVariantNumeric: 'tabular-nums', ...style }}>
      {prefix}{formatted}{suffix}
    </span>
  );
};
