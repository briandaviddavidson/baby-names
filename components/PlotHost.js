'use client';

import { useId } from 'react';

// The element a Plot chart renders into. It is a single Tab stop; the hidden help text
// explains the keys, and the live region reads out the focused mark (see plotKeyboard.js).
export default function PlotHost({ hostRef, label, help, className = '' }) {
  const helpId = useId();
  return (
    <div className="plot-host">
      <div
        ref={hostRef}
        className={`plot ${className}`}
        tabIndex={0}
        role="application"
        aria-roledescription="interactive chart"
        aria-label={label}
        aria-describedby={helpId}
      />
      <p id={helpId} className="visually-hidden">
        {help}
      </p>
      <p className="visually-hidden" aria-live="polite" data-live="" />
    </div>
  );
}
