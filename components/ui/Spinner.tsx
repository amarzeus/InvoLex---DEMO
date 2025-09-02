
import React from 'react';

interface SpinnerProps {
  size?: 'small' | 'medium' | 'large';
}

const Spinner: React.FC<SpinnerProps> = ({ size = 'medium' }) => {
  const sizeClasses = {
    small: 'h-4 w-4',
    medium: 'h-8 w-8',
    large: 'h-16 w-16',
  };

  return (
    <div
      className={`animate-spin rounded-full border-b-2 border-t-2 border-brand-accent ${sizeClasses[size]}`}
    ></div>
  );
};

export default Spinner;
