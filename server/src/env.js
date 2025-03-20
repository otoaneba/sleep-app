import dotenv from 'dotenv';
dotenv.config();

if (process.env.NODE_ENV === 'production') {
    dotenv.config({ path: '.env.production' });
} else {
    dotenv.config({ path: '.env.development' });
}

export const config = {
    AZURE_ENDPOINT: process.env.AZURE_ENDPOINT,
    AZURE_API_KEY: process.env.AZURE_API_KEY,
    AZURE_TENANT_ID: process.env.AZURE_TENANT_ID,
    AZURE_CLIENT_ID: process.env.AZURE_CLIENT_ID,
    AZURE_CLIENT_SECRET: process.env.AZURE_CLIENT_SECRET,
    ENV: process.env.NODE_ENV || 'development'
};

console.log("running in", config.ENV)