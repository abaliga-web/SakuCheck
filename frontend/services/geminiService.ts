import { GoogleGenAI } from '@google/genai';
import { SYSTEM_PROMPT } from '../constants';
import { DiagnosticMetadata } from '../types';

// Initialize the SDK strictly using process.env.API_KEY and vertexai: true
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY, vertexai: true });

/**
 * Converts a File object to a base64 string.
 */
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        // Remove the data URL prefix (e.g., "data:image/jpeg;base64,")
        const base64Data = reader.result.split(',')[1];
        resolve(base64Data);
      } else {
        reject(new Error('Failed to convert file to base64'));
      }
    };
    reader.onerror = (error) => reject(error);
  });
};

/**
 * Helper for exponential backoff retry
 */
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Analyzes the crop image using Gemini with retry logic.
 */
export const analyzeCropImage = async (
  imageFile: File,
  metadata: DiagnosticMetadata,
  maxRetries = 3
): Promise<string> => {
  const base64Image = await fileToBase64(imageFile);
  const mimeType = imageFile.type;

  const userPrompt = `
Metadata provided by farmer:
- Location in Hokkaido: ${metadata.location || 'Not specified'}
- Current Season: ${metadata.season || 'Not specified'}

Please analyze the attached image based on the system instructions.
  `.trim();

  let attempt = 0;
  
  while (attempt < maxRetries) {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: {
          role: 'user',
          parts: [
            {
              inlineData: {
                data: base64Image,
                mimeType: mimeType,
              },
            },
            {
              text: userPrompt,
            },
          ],
        },
        config: {
          systemInstruction: SYSTEM_PROMPT,
          temperature: 0.2, // Low temperature for more factual, consistent diagnostic output
        },
      });

      if (!response.text) {
        throw new Error('No text returned from the model.');
      }

      return response.text;
    } catch (error: any) {
      attempt++;
      console.error(`Attempt ${attempt} failed:`, error);
      
      // Check if it's a 4xx error (client error, usually shouldn't retry except 429 Too Many Requests)
      const status = error?.status || error?.response?.status;
      const isClientError = status >= 400 && status < 500 && status !== 429;
      
      if (isClientError || attempt >= maxRetries) {
        throw new Error('診断中にエラーが発生しました。もう一度お試しください。 (Error during diagnosis. Please try again.)');
      }
      
      // Exponential backoff: 1s, 2s, 4s...
      const delay = Math.pow(2, attempt - 1) * 1000;
      await sleep(delay);
    }
  }
  
  throw new Error('診断中にエラーが発生しました。もう一度お試しください。 (Error during diagnosis. Please try again.)');
};
