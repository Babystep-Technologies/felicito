import { createContext, useContext, useEffect, useMemo } from 'react';
import {
  motionValue,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
  type MotionValue,
} from 'motion/react';
import * as motion from 'motion/react-client';

/*
 * A gentle, shared sense of where the visitor's pointer is, so a scene can react to it:
 * clouds drift a little, grass leans, a bird looks over. `x` and `y` run from -1 to 1
 * across the viewport and are spring-smoothed, so nothing snaps.
 *
 * Off for touch screens (there is no hovering pointer to follow) and for visitors who ask
 * for reduced motion; the values then simply stay at 0 and every doodle sits still.
 */

interface PointerValues {
  x: MotionValue<number>;
  y: MotionValue<number>;
}

// Outside a PointerScene, doodles get still values and render exactly as before.
const STILL: PointerValues = { x: motionValue(0), y: motionValue(0) };
const PointerContext = createContext<PointerValues>(STILL);

export const usePointer = () => useContext(PointerContext);

export const PointerScene: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const reduceMotion = useReducedMotion();
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  // Soft and slightly lazy, like something carried on a breeze.
  const x = useSpring(rawX, { stiffness: 40, damping: 14, mass: 0.8 });
  const y = useSpring(rawY, { stiffness: 40, damping: 14, mass: 0.8 });

  useEffect(() => {
    if (reduceMotion) return;
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

    const onMove = (event: PointerEvent) => {
      rawX.set((event.clientX / window.innerWidth) * 2 - 1);
      rawY.set((event.clientY / window.innerHeight) * 2 - 1);
    };
    // Drift home when the pointer leaves the window.
    const onLeave = () => {
      rawX.set(0);
      rawY.set(0);
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    document.documentElement.addEventListener('pointerleave', onLeave);
    return () => {
      window.removeEventListener('pointermove', onMove);
      document.documentElement.removeEventListener('pointerleave', onLeave);
    };
  }, [reduceMotion, rawX, rawY]);

  const value = useMemo(() => ({ x, y }), [x, y]);
  return <PointerContext.Provider value={value}>{children}</PointerContext.Provider>;
};

/**
 * Moves its children with the pointer. `depth` is how near the layer feels: near things
 * move more. Positive depth follows the pointer; negative drifts the other way (far
 * away, parallax). `tilt` adds a matching lean in degrees.
 */
export const Parallax: React.FC<{
  depth: number;
  tilt?: number;
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
}> = ({ depth, tilt = 0, className, style, children }) => {
  const { x, y } = usePointer();
  const tx = useTransform(x, v => v * depth * 24);
  const ty = useTransform(y, v => v * depth * 12);
  const rotate = useTransform(x, v => v * tilt);
  return (
    <motion.div className={className} style={{ ...style, x: tx, y: ty, rotate }}>
      {children}
    </motion.div>
  );
};
