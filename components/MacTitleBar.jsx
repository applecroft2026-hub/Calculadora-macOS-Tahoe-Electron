import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const AppleTooltip = ({ children, text }) => {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div className="relative flex items-center justify-center"
         onMouseEnter={() => setIsVisible(true)}
         onMouseLeave={() => setIsVisible(false)}>
      
      {children}

      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            transition={{ duration: 0.1, ease: "easeOut" }}
            className="absolute top-full mt-2 z-[1000] pointer-events-none"
          >
            {/* El contenedor con blur y sombra suave */}
            <div className="bg-[#1e1e1e]/80 backdrop-blur-md border border-white/10 px-2.5 py-1 rounded-md shadow-2xl">
              <span className="text-white text-[12px] font-medium whitespace-nowrap" 
                    style={{ fontFamily: 'SF Pro Text, -apple-system, BlinkMacSystemFont, sans-serif' }}>
                {text}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const MacTitleBar = ({ onClose, onMinimize, onTogglePip, onToggleScientific, onModeChange, currentMode, onToggleHistory }) => {
  return (
    <div className="flex items-center justify-between px-4 py-3 select-none w-full">
      <div className="flex gap-2 no-drag items-center">
        {/* SEMAPHORES */}
        <button 
          onClick={onClose}
          className="w-3.5 h-3.5 rounded-full bg-[#FF5F56] border border-black/10 hover:brightness-75 transition-all flex items-center justify-center group no-drag"
        >
          <span className="opacity-0 group-hover:opacity-100 text-[10px] text-black/70 font-bold">×</span>
        </button>
        <button 
          onClick={onMinimize}
          className="w-3.5 h-3.5 rounded-full bg-[#FFBD2E] border border-black/10 hover:brightness-75 transition-all flex items-center justify-center group no-drag"
        >
          <span className="opacity-0 group-hover:opacity-100 text-[10px] text-black/70 font-bold">−</span>
        </button>
        
        <AppleTooltip text="Picture in Picture">
          <button 
            onClick={onTogglePip}
            className="w-3.5 h-3.5 rounded-full bg-[#27C93F] border border-black/10 hover:brightness-75 transition-all flex items-center justify-center group no-drag"
          >
            <span className="opacity-0 group-hover:opacity-100 text-[8px] text-black/70 font-bold px-[1px]">⤢</span>
          </button>
        </AppleTooltip>

        {/* DASHBOARD ICON (Switch to Scientific) */}
        {currentMode === 'Basica' || currentMode === 'Cientifica' ? (
          <AppleTooltip text="Modo Científico">
            <button 
              onClick={onToggleScientific}
              className="ml-4 p-1.5 hover:bg-white/10 rounded-md transition-all text-white/40 hover:text-white no-drag"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect width="18" height="18" x="3" y="3" rx="2" ry="2"/>
                <path d="M3 9h18M9 21V9"/>
              </svg>
            </button>
          </AppleTooltip>
        ) : null}
      </div>

      <div className="flex gap-2 no-drag ml-auto">
        {/* HISTORY */}
        {(currentMode === 'Basica' || currentMode === 'Cientifica') && (
          <AppleTooltip text="Historial">
            <button 
              onClick={onToggleHistory}
              className="p-1.5 hover:bg-white/10 rounded-md transition-all text-white/40 hover:text-white"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
              </svg>
            </button>
          </AppleTooltip>
        )}
        
        {/* CALCULATOR ICON (Mode Switcher) */}
        <AppleTooltip text="Menú">
          <button 
            onClick={onModeChange}
            className="p-1.5 hover:bg-white/10 rounded-md transition-all text-neutral-400 hover:brightness-125 no-drag"
          >
            <img src="https://img.icons8.com/?size=100&id=ujRmpOIupIsv&format=png&color=ffffff" height="25" width="25" alt="" />
          </button>
        </AppleTooltip>
      </div>
    </div>
  );
};

export default MacTitleBar;
