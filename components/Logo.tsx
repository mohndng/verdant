import React from 'react';

interface LogoProps {
  className?: string;
  inverted?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ className = "w-8 h-8", inverted = false }) => (
  <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <circle cx="24" cy="24" r="24" className={inverted ? "fill-white" : "fill-moss-800"} />
    <path 
      d="M24 38V10M24 38C24 38 10 28 10 18M24 32C24 32 36 26 36 20" 
      stroke={inverted ? "#1d3829" : "white"} 
      strokeWidth="4" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
    />
  </svg>
);