import React from 'react';

export const CalorieIcon = ({ size = 24, className = "", color = "currentColor" }: { 
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
    {/* Flame body */}
    <path 
      d="M12 2C12 2 8 6 8 10C8 12.2091 9.79086 14 12 14C14.2091 14 16 12.2091 16 10C16 6 12 2 12 2Z" 
      fill={color}
      opacity="0.8"
    />
    {/* Inner flame */}
    <path 
      d="M12 5C12 5 10 7 10 9C10 10.1046 10.8954 11 12 11C13.1046 11 14 10.1046 14 9C14 7 12 5 12 5Z" 
      fill="white"
      opacity="0.9"
    />
    {/* Flame base */}
    <ellipse 
      cx="12" 
      cy="16" 
      rx="6" 
      ry="4" 
      fill={color}
      opacity="0.3"
    />
    <ellipse 
      cx="12" 
      cy="18" 
      rx="4" 
      ry="2" 
      fill={color}
      opacity="0.5"
    />
    {/* Sparks */}
    <circle 
      cx="6" 
      cy="8" 
      r="1" 
      fill={color}
      opacity="0.6"
    />
    <circle 
      cx="18" 
      cy="12" 
      r="0.8" 
      fill={color}
      opacity="0.7"
    />
    <circle 
      cx="4" 
      cy="14" 
      r="0.6" 
      fill={color}
      opacity="0.5"
    />
    <circle 
      cx="20" 
      cy="16" 
      r="0.7" 
      fill={color}
      opacity="0.6"
    />
  </svg>
);