import fs from 'fs';
import path from 'path';

export function loadKnowledgeBase(filename: string): string {
  try {
    const filePath = path.join(process.cwd(), 'docs', filename);
    return fs.readFileSync(filePath, 'utf-8');
  } catch (error) {
    console.error(`Error loading knowledge base file: ${filename}`, error);
    return '';
  }
}
