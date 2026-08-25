import React, { useState, useEffect } from 'react';
import { useSystem } from '../context/SystemContext';
import { Shield, Cpu, Database, Network, Tv, Zap } from 'lucide-react';

export const Header: React.FC = () => {
  const { metrics, overkillMode, systemState, cvStackActive } = useSystem();
  const [timeText, setTimeText] = useState('00:00:00');
  const [dateText, setDateText] = useState('MON 01 JAN 2026');
  const [latencyHistory, setLatencyHistory] = useState<number[]>([8, 7, 9, 8, 10, 11, 8, 9, 7, 8]);

  // Clock ticks
  useEffect(() => {
    const weekdays = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
    const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

    const updateClock = () => {
      const now = new Date();
      const hrs = String(now.getHours()).padStart(2, '0');
      const mins = String(now.getMinutes()).padStart(2, '0');
      const secs = String(now.getSeconds()).padStart(2, '0');
      setTimeText(`${hrs}:${mins}:${secs}`);

      const day = weekdays[now.getDay()];
      const dateNum = String(now.getDate()).padStart(2, '0');
      const month = months[now.getMonth()];
      const year = now.getFullYear();
      setDateText(`${day} ${dateNum} ${month} ${year}`);
    };

    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  // Latency history plotter
  useEffect(() => {
    setLatencyHistory((prev) => {
      const next = [...prev, metrics.latency];
      if (next.length > 12) next.shift();
      return next;
    });
  }, [metrics.latency]);

  // Generate SVG Sparkline path
  const getSparklinePath = () => {
    if (latencyHistory.length < 2) return '';
    const width = 60;
    const height = 16;
    const step = width / (latencyHistory.length - 1);
    return latencyHistory
      .map((val, i) => {
        const x = i * step;
        const y = height - ((val - 2) / 18) * (height - 4) - 2;
        return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
      })
      .join(' ');
  };

  const badgeBorder = overkillMode ? 'border-red-500/25 text-red-400 bg-red-950/5' : 'border-cyber-cyan/25 text-cyber-cyan bg-cyber-blue/10';

  return (
    <header className={`flex justify-between items-center border-b ${overkillMode ? 'border-red-500/25' : 'border-cyber-cyan/25'} pb-3 mb-4 relative z-10 select-none`}>
      
      {/* BRANDING */}
      <div className="flex items-center gap-3">
        <div className="relative">
          <div className={`w-2.5 h-2.5 rounded-full shadow-lg transition-all duration-300 ${
            overkillMode 
              ? 'bg-red-500 shadow-red-500/80 animate-ping' 
              : systemState === 'PROCESSING' 
              ? 'bg-cyber-amber shadow-cyber-amber/80 animate-ping'
              : 'bg-cyber-cyan shadow-cyber-cyan/80 animate-pulse'
          }`} />
        </div>
        <div className="flex flex-col">
          <h1 className={`font-orbitron font-extrabold text-2xl tracking-[3px] bg-clip-text text-transparent bg-gradient-to-r ${
            overkillMode 
              ? 'from-red-500 to-cyber-amber' 
              : 'from-cyber-cyan to-cyber-blue'
          }`}>
            H.O.L.M.E.V.
          </h1>
          <p className={`font-rajdhani text-[9px] font-bold tracking-[1.5px] uppercase ${overkillMode ? 'text-red-500/70' : 'text-cyber-cyan/70'}`}>
            HYPER-AUTOMATED OPERATIONAL LOGIC & MACHINE EXECUTION VECTOR
          </p>
        </div>
      </div>

      {/* MID PANEL: DIGITAL TIME & LATENCY */}
      <div className="flex items-center gap-6 font-orbitron text-sm">
        <div className="text-white drop-shadow-[0_0_6px_rgba(255,255,255,0.4)] font-medium">
          {timeText}
        </div>
        <div className={`text-xs hidden md:block ${overkillMode ? 'text-red-400/50' : 'text-cyber-cyan/60'}`}>
          {dateText}
        </div>
        <div className={`flex items-center gap-2 text-xs border rounded px-2.5 py-1 ${
          overkillMode 
            ? 'bg-red-950/20 border-red-500/30 text-red-400' 
            : 'bg-cyber-amber/5 border-cyber-amber/30 text-cyber-amber'
        }`}>
          <Zap className="w-3.5 h-3.5" />
          <span className="font-sharetech">WS LATENCY: {metrics.latency}ms</span>
          <svg className="w-[60px] h-[16px] stroke-current" fill="none" strokeWidth="1.2">
            <path d={getSparklinePath()} />
          </svg>
        </div>
      </div>

      {/* BADGES */}
      <div className="hidden lg:flex gap-2">
        <div className={`badge ${overkillMode ? 'border-red-500/50 text-red-400 bg-red-950/20' : 'border-cyber-cyan/35 text-cyber-cyan bg-cyber-cyan/5'} border px-2.5 py-1 rounded text-[10px] font-orbitron font-semibold tracking-wider flex items-center gap-1.5`}>
          <Cpu className="w-3 h-3" />
          <span>CORE: {overkillMode ? 'OVERCLOCK' : 'ACTIVE'}</span>
        </div>
        <div className={`badge border ${badgeBorder} px-2.5 py-1 rounded text-[10px] font-orbitron font-semibold tracking-wider flex items-center gap-1.5`}>
          <Shield className="w-3 h-3 text-emerald-400" />
          <span>FIREWALL: SECURE</span>
        </div>
        <div className={`badge border ${badgeBorder} px-2.5 py-1 rounded text-[10px] font-orbitron font-semibold tracking-wider flex items-center gap-1.5`}>
          <Database className="w-3 h-3" />
          <span>REDIS: UP</span>
        </div>
        <div className={`badge border ${badgeBorder} px-2.5 py-1 rounded text-[10px] font-orbitron font-semibold tracking-wider flex items-center gap-1.5`}>
          <Network className="w-3 h-3" />
          <span>VECTOR_DB: OK</span>
        </div>
        <div className={`badge border px-2.5 py-1 rounded text-[10px] font-orbitron font-semibold tracking-wider flex items-center gap-1.5 transition-all duration-300 ${
          cvStackActive 
            ? 'border-emerald-500/50 text-emerald-400 bg-emerald-950/20 animate-pulse'
            : systemState === 'PROCESSING' 
            ? 'border-cyber-amber/50 text-cyber-amber bg-cyber-amber/5 animate-pulse' 
            : 'border-cyber-blue/35 text-cyber-cyan bg-cyber-blue/10'
        }`}>
          <Tv className="w-3 h-3" />
          <span>CCTV FEED: {cvStackActive ? 'ACTIVE' : 'READY'}</span>
        </div>
      </div>
      
      {/* HUD BOTTOM ACCENT LINE GLOW */}
      <div className={`absolute bottom-0 left-[15%] w-[120px] h-[1px] shadow-sm transition-all duration-500 ${
        overkillMode ? 'bg-red-500 shadow-red-500' : 'bg-cyber-cyan shadow-cyber-cyan'
      }`} />
    </header>
  );
};
