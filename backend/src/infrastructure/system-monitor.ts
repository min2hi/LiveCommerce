import { createLogger } from '../../shared/logger';

const logger = createLogger('SystemMonitor');

export class SystemMonitor {
  private static intervalId?: NodeJS.Timeout;
  private static isDegradedFlag = false;
  private static lastCpuUsage = process.cpuUsage();
  private static lastCheckTime = Date.now();
  
  // CPU Threshold to trigger degraded mode (90%)
  private static readonly DEGRADATION_THRESHOLD = 90;

  /**
   * Khởi động quá trình lấy mẫu CPU định kỳ
   * @param intervalMs Thời gian chu kỳ lấy mẫu (mặc định 5000ms = 5s)
   */
  static start(intervalMs: number = 5000): void {
    if (this.intervalId) return;

    this.lastCpuUsage = process.cpuUsage();
    this.lastCheckTime = Date.now();

    this.intervalId = setInterval(() => {
      const currentUsage = process.cpuUsage(this.lastCpuUsage);
      const now = Date.now();
      const timeDeltaMs = now - this.lastCheckTime;

      // process.cpuUsage trả về microseconds (1 ms = 1000 microseconds)
      const userCpuMs = currentUsage.user / 1000;
      const systemCpuMs = currentUsage.system / 1000;
      
      const totalCpuMs = userCpuMs + systemCpuMs;
      
      // % CPU = Tổng thời gian dùng CPU / Tổng thời gian thực tế chạy * 100
      const cpuPercent = (totalCpuMs / timeDeltaMs) * 100;

      // Cập nhật trạng thái cho lượt tính sau
      this.lastCpuUsage = process.cpuUsage();
      this.lastCheckTime = now;

      // Check Graceful Degradation (Nếu >= ngưỡng thì ngắt mạch)
      if (cpuPercent >= this.DEGRADATION_THRESHOLD) {
        if (!this.isDegradedFlag) {
          logger.warn(`[Graceful Degradation] WARNING: CPU Spike detected (${cpuPercent.toFixed(1)}%). System is entering degraded mode! AiChat will be disabled.`);
          this.isDegradedFlag = true;
        }
      } else if (cpuPercent < this.DEGRADATION_THRESHOLD - 10) {
        // Phải xuống dưới 80% (Threshold - 10) mới gỡ mạch để tránh chập chờn (Flapping)
        if (this.isDegradedFlag) {
          logger.info(`[Graceful Degradation] CPU cooled down (${cpuPercent.toFixed(1)}%). System recovered. AiChat re-enabled.`);
          this.isDegradedFlag = false;
        }
      }
    }, intervalMs);
    
    logger.info(`System Monitor started. Sampling CPU every ${intervalMs}ms.`);
  }

  static stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
      logger.info('System Monitor stopped.');
    }
  }

  static isDegraded(): boolean {
    return this.isDegradedFlag;
  }
}
