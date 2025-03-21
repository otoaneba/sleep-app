const API_URL = 'http://localhost:3001/api';

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

export const streamAzureAI = (data: any) => {
  return new Promise((resolve, reject) => {
      const eventSource = new EventSource(`${API_URL}/test-client-stream/stream?data=${encodeURIComponent(JSON.stringify(data))}`);
      
      let accumulatedData = '';

      eventSource.onmessage = (event) => {
          accumulatedData += event.data;
          // You can process partial data here as it streams
          console.log('Partial data:', event.data);
      };

      eventSource.onerror = (error) => {
          eventSource.close();
          reject(error);
      };

      eventSource.onopen = () => {
          console.log('Streaming connection opened');
      };

      // Optional: Add a way to close the connection when complete
      eventSource.addEventListener('end', () => {
          eventSource.close();
          resolve(accumulatedData);
      });
  });
};