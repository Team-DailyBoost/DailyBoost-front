import React from 'react';

export const FoodIcon = ({ size = 24, className = "", color = "currentColor" }: { 
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
    {/* Bowl */}
    <path 
      d="M4 12C4 16.4183 7.58172 20 12 20C16.4183 20 20 16.4183 20 12H4Z" 
      stroke={color} 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
    {/* Food items in bowl */}
    <circle cx="9" cy="10" r="1.5" fill={color} opacity="0.6" />
    <circle cx="15" cy="9" r="1" fill={color} opacity="0.8" />
    <circle cx="12" cy="11" r="1.2" fill={color} opacity="0.7" />
    <circle cx="7" cy="8" r="0.8" fill={color} opacity="0.9" />
    <circle cx="16" cy="11" r="0.9" fill={color} opacity="0.5" />
    {/* Steam */}
    <path 
      d="M8 6C8 5 8.5 4 9 4" 
      stroke={color} 
      strokeWidth="1.5" 
      strokeLinecap="round"
    />
    <path 
      d="M12 5C12 4 12.5 3 13 3" 
      stroke={color} 
      strokeWidth="1.5" 
      strokeLinecap="round"
    />
    <path 
      d="M16 6C16 5 16.5 4 17 4" 
      stroke={color} 
      strokeWidth="1.5" 
      strokeLinecap="round"
    />
  </svg>
);