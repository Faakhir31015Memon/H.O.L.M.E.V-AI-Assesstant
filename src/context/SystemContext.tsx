import React, { createContext, useContext, useState, useEffect } from 'react';
import { confirmOnGateway, executeOnGateway, type ExecuteResponse } from '../core/holmevClient';
import { playChirp, playConfirm, playWarning, startReactorHum, stopReactorHum, speak } from '../utils/sound';

export type SystemStateType = 'IDLE' | 'LISTENING' | 'PROCESSING' | 'ERROR';

export interface LogEntry {
  timestamp: string;
  source: string;
  text: string;
  level: 'info' | 'warn' | 'success';
}

export interface Metrics {
  cpu: number;
  gpu: number;
  neuralLoad: number;
  latency: number;
}

interface SystemContextProps {
  systemState: SystemStateType;
  overkillMode: boolean;
  cvStackActive: boolean;
  logs: LogEntry[];
  metrics: Metrics;
  setSystemState: (state: SystemStateType) => void;
  toggleOverkillMode: () => void;
  toggleCvStack: () => void;
  addLog: (text: string, source: string, level?: 'info' | 'warn' | 'success') => void;
  executeCommand: (cmdText: string) => void;
  confirmPending: () => void;
  pendingConfirm: ExecuteResponse | null;
  triggerPill: (pillKey: string) => void;
  lastCommand: ExecuteResponse | null;
}

const SystemContext = createContext<SystemContextProps | undefined>(undefined);

const HOLMEV_RESPONSES = {
  greeting: [
    "Core logic engines active. State parameters.",
    "Quantum sync status is optimal. Awaiting parameters."
  ],
  diagnostics: [
    "Running system check: logic sectors, quantum integrity, neural balance...",
    "Diagnostics complete: CPU Cores [OK], Neural Queues [OK], Coherence coefficient at 0.9998."
  ],
  security: [
    "Compiling firewall grids... complete.",
    "Applied Tritium Intrusion Containment protocols. Threat vectors monitored."
  ],
  purge: [
    "Flushing active temporary execution cache registers...",
    "Optimized 4.82 GB indexes. Logic space recovered."
  ],
  overkill: [
    "WARNING: Disengaging quantum energy thresholds.",
    "Overclocking logical matrices to 250%... systems peaking.",
    "ALL LIMITS REMOVED. HYPER-MODE ENFORCED."
  ],
  cvStack: [
    "Initializing computer vision RTSP capture modules...",
    "Spatial convolution grids loaded. Object tracking: ON."
  ],
  unknown: [
    "Syntax exception: command parameter not indexed.",
    "Decoding failure. Clarify inputs or run diagnostics."
  ]
};

export const SystemProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [systemState, setSystemState] = useState<SystemStateType>('IDLE');
  const [overkillMode, setOverkillMode] = useState(false);
  const [cvStackActive, setCvStackActive] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [metrics, setMetrics] = useState<Metrics>({
    cpu: 12.4,
    gpu: 28.5,
    neuralLoad: 48.2,
    latency: 8
  });
  const [pendingConfirm, setPendingConfirm] = useState<ExecuteResponse | null>(null);
  const [lastCommand, setLastCommand] = useState<ExecuteResponse | null>(null);

  // Timestamp generator helper
  const getTimestamp = () => {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
  };

  // Safe log logging
  const addLog = (text: string, source: string, level: 'info' | 'warn' | 'success' = 'info') => {
    setLogs((prev) => [
      ...prev,
      { timestamp: getTimestamp(), source, text, level }
    ]);
  };

  // Prepopulate boot logs on startup & trigger initial TTS / hum
  useEffect(() => {
    addLog("INITIALIZING H.O.L.M.E.V. HYPER-SYSTEM CORE...", "SYSTEM", "warn");
    
    // Start reactor hum ambient sound
    startReactorHum(false);

    // Initial voice greeting
    setTimeout(() => {
      speak("Holographic system operational logic and machine execution vector active. Reactor core nominal.");
    }, 800);

    setTimeout(() => addLog("LOAD MODULE: NEURAL_LOGIC_VECTOR_ENGINE... SUCCESS.", "AI_BACKEND", "success"), 250);
    setTimeout(() => addLog("LOAD MODULE: QUANTUM_SYNC_STABILIZER... COHERENCE COEF 0.9998.", "SYSTEM", "success"), 500);
    setTimeout(() => addLog("FIREWALL ENFORCED: QUANTUM TRITIUM BARRIER LOADED.", "SYSTEM", "success"), 750);
    setTimeout(() => addLog("SYSTEM CALIBRATED AND ARMED. STANDING BY...", "SYSTEM", "success"), 1000);

    return () => {
      stopReactorHum();
    };
  }, []);

  // Update telemetry metrics with smooth fluctuations
  useEffect(() => {
    const interval = setInterval(() => {
      let cpuBase = 12.0, cpuRange = 4.0;
      let gpuBase = 28.0, gpuRange = 6.0;
      let neuralBase = 48.0, neuralRange = 5.0;
      let latencyBase = 8, latencyRange = 4;

      if (systemState === 'LISTENING') {
        cpuBase = 25.0; cpuRange = 8.0;
        gpuBase = 45.0; gpuRange = 8.0;
        neuralBase = 65.0; neuralRange = 10.0;
      } else if (systemState === 'PROCESSING') {
        cpuBase = 82.0; cpuRange = 12.0;
        gpuBase = 88.0; gpuRange = 8.0;
        neuralBase = 92.0; neuralRange = 6.0;
        latencyBase = 12; latencyRange = 5;
      }

      if (overkillMode) {
        cpuBase += 15.0;
        gpuBase += 10.0;
        latencyBase = 3;
        latencyRange = 2;
      }

      setMetrics({
        cpu: Math.min(100, Math.max(0, cpuBase + (Math.random() - 0.5) * cpuRange)),
        gpu: Math.min(100, Math.max(0, gpuBase + (Math.random() - 0.5) * gpuRange)),
        neuralLoad: Math.min(100, Math.max(0, neuralBase + (Math.random() - 0.5) * neuralRange)),
        latency: Math.max(2, Math.floor(latencyBase + Math.random() * latencyRange))
      });
    }, 1500);

    return () => clearInterval(interval);
  }, [systemState, overkillMode]);

  // Periodic ambient logs
  useEffect(() => {
    const interval = setInterval(() => {
      if (systemState !== 'IDLE') return;
      const ambientLogs = [
        "SYSTEM HEALTH MONITOR: All logic sectors nominal.",
        "CLEANUP REGISTERS: Temp index buffer cleared.",
        "SECURE ROUTING: Signal routing tables optimized.",
        "CORE TEMP: System heat dissipation stabilized at 34.2C."
      ];
      const randomMsg = ambientLogs[Math.floor(Math.random() * ambientLogs.length)];
      addLog(randomMsg, "SYSTEM", "info");
    }, 9000);

    return () => clearInterval(interval);
  }, [systemState]);

  // Typewriter effect simulator for logs
  const simulateHolmevResponse = (responses: string[]) => {
    responses.forEach((res, index) => {
      setTimeout(() => {
        addLog(res, "AI_BACKEND", "info");
      }, (index + 1) * 600);
    });
  };

  // Toggle overkill state
  const toggleOverkillMode = () => {
    setOverkillMode((prev) => {
      const next = !prev;
      if (next) {
        document.body.classList.add('overkill-mode');
        addLog("SYSTEM WARNING: SECURITY RATIOS DISENGAGED. OVERCLOCK ACTIVE.", "SYSTEM", "warn");
        playWarning();
        speak("Warning. Reactor core overclocked. Limits disengaged. System power yield peaking.");
        startReactorHum(true);
      } else {
        document.body.classList.remove('overkill-mode');
        addLog("SYSTEM RESTORE: Standard safety thresholds re-engaged.", "SYSTEM", "success");
        playConfirm();
        speak("Reactor core stabilized. Default security protocols active.");
        startReactorHum(false);
      }
      return next;
    });
  };

  // Toggle computer vision stack
  const toggleCvStack = () => {
    setCvStackActive((prev) => {
      const next = !prev;
      if (next) {
        addLog("CV STACK: Spatial convolutions activated.", "VISION_CV", "success");
        playConfirm();
        speak("Initializing computer vision sweep. Camera feed live.");
        simulateHolmevResponse(HOLMEV_RESPONSES.cvStack);
      } else {
        addLog("CV STACK: Shutdown command executed. Camera streams offline.", "VISION_CV", "warn");
        playChirp();
        speak("Computer vision feed offline.");
      }
      return next;
    });
  };

  const applyGatewayResult = (result: ExecuteResponse) => {
    setLastCommand(result);
    addLog(
      `[${result.risk}] ${result.command?.command ?? "n/a"}:${result.command?.action ?? ""} → ${result.status}`,
      "COMMAND",
      result.status === "denied" || result.status === "error" ? "warn" : "success"
    );
    addLog(result.spokenReply, "AI_BACKEND", "info");
    speak(result.spokenReply);

    const cmd = result.command;
    if (result.status === "needs_confirmation") {
      setPendingConfirm(result);
      playWarning();
      return;
    }
    setPendingConfirm(null);
    playConfirm();

    if (cmd?.command?.startsWith("cctv")) {
      if (!cvStackActive) toggleCvStack();
    }
    if (cmd?.command === "ui.mode" && cmd.action === "overkill") {
      toggleOverkillMode();
    }
  };

  const executeCommand = (cmdText: string) => {
    if (!cmdText.trim()) return;

    playChirp();
    addLog(cmdText, "USER", "info");
    setSystemState("PROCESSING");

    void (async () => {
      try {
        const result = await executeOnGateway(cmdText);
        applyGatewayResult(result);
      } catch {
        addLog("Command center offline — using local HUD fallback.", "SYSTEM", "warn");
        const lower = cmdText.toLowerCase();
        if (lower.includes("diag") || lower.includes("status")) {
          speak("Scanning logic sectors. Coherence coefficient is zero point nine nine nine eight.");
          simulateHolmevResponse(HOLMEV_RESPONSES.diagnostics);
        } else if (lower.includes("overkill") || lower.includes("overclock")) {
          toggleOverkillMode();
        } else if (lower.includes("cv") || lower.includes("vision") || lower.includes("cam") || lower.includes("cctv")) {
          toggleCvStack();
        } else {
          speak("Query not recognized. Start the command center with npm run dev:api.");
          simulateHolmevResponse(HOLMEV_RESPONSES.unknown);
        }
      } finally {
        setSystemState("IDLE");
      }
    })();
  };

  const confirmPending = () => {
    if (!pendingConfirm?.confirmToken) return;
    setSystemState("PROCESSING");
    void (async () => {
      try {
        const result = await confirmOnGateway(pendingConfirm.confirmToken!);
        applyGatewayResult(result);
      } catch {
        addLog("Confirmation failed — command center unreachable.", "SYSTEM", "warn");
      } finally {
        setSystemState("IDLE");
      }
    })();
  };

  // Trigger from preset pill shortcuts
  const triggerPill = (pillKey: string) => {
    playChirp();
    setSystemState('PROCESSING');
    addLog(`EXECUTE PILL: ${pillKey.toUpperCase()}`, "USER", "info");

    setTimeout(() => {
      setSystemState('IDLE');
      playConfirm();
      if (pillKey === 'diagnostics') {
        speak("Initiating diagnostic routines. Logic matrices normal.");
        simulateHolmevResponse(HOLMEV_RESPONSES.diagnostics);
      } else if (pillKey === 'security') {
        speak("Applied security firewall updates. All systems secure.");
        simulateHolmevResponse(HOLMEV_RESPONSES.security);
      } else if (pillKey === 'purge') {
        speak("Index databases fully optimized.");
        simulateHolmevResponse(HOLMEV_RESPONSES.purge);
      } else if (pillKey === 'overkill') {
        toggleOverkillMode();
        simulateHolmevResponse(HOLMEV_RESPONSES.overkill);
      } else if (pillKey === 'cv') {
        toggleCvStack();
      }
    }, 1200);
  };

  return (
    <SystemContext.Provider value={{
      systemState,
      overkillMode,
      cvStackActive,
      logs,
      metrics,
      setSystemState,
      toggleOverkillMode,
      toggleCvStack,
      addLog,
      executeCommand,
      confirmPending,
      pendingConfirm,
      triggerPill,
      lastCommand
    }}>
      {children}
    </SystemContext.Provider>
  );
};

export const useSystem = () => {
  const context = useContext(SystemContext);
  if (context === undefined) {
    throw new Error('useSystem must be used within a SystemProvider');
  }
  return context;
};
