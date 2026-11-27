/**
 * Mounted once (in RootLayout). Doodles reference it with `filter: url(#hand-drawn)` so
 * their perfectly-even vector strokes pick up a slight, pencil-like wobble.
 */
const HandDrawnFilter: React.FC = () => (
  <svg width="0" height="0" aria-hidden="true" focusable="false" className="absolute">
    <filter id="hand-drawn" x="-5%" y="-5%" width="110%" height="110%">
      <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="2" seed="7" />
      <feDisplacementMap in="SourceGraphic" scale="2.2" />
    </filter>
  </svg>
);

export default HandDrawnFilter;
