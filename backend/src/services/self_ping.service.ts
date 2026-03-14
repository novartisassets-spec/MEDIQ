import fetch from 'node-fetch';

/**
 * Self-Ping Service: The "Pulse"
 * Keeps the Render instance alive by pinging its own health endpoint
 * at randomized intervals to mimic natural activity.
 */
export class SelfPingService {
  private static intervalId: NodeJS.Timeout | null = null;
  private static readonly HEALTH_ENDPOINT = process.env.RENDER_EXTERNAL_URL 
    ? `${process.env.RENDER_EXTERNAL_URL}/api/v1/health` 
    : `http://localhost:${process.env.PORT || 3000}/api/v1/health`;

  static start() {
    if (this.intervalId) return;

    console.log(`[Pulse] Initializing self-ping service for ${this.HEALTH_ENDPOINT}`);

    const scheduleNextPing = () => {
      // Random interval between 10 and 14 minutes (Render free tier sleeps after 15 mins)
      const delay = Math.floor(Math.random() * (14 - 10 + 1) + 10) * 60 * 1000;
      
      this.intervalId = setTimeout(async () => {
        try {
          const start = Date.now();
          const response = await fetch(this.HEALTH_ENDPOINT);
          const duration = Date.now() - start;
          
          if (response.ok) {
            console.log(`[Pulse] Vitality check successful (${duration}ms). Instance remains active.`);
          } else {
            console.warn(`[Pulse] Vitality check returned status: ${response.status}`);
          }
        } catch (error: any) {
          console.error(`[Pulse] Vitality check failed: ${error.message}`);
        }
        
        scheduleNextPing(); // Recursively schedule the next random ping
      }, delay);
    };

    scheduleNextPing();
  }

  static stop() {
    if (this.intervalId) {
      clearTimeout(this.intervalId);
      this.intervalId = null;
      console.log(`[Pulse] Self-ping service terminated.`);
    }
  }
}
