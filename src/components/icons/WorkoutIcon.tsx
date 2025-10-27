import React from 'react';

export const WorkoutIcon = ({ size = 24, className = "", color = "currentColor" }: { 
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
    {/* Dumbbell bar */}
    <rect 
      x="6" 
      y="11" 
      width="12" 
      height="2" 
      rx="1" 
      fill={color}
    />
    {/* Left weight plates */}
    <rect 
      x="2" 
      y="8" 
      width="5" 
      height="8" 
      rx="2" 
      stroke={color} 
      strokeWidth="2" 
      fill="none"
    />
    <rect 
      x="3" 
      y="9" 
      width="3" 
      height="6" 
      rx="1" 
      fill={color} 
      opacity="0.3"
    />
    {/* Right weight plates */}
    <rect 
      x="17" 
      y="8" 
      width="5" 
      height="8" 
      rx="2" 
      stroke={color} 
      strokeWidth="2" 
      fill="none"
    />
    <rect 
      x="18" 
      y="9" 
      width="3" 
      height="6" 
      rx="1" 
      fill={color} 
      opacity="0.3"
    />
    {/* Grip marks */}
    <line 
      x1="9" 
      y1="10" 
      x2="9" 
      y2="14" 
      stroke={color} 
      strokeWidth="0.5"
    />
    <line 
      x1="12" 
      y1="10" 
      x2="12" 
      y2="14" 
      stroke={color} 
      strokeWidth="0.5"
    />
    <line 
      x1="15" 
      y1="10" 
      x2="15" 
      y2="14" 
      stroke={color} 
      strokeWidth="0.5"
    />
  </svg>
);