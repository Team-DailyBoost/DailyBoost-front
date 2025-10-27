import React from 'react';

export const TimerIcon = ({ size = 24, className = "", color = "currentColor" }: { 
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
    {/* Clock face */}
    <circle 
      cx="12" 
      cy="13" 
      r="8" 
      stroke={color} 
      strokeWidth="2" 
      fill={color}
      fillOpacity="0.05"
    />
    {/* Clock hands */}
    <path 
      d="M12 13L16 9" 
      stroke={color} 
      strokeWidth="2" 
      strokeLinecap="round"
    />
    <path 
      d="M12 13L14 17" 
      stroke={color} 
      strokeWidth="2" 
      strokeLinecap="round"
    />
    {/* Center dot */}
    <circle 
      cx="12" 
      cy="13" 
      r="1.5" 
      fill={color}
    />
    {/* Timer top */}
    <path 
      d="M9 3H15" 
      stroke={color} 
      strokeWidth="2" 
      strokeLinecap="round"
    />
    <circle 
      cx="12" 
      cy="3" 
      r="1" 
      fill={color}
      opacity="0.7"
    />
    {/* Hour markers */}
    <circle cx="12" cy="7" r="0.5" fill={color} opacity="0.6" />
    <circle cx="12" cy="19" r="0.5" fill={color} opacity="0.6" />
    <circle cx="18" cy="13" r="0.5" fill={color} opacity="0.6" />
    <circle cx="6" cy="13" r="0.5" fill={color} opacity="0.6" />
    {/* Progress arc */}
    <path 
      d="M8 7C6.5 8.5 6.5 10.5 8 12" 
      stroke={color} 
      strokeWidth="3" 
      strokeLinecap="round"
      opacity="0.8"
    />
  </svg>
);