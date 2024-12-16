import React from 'react';

interface ProgressProps {
  text: string;
  percentage: number;
  total: number;
}

const Progress: React.FC<ProgressProps> = ({ text, percentage, total }) => {
  const width = `${(percentage / total) * 100}%`;
  
  return (
    <div className="my-2">
      <div className="flex justify-between mb-1">
        <span className="text-sm font-medium">{text}</span>
        <span className="text-sm font-medium">{Math.round((percentage / total) * 100)}%</span>
      </div>
      <div className="w-full bg-gray-700 rounded-full h-2">
        <div
          className="bg-primary h-2 rounded-full transition-all duration-300"
          style={{ width }}
        />
      </div>
    </div>
  );
};

export default Progress;