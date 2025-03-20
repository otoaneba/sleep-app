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