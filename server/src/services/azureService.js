import { config } from "../env.js";

import { DefaultAzureCredential } from "@azure/identity";
import ModelClient, { isUnexpected } from "@azure-rest/ai-inference";

class AzureService {
    constructor() {
        this.endpoint = config.AZURE_ENDPOINT;
        this.apiKey = config.AZURE_API_KEY;
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
            if (config.ENV === 'production') {
                credential = new ClientSecretCredential(
                    config.TENANT_ID,
                    config.CLIENT_ID,
                    config.CLIENT_SECRET
                );

            } else {

                const credential = new DefaultAzureCredential();
                const client = new ModelClient(this.endpoint, credential, clientOptions);
                console.log("Client initialized successfully");

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
            }
        } catch (error) {
            console.error('Client initialization error:', {
                message: error.message,
                name: error.name,
                stack: error.stack
            });
            process.exit(1);
        }
    }
}

export default new AzureService();