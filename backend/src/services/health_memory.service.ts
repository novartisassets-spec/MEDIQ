import { DatabaseService } from './database.service';

export class HealthMemoryService {
  /**
   * Fetches and formats a "Health Snapshot" for the AI prompt.
   * This is what gives MEDIQ his "Memory."
   */
  static async getHealthSnapshot(userId: string): Promise<string> {
    const history = await DatabaseService.getUserHealthHistory(userId);
    
    let snapshot = "=== SOVEREIGN HEALTH SNAPSHOT ===\n\n";

    if (!history || history.length === 0) {
      snapshot += "USER HEALTH HISTORY: This is the first report for this user. Establish a baseline.\n";
    } else {
      // Group biomarkers by name to show trends
      const trends: Record<string, any[]> = {};
      history.forEach(b => {
        if (!trends[b.name]) trends[b.name] = [];
        trends[b.name].push({ value: b.value, date: b.recorded_at, unit: b.unit, range: b.reference_range });
      });

      snapshot += "USER HEALTH HISTORY (LONGITUDINAL TRENDS):\n";
      for (const [name, values] of Object.entries(trends)) {
        const sorted = values.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        const latest = sorted[0];
        const previous = sorted[1];
        
        snapshot += `- ${name}: ${latest.value} ${latest.unit || ''} (Ref: ${latest.range || 'N/A'}). `;
        if (previous) {
          const diffValue = latest.value - previous.value;
          const diffPercent = ((diffValue / previous.value) * 100).toFixed(1);
          snapshot += `Previously ${previous.value} on ${new Date(previous.date).toLocaleDateString()}. Shift: ${diffValue >= 0 ? '+' : ''}${diffPercent}%.`;
        }
        snapshot += "\n";
      }
    }
    
    // 2. Fetch Last Visual Analysis from cross-session memory
    snapshot += "\nVISUAL CLINICAL HISTORY (LAST IMAGE SYMPTOMS):\n";
    try {
      const lastAnalysis = await DatabaseService.getLastVisualAnalysis(userId);
      if (lastAnalysis && lastAnalysis.data) {
        snapshot += `- Last finding (Recorded ${new Date(lastAnalysis.data.created_at).toLocaleDateString()}): ${lastAnalysis.data.content}\n`;
      } else {
        snapshot += "- No prior visual symptoms or dermatological records found in memory.\n";
      }
    } catch (e) {
      snapshot += "- Visual memory link currently recalibrating.\n";
    }

    return snapshot;
  }
}
