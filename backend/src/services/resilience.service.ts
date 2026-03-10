export class ResilienceService {
  /**
   * Generic execution wrapper with triple-redundancy and automatic key rotation.
   */
  static async executeWithResilience<T>(
    provider: 'GEMINI' | 'GROQ',
    operation: (apiKey: string) => Promise<T>,
    retries: number = 3
  ): Promise<T> {
    let lastError: any;
    
    // Attempt with each available key (up to 3)
    for (let attempt = 1; attempt <= retries; attempt++) {
      const apiKey = process.env[`${provider}_API_KEY_${attempt}`];
      
      if (!apiKey) {
        console.warn(`[Resilience] ${provider} key ${attempt} not found. Skipping...`);
        continue;
      }

      try {
        console.log(`[Resilience] Executing ${provider} operation with key #${attempt}...`);
        return await operation(apiKey);
      } catch (error: any) {
        lastError = error;
        
        // Handle common rate-limit or authentication errors (429, 401, etc.)
        const isRateLimited = error?.status === 429 || error?.message?.includes('429');
        const isQuotaExceeded = error?.message?.includes('quota');

        if (isRateLimited || isQuotaExceeded) {
          console.error(`[Resilience] ${provider} key #${attempt} failed (Rate Limit/Quota). Rotating...`);
        } else {
          console.error(`[Resilience] ${provider} key #${attempt} failed:`, error.message);
        }

        if (attempt === retries) {
          console.error(`[Resilience] All ${retries} ${provider} keys exhausted.`);
          throw lastError;
        }
      }
    }
    
    throw lastError || new Error(`Failed to execute ${provider} operation.`);
  }
}
