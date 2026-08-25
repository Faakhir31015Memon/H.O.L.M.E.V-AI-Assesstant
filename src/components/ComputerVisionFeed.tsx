import React, { useEffect, useState, useRef } from 'react';
import { useSystem } from '../context/SystemContext';
import { Camera, Eye, ShieldAlert } from 'lucide-react';

interface BoundingBox {
  id: string;
  label: string;
  confidence: number;
  x: number;
  y: number;
  w: number;
  h: number;
  color: string;
  dx: number;
  dy: number;
}

export const ComputerVisionFeed: React.FC = () => {
  const { overkillMode } = useSystem();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [boxes, setBoxes] = useState<BoundingBox[]>([
    { id: 'TRG-092', label: 'USER_COGNITION', confidence: 0.985, x: 80, y: 70, w: 120, h: 100, color: '#00f3ff', dx: 0.8, dy: 0.5 },
    { id: 'OBJ-442', label: 'INTERACTION_DEV', confidence: 0.892, x: 280, y: 150, w: 90, h: 80, color: '#0055ff', dx: -0.6, dy: 0.7 },
    { id: 'ENV-109', label: 'VOID_GRADIENT_BG', confidence: 0.941, x: 40, y: 220, w: 180, h: 90, color: '#00f3ff', dx: 0.4, dy: -0.4 }
  ]);

  const [scanCoords, setScanCoords] = useState({ x: 240, y: 180 });

  // Handle bounding box animations and canvas static feed
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let scanLineY = 0;
    let scanDirection = 1;

    const render = () => {
      const w = canvas.width;
      const h = canvas.height;

      // 1. Draw static camera noise / grain
      ctx.fillStyle = 'rgba(2, 8, 19, 0.9)';
      ctx.fillRect(0, 0, w, h);

      // Draw faint scan lines
      ctx.fillStyle = 'rgba(0, 243, 255, 0.02)';
      for (let y = 0; y < h; y += 4) {
        ctx.fillRect(0, y, w, 2);
      }

      // Draw vector scope grid lines
      ctx.strokeStyle = overkillMode ? 'rgba(255, 60, 0, 0.08)' : 'rgba(0, 243, 255, 0.08)';
      ctx.lineWidth = 0.5;
      
      // Vertical grid lines
      for (let x = 40; x < w; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      // Horizontal grid lines
      for (let y = 40; y < h; y += 40) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      // 2. Draw moving scan laser line
      scanLineY += 2 * scanDirection;
      if (scanLineY >= h || scanLineY <= 0) {
        scanDirection *= -1;
      }
      
      const grad = ctx.createLinearGradient(0, scanLineY - 10, 0, scanLineY + 10);
      const laserColor = overkillMode ? 'rgba(255, 60, 0, 0.18)' : 'rgba(0, 243, 255, 0.18)';
      const laserBright = overkillMode ? 'rgba(255, 60, 0, 0.8)' : 'rgba(0, 243, 255, 0.8)';
      
      grad.addColorStop(0, 'rgba(0,0,0,0)');
      grad.addColorStop(0.5, laserColor);
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      
      ctx.fillStyle = grad;
      ctx.fillRect(0, scanLineY - 10, w, 20);

      ctx.strokeStyle = laserBright;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, scanLineY);
      ctx.lineTo(w, scanLineY);
      ctx.stroke();

      // 3. Draw simulated camera static spikes periodically
      if (Math.random() > 0.98) {
        ctx.fillStyle = overkillMode ? 'rgba(255, 60, 0, 0.2)' : 'rgba(0, 243, 255, 0.15)';
        ctx.fillRect(0, Math.random() * h, w, Math.random() * 5 + 1);
      }

      // 4. Update and draw bounding boxes
      setBoxes((prevBoxes) =>
        prevBoxes.map((box) => {
          let nextX = box.x + box.dx;
          let nextY = box.y + box.dy;
          let nextDx = box.dx;
          let nextDy = box.dy;

          // Wall bounces
          if (nextX + box.w > w || nextX < 0) {
            nextDx *= -1;
            nextX = Math.max(0, Math.min(w - box.w, nextX));
          }
          if (nextY + box.h > h || nextY < 0) {
            nextDy *= -1;
            nextY = Math.max(0, Math.min(h - box.h, nextY));
          }

          const currentX = overkillMode ? nextX + (Math.random() - 0.5) * 1.5 : nextX;
          const currentY = overkillMode ? nextY + (Math.random() - 0.5) * 1.5 : nextY;

          // Draw Box
          const color = overkillMode ? '#ff3c00' : box.color;
          ctx.strokeStyle = color;
          ctx.lineWidth = 1.2;
          ctx.setLineDash([8, 4]);
          ctx.strokeRect(currentX, currentY, box.w, box.h);
          ctx.setLineDash([]);

          // Corner bracket accents on box
          ctx.strokeStyle = color;
          ctx.lineWidth = 2.5;
          const length = 12;
          
          // Top Left
          ctx.beginPath();
          ctx.moveTo(currentX, currentY + length);
          ctx.lineTo(currentX, currentY);
          ctx.lineTo(currentX + length, currentY);
          ctx.stroke();

          // Top Right
          ctx.beginPath();
          ctx.moveTo(currentX + box.w - length, currentY);
          ctx.lineTo(currentX + box.w, currentY);
          ctx.lineTo(currentX + box.w, currentY + length);
          ctx.stroke();

          // Bottom Left
          ctx.beginPath();
          ctx.moveTo(currentX, currentY + box.h - length);
          ctx.lineTo(currentX, currentY + box.h);
          ctx.lineTo(currentX + length, currentY + box.h);
          ctx.stroke();

          // Bottom Right
          ctx.beginPath();
          ctx.moveTo(currentX + box.w - length, currentY + box.h);
          ctx.lineTo(currentX + box.w, currentY + box.h);
          ctx.lineTo(currentX + box.w, currentY + box.h - length);
          ctx.stroke();

          // Draw Text labels
          ctx.fillStyle = color;
          ctx.font = '9px "Share Tech Mono", monospace';
          ctx.fillText(`[${box.id}] ${box.label}`, currentX + 4, currentY + box.h - 18);
          ctx.fillText(`CONF: ${(box.confidence * 100).toFixed(1)}%`, currentX + 4, currentY + box.h - 6);

          return { ...box, x: nextX, y: nextY, dx: nextDx, dy: nextDy };
        })
      );

      // 5. Draw center crosshair target lock
      const targetColor = overkillMode ? '#ff3c00' : '#00f3ff';
      ctx.strokeStyle = targetColor;
      ctx.lineWidth = 1;
      
      // Update target coordinate simulation
      if (Math.random() > 0.85) {
        setScanCoords({
          x: Math.floor(w * 0.2 + Math.random() * (w * 0.6)),
          y: Math.floor(h * 0.2 + Math.random() * (h * 0.6))
        });
      }

      ctx.beginPath();
      ctx.arc(scanCoords.x, scanCoords.y, 18, 0, Math.PI * 2);
      ctx.stroke();
      
      ctx.beginPath();
      ctx.moveTo(scanCoords.x - 28, scanCoords.y);
      ctx.lineTo(scanCoords.x - 6, scanCoords.y);
      ctx.moveTo(scanCoords.x + 6, scanCoords.y);
      ctx.lineTo(scanCoords.x + 28, scanCoords.y);
      ctx.moveTo(scanCoords.x, scanCoords.y - 28);
      ctx.lineTo(scanCoords.x, scanCoords.y - 6);
      ctx.moveTo(scanCoords.x, scanCoords.y + 6);
      ctx.lineTo(scanCoords.x, scanCoords.y + 28);
      ctx.stroke();

      // Coordinates text readout next to lock
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.fillText(`LOK_X: ${scanCoords.x}.084`, scanCoords.x + 22, scanCoords.y - 10);
      ctx.fillText(`LOK_Y: ${scanCoords.y}.114`, scanCoords.x + 22, scanCoords.y + 2);

      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [overkillMode, scanCoords.x, scanCoords.y]);

  const activeColor = overkillMode ? 'text-red-500 border-red-500/30' : 'text-cyber-cyan border-cyber-cyan/30';
  const cctvLabel = overkillMode ? 'OVERKILL CLOUD MATRIX' : 'SECURE CCTV NODE 04 // VECTOR_CV';

  return (
    <div className="cyber-panel flex-1 flex flex-col min-h-[360px] relative overflow-hidden select-none">
      
      {/* CCTV Title Bar */}
      <div className={`flex justify-between items-center px-4 py-2 border-b ${overkillMode ? 'border-red-500/20 bg-red-950/10' : 'border-cyber-cyan/20 bg-cyber-blue/10'} z-20`}>
        <div className="flex items-center gap-2">
          <Camera className={`w-4 h-4 animate-pulse ${overkillMode ? 'text-red-500' : 'text-cyber-cyan'}`} />
          <span className={`font-orbitron text-xs font-bold tracking-[2px] ${overkillMode ? 'text-red-500' : 'text-cyber-cyan'}`}>
            {cctvLabel}
          </span>
        </div>
        <div className={`font-sharetech text-[9px] border px-2 py-0.5 rounded ${activeColor}`}>
          FPS: 29.97 // RTSP_FEED
        </div>
      </div>

      {/* Main Canvas view */}
      <div className="flex-1 w-full h-full relative">
        <canvas 
          ref={canvasRef} 
          width={600} 
          height={380} 
          className="absolute inset-0 w-full h-full object-cover" 
        />
        
        {/* Floating AI HUD status indicators */}
        <div className="absolute top-4 left-4 z-20 font-sharetech text-[9px] text-white/50 flex flex-col gap-1 pointer-events-none bg-black/40 p-2 rounded border border-white/5">
          <div>FEED STATUS: ONLINE</div>
          <div>FOCUS ASPECT: 16:9</div>
          <div>ENCODER: NVENC H.264</div>
          <div>STREAM TYPE: DYNAMIC_COGNITIVE</div>
        </div>

        <div className="absolute bottom-4 right-4 z-20 font-sharetech text-[9px] text-white/50 flex flex-col gap-1 pointer-events-none bg-black/40 p-2 rounded border border-white/5 items-end">
          <div className="flex items-center gap-1">
            <Eye className="w-3 h-3 text-emerald-400" />
            <span>AI PATTERN MATCH: SECURE</span>
          </div>
          <div>TARGET COUNT: {boxes.length} ACTIVE</div>
          <div>GRID RATIO: 12x8 SCALES</div>
        </div>

        {/* Warning Indicator when in overkill mode */}
        {overkillMode && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none bg-red-500/[0.03] animate-pulse">
            <div className="bg-black/90 border border-red-500 p-4 rounded flex flex-col items-center gap-2 shadow-[0_0_25px_rgba(239,68,68,0.4)]">
              <ShieldAlert className="w-8 h-8 text-red-500 animate-bounce" />
              <span className="font-orbitron font-extrabold text-[11px] text-red-500 tracking-[3px] uppercase">
                COGNITIVE MATRIX OVERFLOW
              </span>
              <span className="font-sharetech text-[9px] text-red-400/70">
                CRITICAL THRESHOLD ENGAGED
              </span>
            </div>
          </div>
        )}

      </div>

    </div>
  );
};
