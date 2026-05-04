import React from 'react';

const CalculatorDisplay = ({ value, formula, isLandscape, hasError }) => {
  return (
    <div className={`flex flex-col justify-end items-end px-6 py-4 overflow-hidden transition-all duration-300 ${isLandscape ? 'h-24' : 'h-32'}`}>
      <div className="text-white/40 text-sm h-6 overflow-hidden text-right w-full font-sans">
        {formula}
      </div>
      <div className={`text-white font-light tracking-tight truncate w-full text-right ${isLandscape ? 'text-4xl' : 'text-5xl'} ${hasError ? 'shake' : ''}`}>
        {value}
      </div>
    </div>
  );
};

export default CalculatorDisplay;
