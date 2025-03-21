import express from 'express';
const router = express.Router();
import azureService from '../services/azureService.js';

router.post('/test-client', async (req, res) => {
    try {
        const sleepData = req.body;
        console.log("Creating client");
        const client = await azureService.callAzureAIService(sleepData);
        res.json({ message: 'Client created successfully', client });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ 
            error: error.message,
            stack: error.stack 
        });
    }
});

router.post('/test-client-stream/stream', async (req, res) => {
    console.log("Streaming data");
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    try {
        const sleepData = req.body;
        const stream = azureService.streamAzureAIService(sleepData);

        for await (const chunk of stream) {
            res.write(chunk);
        }
        
        res.end();
    } catch (error) {
        res.write(`data: Error: ${error.message}\n\n`);
        res.end();
    }
});

export default router;