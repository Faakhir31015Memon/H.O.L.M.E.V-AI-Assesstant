import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Send, RefreshCw } from 'lucide-react';
import { useSystem } from '../context/SystemContext';

export const ControlFooter: React.FC = () => {
  const { 
    systemState, 
    setSystemState, 
    addLog, 
    executeCommand, 
    triggerPill,
    overkillMode 
  } = useSystem();

  const [inputVal, setInputVal] = useState('');

  // Handle voice state lifecycle simulation
  const handleMicToggle = () => {
    if (systemState === 'IDLE') {
      setSystemState('LISTENING');
      addLog("USER: [Voice Activation Initiated]", "USER", "info");
      addLog("H.O.L.M.E.V.: LISTENING FOR COGNITIVE LOGIC PATTERNS...", "AI_BACKEND", "warn");

      // Simulates 3.0s listening
      setTimeout(() => {
        setSystemState('PROCESSING');
        addLog("SYSTEM: AUDIO INPUT BUFFER SECURED (3.2 seconds)", "SYSTEM", "success");
        addLog("H.O.L.M.E.V.: EXTRACTING VECTOR PARAMETERS...", "AI_BACKEND", "warn");

        // Simulates 2.5s processing
        setTimeout(() => {
          setSystemState('IDLE');
          const randomTriggers = ['diagnostics', 'security', 'purge', 'cv'];
          const selected = randomTriggers[Math.floor(Math.random() * randomTriggers.length)];
          triggerPill(selected);
        }, 2500);
      }, 3000);
    } else {
      // Abort simulation
      setSystemState('IDLE');
      addLog("SYSTEM: VOICE INTERFACE DISCONNECTED. BUFFER PURGED.", "SYSTEM", "warn");
    }
  };

  const handleSend = () => {
    if (!inputVal.trim() || systemState !== 'IDLE') return;
    executeCommand(inputVal.trim());
    setInputVal('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  return (
    <footer className="flex flex-col gap-3.5 relative z-10 select-none">
      
      {/* QUICK PRESET COMMAND PILLS */}
      <div className="flex justify-center flex-wrap gap-2.5">
        <button 
          disabled={systemState !== 'IDLE'}
          onClick={() => triggerPill('diagnostics')}
          className="quick-pill"
        >
          [RUN DIAGNOSTICS]
        </button>
        <button 
          disabled={systemState !== 'IDLE'}
          onClick={() => triggerPill('security')}
          className="quick-pill"
        >
          [ACTIVATE SECURITY]
        </button>
        <button 
          disabled={systemState !== 'IDLE'}
          onClick={() => triggerPill('purge')}
          className="quick-pill"
        >
          [PURGE CACHE]
        </button>
        <button 
          disabled={systemState !== 'IDLE'}
          onClick={() => triggerPill('overkill')}
          className={`quick-pill ${overkillMode ? 'border-red-500 text-red-500 hover:bg-red-500/10' : ''}`}
        >
          [OVERKILL MODE]
        </button>
        <button 
          disabled={systemState !== 'IDLE'}
          onClick={() => triggerPill('cv')}
          className="quick-pill"
        >
          [TOGGLE CV STACK]
        </button>
      </div>

      {/* SLEEK GLASSMORPHISM INPUT CONTROL ROW */}
      <div className="interaction-bar flex items-center gap-4 bg-cyber-dark/85 backdrop-blur-md border border-cyber-cyan/25 shadow-cyan-glow px-4 py-2 relative rounded-full">
        
        {/* Pulsing Voice Trigger */}
        <div className="relative flex justify-center items-center">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleMicToggle}
            className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 z-10 ${
              systemState === 'LISTENING'
                ? 'bg-cyber-cyan border-white text-cyber-dark shadow-cyan-glow-intense'
                : systemState === 'PROCESSING'
                ? 'bg-cyber-amber border-white text-cyber-dark shadow-amber-glow-intense'
                : overkillMode
                ? 'bg-cyber-dark border-red-500 text-red-500 hover:shadow-red-glow shadow-inner'
                : 'bg-cyber-dark border-cyber-cyan text-cyber-cyan hover:shadow-cyan-glow shadow-inner'
            }`}
          >
            {systemState === 'PROCESSING' ? (
              <RefreshCw className="w-5 h-5 animate-spin" />
            ) : (
              <Mic className={`w-5 h-5 ${systemState === 'LISTENING' ? 'animate-pulse' : ''}`} />
            )}
          </motion.button>
          
          {/* Wave ripple expansion ring */}
          <AnimatePresence>
            {systemState === 'LISTENING' && (
              <motion.div 
                initial={{ scale: 1, opacity: 0.8 }}
                animate={{ scale: 1.6, opacity: 0 }}
                exit={{ opacity: 0 }}
                transition={{ repeat: Infinity, duration: 1.2, ease: 'easeOut' }}
                className="absolute w-10 h-10 border border-cyber-cyan rounded-full pointer-events-none"
              />
            )}
          </AnimatePresence>
        </div>

        {/* Input area */}
        <input 
          type="text" 
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={systemState !== 'IDLE'}
          placeholder="Type instruction for H.O.L.M.E.V. (e.g. 'diagnostics sweep', 'active overkill')..." 
          className="flex-1 bg-transparent border-none outline-none text-white font-rajdhani text-sm font-medium tracking-wide placeholder-cyber-cyan/35 h-9"
        />

        {/* Execute button */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleSend}
          disabled={systemState !== 'IDLE'}
          className="execute-button flex items-center gap-1.5 bg-gradient-to-r from-cyber-blue to-cyber-cyan border border-cyber-cyan/15 rounded-full px-5 py-1.5 font-orbitron font-bold text-[10px] text-white tracking-widest cursor-pointer shadow-cyan-glow"
        >
          <span>EXECUTE</span>
          <Send className="w-3 h-3" />
        </motion.button>

      </div>

      {/* Styled quick button stylesheet injectors */}
      <style>{`
        .quick-pill {
          font-family: 'Orbitron', sans-serif;
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 1px;
          background: rgba(0, 85, 255, 0.05);
          border: 1px solid rgba(0, 243, 255, 0.25);
          color: #00f3ff;
          padding: 5px 14px;
          border-radius: 9999px;
          cursor: pointer;
          transition: all 0.25s ease;
          box-shadow: 0 0 5px rgba(0, 243, 255, 0.05);
        }
        .quick-pill:hover:not(:disabled) {
          background: rgba(0, 243, 255, 0.15);
          border-color: #00f3ff;
          color: #ffffff;
          box-shadow: 0 0 12px rgba(0, 243, 255, 0.35);
          transform: translateY(-1.5px);
        }
        .quick-pill:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }
        body.overkill-mode .quick-pill {
          border-color: rgba(255, 60, 0, 0.35);
          color: #ff3c00;
          background: rgba(255, 60, 0, 0.03);
        }
        body.overkill-mode .quick-pill:hover:not(:disabled) {
          background: rgba(255, 60, 0, 0.15);
          border-color: #ff3c00;
          color: #ffffff;
          box-shadow: 0 0 12px rgba(255, 60, 0, 0.4);
        }
      `}</style>

    </footer>
  );
};
