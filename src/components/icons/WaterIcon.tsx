import React from 'react';

export const WaterIcon = ({ size = 24, className = "", color = "currentColor" }: { 
  size?: number; 
  className?: string; 
  color?: string; 
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    className={className}
  >
    {/* Water drop */}
    <path 
      d="M12 3C12 3 6 8 6 14C6 17.3137 8.68629 20 12 20C15.3137 20 18 17.3137 18 14C18 8 12 3 12 3Z" 
      fill={color}
      opacity="0.7"
    />
    {/* Water highlight */}
    <path 
      d="M10 7C10 7 8 9 8 12C8 13.6569 9.34315 15 11 15" 
      stroke="white" 
      strokeWidth="1.5" 
      strokeLinecap="round"
      fill="none"
      opacity="0.8"
    />
    {/* Ripples */}
    <ellipse 
      cx="12" 
      cy="18" 
      rx="3" 
      ry="1" 
      fill={color}
      opacity="0.2"
    />
    <ellipse 
      cx="12" 
      cy="17.5" 
      rx="2" 
      ry="0.5" 
      fill={color}
      opacity="0.3"
    />
    {/* Bubbles */}
    <circle 
      cx="9" 
      cy="13" 
      r="0.8" 
      fill="white"
      opacity="0.6"
    />
    <circle 
      cx="14" 
      cy="11" 
      r="0.5" 
      fill="white"
      opacity="0.8"
    />
    <circle 
      cx="11" 
      cy="9" 
      r="0.3" 
      fill="white"
      opacity="0.7"
    />
  </svg>
);