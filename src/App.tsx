import React from 'react';
import { SystemProvider, useSystem } from './context/SystemContext';
import { Header } from './components/Header';
import { DiagnosticsPanel } from './components/DiagnosticsPanel';
import { HolmevCore3D } from './components/HolmevCore3D';
import { ComputerVisionFeed } from './components/ComputerVisionFeed';
import { TerminalFeed } from './components/TerminalFeed';
import { ControlFooter } from './components/ControlFooter';

const DashboardContent: React.FC = () => {
  const { cvStackActive } = useSystem();

  return (
    <div className="hud-container flex flex-col h-screen p-4 w-full relative z-10 select-none overflow-hidden">
      
      {/* Top Header bar */}
      <Header />
      
      {/* Grid 3 columns responsive dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-[330px_1fr_370px] gap-4 flex-1 min-h-0 overflow-y-auto lg:overflow-hidden mb-4">
        
        {/* Left Side diagnostics metrics */}
        <DiagnosticsPanel />
        
        {/* Center view - Toggles between 3D reactor hologram and computer vision CCTV feed */}
        {cvStackActive ? <ComputerVisionFeed /> : <HolmevCore3D />}
        
        {/* Right side WebSocket logs and sparkline charts */}
        <TerminalFeed />
        
      </div>

      {/* footer controls */}
      <ControlFooter />
      
    </div>
  );
};

function App() {
  return (
    <SystemProvider>
      {/* Ambient static scanner and line meshes */}
      <div className="hud-grid-overlay" />
      <div className="hud-scanlines" />
      
      <DashboardContent />
    </SystemProvider>
  );
}

export default App;
