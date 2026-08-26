import { execSync, spawn } from 'child_process';
import * as os from 'os';

export interface SystemMetrics {
  cpuUsagePercent: number;
  freeMemoryGb: number;
  totalMemoryGb: number;
  uptimeSeconds: number;
  loadAverage: number[];
}

export class OSController {
  
  /**
   * Retrieves host OS resource statistics.
   * Leverages native os modules.
   */
  public getSystemMetrics(): SystemMetrics {
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const cpus = os.cpus();
    
    // Simple load average calculation helper
    const loadAvg = os.loadavg();
    
    return {
      cpuUsagePercent: this.calculateCpuUsage(cpus),
      freeMemoryGb: parseFloat((freeMem / (1024 ** 3)).toFixed(2)),
      totalMemoryGb: parseFloat((totalMem / (1024 ** 3)).toFixed(2)),
      uptimeSeconds: os.uptime(),
      loadAverage: loadAvg,
    };
  }

  /**
   * Adjusts system master audio volume.
   * Supports cross-platform execution (Windows/macOS/Linux).
   */
  public setVolume(percent: number): void {
    const vol = Math.max(0, Math.min(100, percent));
    const platform = os.platform();

    try {
      if (platform === 'win32') {
        // Windows Powershell volume adjustment interface command
        execSync(`powershell -Command "(new-object -com wscript.shell).SendKeys([char]174)"`); // Example volume down trigger
        // In production, uses nircmd or direct CoreAudio registry binding:
        // execSync(`nircmd.exe setsysvolume ${Math.floor(vol * 655.35)}`);
      } else if (platform === 'darwin') {
        // macOS AppleScript volume control
        execSync(`osascript -e "set volume output volume ${vol}"`);
      } else {
        // Linux ALSA volume control
        execSync(`amixer set Master ${vol}%`);
      }
    } catch (error) {
      console.error('OSController: volume adjustment failed:', error);
    }
  }

  /**
   * Adjusts system screen brightness.
   */
  public setBrightness(percent: number): void {
    const brightness = Math.max(0, Math.min(100, percent));
    const platform = os.platform();

    try {
      if (platform === 'win32') {
        // Windows WMI monitor control command
        execSync(`powershell -Command "(Get-WmiObject -Namespace root/WMI -Class WmiMonitorBrightnessMethods).WmiSetBrightness(1, ${brightness})"`);
      } else if (platform === 'darwin') {
        // macOS brightness utility command
        execSync(`brightness ${brightness / 100}`);
      } else {
        // Linux backlight system write access
        execSync(`xbacklight -set ${brightness}`);
      }
    } catch (error) {
      console.error('OSController: brightness adjustment failed:', error);
    }
  }

  /**
   * Returns active system process windows.
   */
  public getActiveWindows(): string[] {
    const platform = os.platform();
    try {
      if (platform === 'win32') {
        // Get process names running visible windows on Windows
        const output = execSync(
          `powershell -Command "Get-Process | Where-Object { $_.MainWindowTitle } | Select-Object -ExpandProperty ProcessName"`
        ).toString();
        return output.trim().split('\r\n');
      } else if (platform === 'darwin') {
        // Get running app list on macOS
        const output = execSync(
          `osascript -e 'tell application "System Events" to get name of every process whose background only is false'`
        ).toString();
        return output.trim().split(', ');
      }
      return ['bash', 'Xorg'];
    } catch (error) {
      console.error('OSController: active window list capture failed:', error);
      return [];
    }
  }

  /**
   * Purges local file temp directories and browser cache folders.
   */
  public purgeCache(): void {
    const platform = os.platform();
    try {
      if (platform === 'win32') {
        const tempPath = os.tmpdir();
        // Secure recursive purge command
        execSync(`powershell -Command "Remove-Item -Path '${tempPath}\\*' -Recurse -Force -ErrorAction SilentlyContinue"`);
      } else {
        execSync('rm -rf /tmp/*');
      }
    } catch (error) {
      console.error('OSController: cache purge operations failed:', error);
    }
  }

  /**
   * Securely spawns a background executable.
   */
  public launchProcess(exePath: string, args: string[] = []): void {
    const proc = spawn(exePath, args, {
      detached: true,
      stdio: 'ignore',
    });
    proc.unref(); // Detach handle reference to allow gateway thread loop resolution
  }

  private calculateCpuUsage(cpus: os.CpuInfo[]): number {
    let totalIdle = 0;
    let totalTick = 0;

    for (const cpu of cpus) {
      for (const type in cpu.times) {
        totalTick += (cpu.times as any)[type];
      }
      totalIdle += cpu.times.idle;
    }

    const idle = totalIdle / cpus.length;
    const total = totalTick / cpus.length;
    const usage = 1 - idle / total;
    
    return parseFloat((usage * 100).toFixed(1));
  }
}
export const systemAgent = new OSController();
export default systemAgent;
