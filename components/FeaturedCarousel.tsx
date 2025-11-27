
import React, { useState, useEffect, useRef } from 'react';
import { SpeciesData } from '../types';

interface FeaturedCarouselProps {
  items: SpeciesData[];
  onSelect: (item: SpeciesData) => void;
}

export const FeaturedCarousel: React.FC<FeaturedCarouselProps> = ({ items, onSelect }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-advance
  useEffect(() => {
    if (isHovered || items.length <= 1) return;
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % items.length);
    }, 2000); // 2 seconds
    return () => clearInterval(interval);
  }, [isHovered, items.length]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    setIsHovered(true);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX.current - touchEndX;

    // Swipe threshold
    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        // Swipe Left -> Next
        setActiveIndex((prev) => (prev + 1) % items.length);
      } else {
        // Swipe Right -> Prev
        setActiveIndex((prev) => (prev - 1 + items.length) % items.length);
      }
    }
    touchStartX.current = null;
    setIsHovered(false);
  };

  if (items.length === 0) return null;

  return (
    <div 
        className="relative w-full max-w-6xl mx-auto h-[450px] md:h-[550px] flex items-center justify-center perspective-1000 mb-12 select-none"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        ref={containerRef}
    >
      {/* Cards Container */}
      <div className="relative w-full h-full flex items-center justify-center z-10 py-4">
        {items.map((item, i) => {
          // Wrap-around logic
          const length = items.length;
          let offset = (i - activeIndex);
          if (offset > length / 2) offset -= length;
          if (offset < -length / 2) offset += length;

          const isActive = offset === 0;
          const isVisible = Math.abs(offset) <= 2; 

          if (!isVisible) return null;

          // Styles
          const translateX = offset * 60; 
          const scale = isActive ? 1 : 0.8;
          const opacity = isActive ? 1 : 0.3;
          const zIndex = isActive ? 50 : 40 - Math.abs(offset);
          const rotateY = offset * -15; // Keep 3D rotation for the "box" feel

          return (
            <div
              key={i}
              className="absolute w-[80%] md:w-[60%] aspect-[16/9] transition-all duration-700 ease-[cubic-bezier(0.25,0.8,0.25,1)] cursor-pointer origin-center"
              style={{
                transform: `translateX(${translateX}%) scale(${scale}) perspective(1000px) rotateY(${rotateY}deg)`,
                opacity: opacity,
                zIndex: zIndex,
              }}
              onClick={() => offset === 0 ? onSelect(item) : setActiveIndex(i)}
            >
              <div className="w-full h-full rounded-[2rem] overflow-hidden shadow-2xl shadow-stone-900/10 border border-stone-200 bg-white relative">
                  {/* Image */}
                  <div className="absolute inset-0 bg-stone-200">
                     {item.imageUrl ? (
                         <img src={item.imageUrl} alt={item.commonName} className="w-full h-full object-cover" draggable={false} />
                     ) : (
                         <div className="w-full h-full flex items-center justify-center text-stone-300 text-4xl font-serif">
                             {item.commonName[0]}
                         </div>
                     )}
                     <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-80"></div>
                  </div>

                  {/* Content (Visible only on active) */}
                  <div className={`absolute bottom-0 left-0 p-6 md:p-10 w-full transition-opacity duration-500 ${isActive ? 'opacity-100' : 'opacity-0'}`}>
                       <div className="flex gap-2 mb-3">
                           <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-white text-[10px] font-bold uppercase tracking-widest border border-white/20">
                               {item.kingdom}
                           </span>
                       </div>
                       <h2 className="font-serif text-3xl md:text-5xl text-white font-bold mb-2 drop-shadow-lg">
                           {item.commonName}
                       </h2>
                       <p className="text-white/90 text-sm md:text-lg font-light line-clamp-2 max-w-2xl drop-shadow-md">
                           {item.description}
                       </p>
                  </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Dots (Pagination) */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-3 z-50">
          {items.map((_, i) => (
              <button 
                key={i}
                onClick={() => setActiveIndex(i)}
                className={`h-1.5 rounded-full transition-all duration-300 ${i === activeIndex ? 'w-8 bg-moss-600' : 'w-1.5 bg-stone-300 hover:bg-stone-400'}`}
                aria-label={`Go to slide ${i + 1}`}
              />
          ))}
      </div>

    </div>
  );
};
