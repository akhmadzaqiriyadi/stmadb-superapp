// src/services/cron.service.ts
import cron from 'node-cron';
import { attendanceService } from '../modules/pkl/attendance/attendance.service.js';

class CronService {
  private jobs: Map<string, cron.ScheduledTask> = new Map();

  /**
   * Initialize all cron jobs
   */
  init() {
    console.log('🕐 Initializing cron jobs...');

    // Auto Tap Out at 23:59 daily (WIB timezone)
    // Cron format: second minute hour day month weekday
    // '0 59 23 * * *' = Every day at 23:59:00
    const autoTapOutJob = cron.schedule(
      '0 59 23 * * *',
      async () => {
        console.log('[Cron] 🤖 Running auto tap out job...');
        try {
          const result = await attendanceService.autoTapOutPendingAttendance();
          console.log(`[Cron] ✅ Auto tap out completed: ${result.count} students processed`);
          
          if (result.count > 0) {
            console.log('[Cron] Details:', result.details);
          }
        } catch (error) {
          console.error('[Cron] ❌ Auto tap out failed:', error);
        }
      },
      {
        timezone: 'Asia/Jakarta', // WIB timezone
      }
    );

    this.jobs.set('autoTapOut', autoTapOutJob);
    console.log('✅ Cron job "autoTapOut" configured at 23:59 WIB daily');
  }

  /**
   * Start all cron jobs
   */
  start() {
    this.jobs.forEach((job, name) => {
      job.start();
      console.log(`▶️  Cron job "${name}" started`);
    });
  }

  /**
   * Stop all cron jobs
   */
  stop() {
    this.jobs.forEach((job, name) => {
      job.stop();
      console.log(`⏸️  Cron job "${name}" stopped`);
    });
  }

  /**
   * Get job status
   */
  getStatus() {
    const status: any = {};
    this.jobs.forEach((job, name) => {
      status[name] = {
        running: job.getStatus() === 'scheduled',
      };
    });
    return status;
  }

  /**
   * Manually trigger auto tap out (for testing)
   */
  async triggerAutoTapOut() {
    console.log('[Manual Trigger] Running auto tap out...');
    try {
      const result = await attendanceService.autoTapOutPendingAttendance();
      console.log('[Manual Trigger] Result:', result);
      return result;
    } catch (error) {
      console.error('[Manual Trigger] Error:', error);
      throw error;
    }
  }
}

export const cronService = new CronService();
