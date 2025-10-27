import React from 'react';

export const CommunityIcon = ({ size = 24, className = "", color = "currentColor" }: { 
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
    {/* Person 1 */}
    <circle 
      cx="8" 
      cy="7" 
      r="3" 
      stroke={color} 
      strokeWidth="2" 
      fill={color}
      fillOpacity="0.1"
    />
    <path 
      d="M2 19C2 15.6863 4.68629 13 8 13C11.3137 13 14 15.6863 14 19" 
      stroke={color} 
      strokeWidth="2" 
      strokeLinecap="round"
    />
    {/* Person 2 */}
    <circle 
      cx="16" 
      cy="6" 
      r="2.5" 
      stroke={color} 
      strokeWidth="2" 
      fill={color}
      fillOpacity="0.2"
    />
    <path 
      d="M22 19C22 16.7909 20.2091 15 18 15C17 15 16.1 15.3 15.4 15.8" 
      stroke={color} 
      strokeWidth="2" 
      strokeLinecap="round"
    />
    {/* Connection dots */}
    <circle 
      cx="12" 
      cy="11" 
      r="1" 
      fill={color}
      opacity="0.6"
    />
    <circle 
      cx="10" 
      cy="9" 
      r="0.5" 
      fill={color}
      opacity="0.4"
    />
    <circle 
      cx="14" 
      cy="9" 
      r="0.5" 
      fill={color}
      opacity="0.4"
    />
    {/* Heart symbol */}
    <path 
      d="M19 4C19.5 3.5 20.5 3.5 21 4C21.5 4.5 21.5 5.5 21 6L20 7L19 6C18.5 5.5 18.5 4.5 19 4Z" 
      fill={color}
      opacity="0.7"
    />
  </svg>
);