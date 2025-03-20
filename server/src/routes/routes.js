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

export default router;