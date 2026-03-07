import fs from 'fs';
import path from 'path';

export class PromptManager {
  private static promptsPath = path.join(__dirname, '..', 'prompts');

  static getPrompt(filename: string): string {
    const filePath = path.join(this.promptsPath, filename);
    try {
      return fs.readFileSync(filePath, 'utf-8');
    } catch (error) {
      console.error(`[PromptManager] Error reading prompt: ${filename}`, error);
      throw new Error(`Failed to load prompt: ${filename}`);
    }
  }

  static formatPrompt(template: string, variables: Record<string, string>): string {
    let formatted = template;
    for (const [key, value] of Object.entries(variables)) {
      formatted = formatted.replace(new RegExp(`{{${key}}}`, 'g'), value);
    }
    return formatted;
  }
}
