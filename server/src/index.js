import express from 'express';
import cors from 'cors';
import routes from './routes/routes.js';

const app = express();
const port = process.env.PORT || 3001;

const corsOptions = {
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: false,
    allowedHeaders: ['Content-Type', 'Authorization']
}

app.use(cors(corsOptions));
app.use(express.json());

// Routes
app.use('/api', routes);

app.get('/', (req, res) => {
    res.json({ message: 'Server is running!' });
});

app.post('/api/test', (req, res) => {
    console.log('Received data:', req.body);
    res.json({
        message: 'Test successful for POST',
        receivedData: req.body,
        timestamp: new Date()
    });
});
  
app.listen(port, () => {
  console.log(`Port: ${port}`);
});