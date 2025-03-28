import { API_URL } from './config';
import { SleepData } from '../models/sleep';

export const analyzeWithAzureAI = async (data: any) => {
  try {
    const response = await fetch(`${API_URL}/test-client`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error calling Azure AI:', error);
    throw error;
  }
};

export const streamAzureAI = async (
  sleepData: SleepData,
  onChunk: (chunk: string) => void,
  onError: (error: string) => void
) => {
  try {
    console.log("Streaming Azure AI URL", API_URL);
    const response = await fetch(`${API_URL}/test-client-stream/stream`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sleepData),
    });

    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    if (!response.body) throw new Error('Response body is null');

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      onChunk(decoder.decode(value));
    }
  } catch (error) {
    onError(error instanceof Error ? error.message : 'Unknown error');
  }
};