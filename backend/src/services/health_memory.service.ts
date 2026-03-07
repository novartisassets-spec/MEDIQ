import { DatabaseService } from './database.service';
import { BiomarkerData } from '../types/medical';

export class HealthMemoryService {
  /**
   * Fetches and formats a "Health Snapshot" for the AI prompt.
   * This is what gives Julian his "Memory."
   */
  static async getHealthSnapshot(userId: string): Promise<string> {
    const history = await DatabaseService.getUserHealthHistory(userId);
    
    if (!history || history.length === 0) {
      return "This is the first report for this user. Establish a baseline.";
    }

    // Group biomarkers by name to show trends
    const trends: Record<string, any[]> = {};
    history.forEach(b => {
      if (!trends[b.name]) trends[b.name] = [];
      trends[b.name].push({ value: b.value, date: b.recorded_at });
    });

    // Create a concise summary for the prompt
    let snapshot = "USER HEALTH HISTORY (TRENDS):\n";
    for (const [name, values] of Object.entries(trends)) {
      const sorted = values.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      const latest = sorted[0];
      const previous = sorted[1];
      
      snapshot += `- ${name}: Currently ${latest.value}. `;
      if (previous) {
        const diff = ((latest.value - previous.value) / previous.value * 100).toFixed(1);
        snapshot += `(Previously ${previous.value} on ${new Date(previous.date).toLocaleDateString()}. ${diff}% change).`;
      }
      snapshot += "\n";
    }

    return snapshot;
  }
}
