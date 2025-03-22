import express from 'express';
import cors from 'cors';
import routes from './routes/routes.js';

const app = express();
const port = process.env.PORT || 3001;

const allowedOrigins = [
    'http://localhost:5173',
    'https://github.gatech.edu',
    'https://github.gatech.edu/pages/nabe7/sleep-app'
];

const corsOptions = {
    origin: function(origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          console.log('Blocked by CORS:', origin);
          callback(new Error('Not allowed by CORS'));
        }
      },
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
  
app.listen(port, () => {
  console.log(`Port: ${port}`);
});