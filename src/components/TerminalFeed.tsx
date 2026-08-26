import React, { useRef, useEffect, useState } from 'react';
import { useSystem } from '../context/SystemContext';
import { playDataTick } from '../utils/sound';

export const TerminalFeed: React.FC = () => {
  const { logs, metrics, overkillMode, lastCommand, snapshot } = useSystem();
  const terminalEndRef = useRef<HTMLDivElement>(null);
  
  // Track metrics history for the telemetry line chart
  const [chartHistory, setChartHistory] = useState<{cpu: number, neural: number}[]>([]);

  // Auto-scroll logs to bottom and play tech beep sound on new log
  useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
    if (logs.length > 0) {
      playDataTick();
    }
  }, [logs]);

  // Capture metrics for graph
  useEffect(() => {
    setChartHistory((prev) => {
      const next = [...prev, { cpu: metrics.cpu, neural: metrics.neuralLoad }];
      if (next.length > 25) next.shift();
      return next;
    });
  }, [metrics.cpu, metrics.neuralLoad]);

  // Render SVG charts inside 100x100 relative viewBox coordinates
  const getSvgPath = (key: 'cpu' | 'neural', width: number, height: number) => {
    if (chartHistory.length < 2) return '';
    const step = width / (chartHistory.length - 1);
    
    return chartHistory
      .map((pt, i) => {
        const x = i * step;
        const val = pt[key];
        // Scale 0-100% to height (margin 6px)
        const y = height - (val / 100) * (height - 12) - 6;
        return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
      })
      .join(' ');
  };

  const getLogColorClass = (level: string, source: string) => {
    if (level === 'warn') return 'text-cyber-amber';
    if (level === 'success') return 'text-emerald-400';
    if (source === 'USER') return 'text-white font-medium';
    if (source === 'AI_BACKEND') return 'text-cyber-cyan font-bold';
    return 'text-cyber-cyan/85';
  };

  return (
    <section className="cyber-panel p-4 flex flex-col gap-4.5 select-none text-cyber-light font-rajdhani">
      
      {/* TITLE */}
      <h2 className="panel-title flex justify-between items-center">
        <span>EXECUTION LOGS & VECTORS</span>
        <span className="sub">
          {lastCommand ? `${lastCommand.status.toUpperCase()} · ${lastCommand.risk}` : 'LOG_STREAM_01'}
        </span>
      </h2>

      {/* AUTO SCROLLING TERMINAL PANEL */}
      <div className="bg-black/55 border border-cyber-cyan/20 inset-shadow rounded p-3 font-sharetech text-[11px] leading-relaxed text-cyber-cyan/90 h-[260px] overflow-y-auto flex flex-col gap-2 relative">
        {logs.map((log, idx) => (
          <div key={idx} className="flex gap-2.5 items-start">
            <span className="text-cyber-cyan/40 shrink-0 font-medium">[{log.timestamp}]</span>
            <span className="text-cyber-cyan/50 shrink-0 font-bold">[{log.source}]</span>
            <span className={`log-text-content ${getLogColorClass(log.level, log.source)}`}>
              {log.text}
            </span>
          </div>
        ))}
        <div ref={terminalEndRef} />
      </div>

      {/* VECTOR NETWORK CHART (SVG Sparklines Chart) */}
      <div className="border border-cyber-cyan/15 rounded bg-black/35 relative p-2 overflow-hidden h-[130px] flex flex-col">
        
        {/* Background Grid Lines */}
        <div className="absolute inset-0 pointer-events-none grid grid-cols-4 grid-rows-3 opacity-[0.03] border-b border-cyber-cyan">
          <div className="border-r border-b border-cyber-cyan"></div>
          <div className="border-r border-b border-cyber-cyan"></div>
          <div className="border-r border-b border-cyber-cyan"></div>
          <div className="border-b border-cyber-cyan"></div>
          <div className="border-r border-b border-cyber-cyan"></div>
          <div className="border-r border-b border-cyber-cyan"></div>
          <div className="border-r border-b border-cyber-cyan"></div>
          <div className="border-b border-cyber-cyan"></div>
        </div>

        {/* Chart Header */}
        <div className="flex justify-between items-center text-[10px] font-sharetech text-cyber-cyan/60 z-10 select-none px-1">
          <span>VECTOR FEED ANALYSIS</span>
          <div className="flex gap-3">
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-cyber-cyan inline-block"></span>CPU
            </span>
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-cyber-blue inline-block"></span>NEURAL
            </span>
          </div>
        </div>

        {/* Responsive scaling SVG Chart */}
        <div className="flex-1 relative w-full mt-2 overflow-hidden">
          <svg 
            className="w-full h-full stroke-current overflow-visible" 
            viewBox="0 0 100 100" 
            preserveAspectRatio="none"
            fill="none" 
            strokeWidth="0.8"
          >
            
            {/* CPU Waveform (Cyan/Red) */}
            <path 
              d={getSvgPath('cpu', 100, 100)} 
              className={overkillMode ? 'text-red-500' : 'text-cyber-cyan'} 
              style={{ transition: 'd 0.2s ease' }}
            />
            
            {/* Neural Waveform (Blue) */}
            <path 
              d={getSvgPath('neural', 100, 100)} 
              className="text-cyber-blue" 
              style={{ transition: 'd 0.2s ease' }}
            />
            
            {/* Final point coordinates circles */}
            {chartHistory.length > 0 && (
              <>
                <circle 
                  cx={100} 
                  cy={100 - (chartHistory[chartHistory.length - 1].cpu / 100) * 88 - 6} 
                  r={1} 
                  className={overkillMode ? 'fill-red-500 stroke-red-500' : 'fill-cyber-cyan stroke-cyber-cyan'} 
                />
                <circle 
                  cx={100} 
                  cy={100 - (chartHistory[chartHistory.length - 1].neural / 100) * 88 - 6} 
                  r={1} 
                  className="fill-cyber-blue stroke-cyber-blue" 
                />
              </>
            )}

          </svg>
        </div>

      </div>

    </section>
  );
};
