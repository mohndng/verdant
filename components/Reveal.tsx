import React, { useRef, useEffect, useState } from 'react';

interface RevealProps {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  width?: 'full' | 'auto';
}

export const Reveal: React.FC<RevealProps> = ({ children, delay = 0, className = '', width = 'full' }) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { 
        // Trigger as soon as 5% of the element is visible, or immediately if large
        threshold: 0.05,
        rootMargin: "0px 0px 0px 0px" 
      }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, []);

  // Inline styles for dynamic delay
  const style = {
    transitionDelay: `${delay}ms`,
    willChange: 'opacity, transform'
  };

  return (
    <div
      ref={ref}
      style={style}
      className={`transform transition-all duration-700 ease-out ${
        isVisible 
          ? 'opacity-100 translate-y-0' 
          : 'opacity-0 translate-y-8'
      } ${width === 'full' ? 'w-full' : 'w-auto'} ${className}`}
    >
      {children}
    </div>
  );
};