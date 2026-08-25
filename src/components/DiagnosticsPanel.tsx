import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useSystem } from '../context/SystemContext';

export const DiagnosticsPanel: React.FC = () => {
  const { metrics, overkillMode } = useSystem();
  
  // Local telemetry states
  const [fps, setFps] = useState(60.0);
  const [logicSectors, setLogicSectors] = useState<string[]>([]);
  
  // Calculate dynamic outputs based on core metrics
  const coreTemp = (32.4 + metrics.cpu * 0.14).toFixed(1);
  const activeThreads = Math.floor(2380 + metrics.cpu * 1.8);
  const neuralSpeed = (5.42 + metrics.neuralLoad * 0.082).toFixed(2);

  // Update FPS and hex grid periodically
  useEffect(() => {
    const fpsInterval = setInterval(() => {
      const baseFps = overkillMode ? 120.0 : 60.0;
      const variation = overkillMode ? 1.5 : 0.4;
      setFps(baseFps - Math.random() * variation);
    }, 800);

    const hexInterval = setInterval(() => {
      const rows: string[] = [];
      for (let i = 0; i < 8; i++) {
        let cols = '';
        for (let j = 0; j < 5; j++) {
          cols += Math.floor(Math.random() * 65536).toString(16).toUpperCase().padStart(4, '0') + ' ';
        }
        rows.push(cols.trim());
      }
      setLogicSectors(rows);
    }, 280);

    return () => {
      clearInterval(fpsInterval);
      clearInterval(hexInterval);
    };
  }, [overkillMode]);

  return (
    <section className="cyber-panel p-4 flex flex-col gap-4.5 select-none text-cyber-light font-rajdhani">
      
      {/* TITLE */}
      <h2 className="panel-title flex justify-between items-center">
        <span>SYSTEM DIAGNOSTICS</span>
        <span className="sub">SYS_DIAG_v3.42</span>
      </h2>

      {/* METRIC PROGRESS BARS */}
      <div className="flex flex-col gap-4">
        
        {/* CPU Progress */}
        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between text-xs font-semibold">
            <span>CPU CORE UTILIATION</span>
            <span className="font-sharetech text-cyber-cyan">{metrics.cpu.toFixed(1)}%</span>
          </div>
          <div className="h-1.5 bg-black/40 border border-cyber-cyan/15 rounded-full overflow-hidden relative">
            <motion.div 
              className={`h-full rounded-full ${
                metrics.cpu > 75 
                  ? 'bg-gradient-to-r from-cyber-amber to-red-500 shadow-[0_0_8px_#ef4444]' 
                  : 'bg-gradient-to-r from-cyber-blue to-cyber-cyan shadow-[0_0_8px_#00f3ff]'
              }`}
              initial={{ width: '0%' }}
              animate={{ width: `${metrics.cpu}%` }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
            />
          </div>
        </div>

        {/* GPU PyTorch Load */}
        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between text-xs font-semibold">
            <span>GPU PYTORCH ENGINE</span>
            <span className="font-sharetech text-cyber-cyan">{metrics.gpu.toFixed(1)}%</span>
          </div>
          <div className="h-1.5 bg-black/40 border border-cyber-cyan/15 rounded-full overflow-hidden relative">
            <motion.div 
              className="h-full rounded-full bg-gradient-to-r from-cyber-blue to-cyber-cyan shadow-[0_0_8px_#00f3ff]"
              initial={{ width: '0%' }}
              animate={{ width: `${metrics.gpu}%` }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
            />
          </div>
        </div>

        {/* Neural load */}
        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between text-xs font-semibold">
            <span>NEURAL VECTOR QUEUE</span>
            <span className="font-sharetech text-cyber-cyan">{metrics.neuralLoad.toFixed(1)}%</span>
          </div>
          <div className="h-1.5 bg-black/40 border border-cyber-cyan/15 rounded-full overflow-hidden relative">
            <motion.div 
              className="h-full rounded-full bg-gradient-to-r from-cyber-blue to-cyber-cyan shadow-[0_0_8px_#00f3ff]"
              initial={{ width: '0%' }}
              animate={{ width: `${metrics.neuralLoad}%` }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
            />
          </div>
        </div>

        {/* Core RAM Allocation */}
        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between text-xs font-semibold">
            <span>MEMORY GRID BUFFER</span>
            <span className="font-sharetech text-cyber-cyan">{(34.1 + metrics.cpu * 0.05).toFixed(1)}%</span>
          </div>
          <div className="h-1.5 bg-black/40 border border-cyber-cyan/15 rounded-full overflow-hidden relative">
            <motion.div 
              className="h-full rounded-full bg-gradient-to-r from-cyber-blue to-cyber-cyan shadow-[0_0_8px_#00f3ff]"
              initial={{ width: '0%' }}
              animate={{ width: `${34.1 + metrics.cpu * 0.05}%` }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
            />
          </div>
        </div>

      </div>

      {/* TELEMETRY READOUT VALUES */}
      <div className="grid grid-cols-2 gap-2 border-t border-cyber-cyan/15 pt-3">
        
        <div className="bg-cyber-blue/[0.04] border border-cyber-cyan/10 rounded px-2 py-1.5 flex flex-col gap-0.5">
          <label className="text-[8px] font-bold text-cyber-cyan/60 uppercase tracking-wider">NEURAL VECTOR SPEED</label>
          <span className="font-sharetech text-xs text-cyber-cyan">{neuralSpeed} PB/s</span>
        </div>

        <div className="bg-cyber-blue/[0.04] border border-cyber-cyan/10 rounded px-2 py-1.5 flex flex-col gap-0.5">
          <label className="text-[8px] font-bold text-cyber-cyan/60 uppercase tracking-wider">CORE TEMPERATURE</label>
          <span className="font-sharetech text-xs text-cyber-cyan">{coreTemp} °C</span>
        </div>

        <div className="bg-cyber-blue/[0.04] border border-cyber-cyan/10 rounded px-2 py-1.5 flex flex-col gap-0.5">
          <label className="text-[8px] font-bold text-cyber-cyan/60 uppercase tracking-wider">THREAD REGISTRY</label>
          <span className="font-sharetech text-xs text-cyber-cyan">{activeThreads} RUNNING</span>
        </div>

        <div className="bg-cyber-blue/[0.04] border border-cyber-cyan/10 rounded px-2 py-1.5 flex flex-col gap-0.5">
          <label className="text-[8px] font-bold text-cyber-cyan/60 uppercase tracking-wider">SYSTEM FRAME RATE</label>
          <span className="font-sharetech text-xs text-cyber-cyan">{fps.toFixed(1)} FPS</span>
        </div>

      </div>

      {/* HEX SCAN BLOCK MATRIX */}
      <div className="border border-cyber-cyan/15 rounded bg-black/30 p-2.5 font-sharetech text-[10px] text-cyber-cyan/40 flex flex-col gap-1.5 flex-1 overflow-hidden min-h-[140px]">
        {logicSectors.map((row, idx) => (
          <div key={idx} className="flex justify-between tracking-wider whitespace-nowrap">
            {row.split(' ').map((val, cIdx) => {
              const isActive = (idx + cIdx) % 3 === 0 && Math.random() > 0.6;
              return (
                <span 
                  key={cIdx} 
                  className={isActive ? 'text-cyber-cyan font-bold drop-shadow-[0_0_4px_#00f3ff]' : ''}
                >
                  {val}
                </span>
              );
            })}
          </div>
        ))}
      </div>

    </section>
  );
};
