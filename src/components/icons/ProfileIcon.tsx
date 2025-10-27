import React from 'react';

export const ProfileIcon = ({ size = 24, className = "", color = "currentColor" }: { 
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
    {/* Head */}
    <circle 
      cx="12" 
      cy="8" 
      r="4" 
      stroke={color} 
      strokeWidth="2" 
      fill={color}
      fillOpacity="0.1"
    />
    {/* Body */}
    <path 
      d="M6 21V19C6 16.7909 7.79086 15 10 15H14C16.2091 15 18 16.7909 18 19V21" 
      stroke={color} 
      strokeWidth="2" 
      strokeLinecap="round"
    />
    {/* Settings gear */}
    <g transform="translate(16, 2) scale(0.6)">
      <circle 
        cx="4" 
        cy="4" 
        r="1.5" 
        fill={color}
        opacity="0.8"
      />
      <path 
        d="M7 4H8V3H7V4ZM7 5H8V6H7V5ZM6 3V4H5V3H6ZM6 5V6H5V5H6ZM3 4H2V3H3V4ZM3 5H2V6H3V5ZM4 2V1H3V2H4ZM5 2V1H6V2H5Z" 
        fill={color}
        opacity="0.6"
      />
    </g>
    {/* Stats indicator */}
    <rect 
      x="3" 
      y="3" 
      width="2" 
      height="1" 
      rx="0.5" 
      fill={color}
      opacity="0.5"
    />
    <rect 
      x="3" 
      y="5" 
      width="3" 
      height="1" 
      rx="0.5" 
      fill={color}
      opacity="0.7"
    />
    <rect 
      x="3" 
      y="7" 
      width="1.5" 
      height="1" 
      rx="0.5" 
      fill={color}
      opacity="0.6"
    />
  </svg>
);