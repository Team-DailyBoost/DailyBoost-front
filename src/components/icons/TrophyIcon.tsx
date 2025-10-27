import React from 'react';

export const TrophyIcon = ({ size = 24, className = "", color = "currentColor" }: { 
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
    {/* Trophy cup */}
    <path 
      d="M8 2H16V8C16 10.2091 14.2091 12 12 12C9.79086 12 8 10.2091 8 8V2Z" 
      stroke={color} 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
      fill={color}
      fillOpacity="0.1"
    />
    {/* Trophy handles */}
    <path 
      d="M6 4H4C3.44772 4 3 4.44772 3 5V7C3 8.10457 3.89543 9 5 9H6" 
      stroke={color} 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
    <path 
      d="M18 4H20C20.5523 4 21 4.44772 21 5V7C21 8.10457 20.1046 9 19 9H18" 
      stroke={color} 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
    {/* Trophy base */}
    <path 
      d="M10 12V15H14V12" 
      stroke={color} 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
    <rect 
      x="7" 
      y="15" 
      width="10" 
      height="3" 
      rx="1" 
      stroke={color} 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
      fill={color}
      fillOpacity="0.2"
    />
    <rect 
      x="9" 
      y="18" 
      width="6" 
      height="2" 
      rx="1" 
      fill={color}
      fillOpacity="0.3"
    />
    {/* Star on trophy */}
    <path 
      d="M12 5L12.5 6.5H14L12.75 7.5L13.25 9L12 8L10.75 9L11.25 7.5L10 6.5H11.5L12 5Z" 
      fill={color}
      opacity="0.8"
    />
  </svg>
);