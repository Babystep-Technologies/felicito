import { useEffect, useRef, useState } from 'react';
import * as motion from 'motion/react-client';
import { useReducedMotion } from 'motion/react';

interface RevealProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
  once?: boolean;
}

const Reveal: React.FC<RevealProps> = ({
  children,
  className = '',
  delay = 0,
  duration = 0.6,
  once = true,
}) => {
  const ref = useRef<HTMLDivElement | null>(null);
  const reduceMotion = useReducedMotion();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (once) observer.disconnect();
        } else if (!once) {
          setIsVisible(false);
        }
      },
      {
        threshold: 0.2,
      }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [once]);

  return (
    <motion.div
      ref={ref}
      // A soft, springy pop: rises a little, overshoots a touch, settles.
      initial={reduceMotion ? false : { opacity: 0, y: 28, scale: 0.98 }}
      animate={isVisible || reduceMotion ? { opacity: 1, y: 0, scale: 1 } : undefined}
      transition={{
        type: 'spring',
        stiffness: 170,
        damping: 18,
        mass: 0.9,
        delay,
        opacity: { duration: duration * 0.6, delay },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

export default Reveal;
