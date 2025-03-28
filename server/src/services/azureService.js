import { config } from "../env.js";

import { DefaultAzureCredential, ClientSecretCredential } from "@azure/identity";
import ModelClient, { isUnexpected } from "@azure-rest/ai-inference";
import { createSseStream } from "@azure/core-sse";

class AzureService {
    constructor() {
        this.endpoint = config.AZURE_ENDPOINT;
        if (config.ENV === 'production') {
            this.tenantId = config.AZURE_TENANT_ID;
            this.clientId = config.AZURE_CLIENT_ID;
            this.clientSecret = config.AZURE_CLIENT_SECRET;
            console.log("Azure credentials found", this.tenantId, this.clientId, this.clientSecret);
        } else {
            this.apiKey = config.AZURE_API_KEY;
        }
    }

    async callAzureAIService(sleepData) {
        const deploymentId = "DeepSeek-V3";
        const clientOptions = {
            credentials: {
                scopes: ["https://cognitiveservices.azure.com/.default"]
            }
        };
        let credential;

        const prompt = `Analyze this sleep data:
            Sleep Quality: ${sleepData.sleepQuality}
            Number of Wake-ups: ${sleepData.wakeUps}
            Sleep Time: ${sleepData.sleepTime}
            Wake Time: ${sleepData.wakeTime}
            Duration: ${sleepData.duration} hours
            
            Please provide insights about sleep quality, patterns, and suggestions for improvement.`;

        try {
            if (config.ENV === 'production' && (!this.tenantId || !this.clientId || !this.clientSecret)) {
                throw new Error("Azure credentials not found");
            }
            if (config.ENV === 'production') {
                credential = new ClientSecretCredential(
                    this.tenantId,
                    this.clientId,
                    this.clientSecret
                );
            } else {
                credential = new DefaultAzureCredential();
            }

            const client = new ModelClient(this.endpoint, credential, clientOptions);
            console.log("Client initialized successfully: ", prompt);

            const response = await client.path("chat/completions").post({
                body: {
                    messages: [{ role: "user", content: prompt }],
                    model: deploymentId,
                    stream: false
                }
            })

            if (isUnexpected(response)) {
                throw response.body.error;
            }

            console.log("Response from Azure AI Service:")
            console.log(response.body.choices[0].message.content);
        } catch (error) {
            console.error('Client initialization error:', {
                message: error.message,
                name: error.name,
                stack: error.stack
            });
            throw error;
        }
    }

    // Streaming method
    async *streamAzureAIService(sleepData) {
        const deploymentId = "DeepSeek-V3";
        const clientOptions = {
            credentials: {
                scopes: ["https://cognitiveservices.azure.com/.default"]
            }
        };
        let credential;

        const prompt = `Analyze this sleep data:
            Sleep Quality: ${sleepData.sleepQuality}
            Number of Wake-ups: ${sleepData.wakeUps}
            Sleep Time: ${sleepData.sleepTime}
            Wake Time: ${sleepData.wakeUpTime}
            Duration: ${sleepData.sleepDuration} hours
            
            Please provide insights about sleep quality, patterns, and suggestions for improvement.`;

        try {
            if (config.ENV === 'production' && (!this.tenantId || !this.clientId || !this.clientSecret)) {
                throw new Error("Azure credentials not found");
            }

            credential = config.ENV === 'production'
                ? new ClientSecretCredential(this.tenantId, this.clientId, this.clientSecret)
                : new DefaultAzureCredential();

            const client = new ModelClient(this.endpoint, credential, clientOptions);

            console.log("Client initialized successfully");
            
            const response = await client.path("chat/completions").post({
                body: {
                    messages: [{ role: "user", content: prompt }],
                    model: deploymentId,
                    stream: true // Ensure streaming is enabled
                }
            }).asNodeStream();

            const stream = response.body;

            if (!stream) {
                throw new Error("The response stream is undefined");
            }
              
            if (response.status !== "200") {
                throw new Error("Failed to get chat completions");
            }

            const sses = createSseStream(stream);
            let buffer = '';

            for await (const event of sses) {
                if (event.data === "[DONE]") {
                    return;
                }
                const data = JSON.parse(event.data);
                if (data.choices && data.choices[0]?.delta?.content) {
                    const content = data.choices[0].delta.content;

                    //yield data.choices[0].delta.content;
                    buffer += content;
                    if (content.match(/\s+/)) {  // Check for whitespace
                        yield buffer;
                        buffer = '';
                    }
                }
            }
            if (buffer) {
                yield buffer;
            }
        } catch (error) {
            console.error('Streaming error:', {
                message: error.message,
                name: error.name,
                stack: error.stack
            });
            throw error;
        }
    }
}

export default new AzureService();