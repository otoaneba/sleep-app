# Sleep Analysis App

Welcome to the Sleep Analysis App! This app allows you to log and analyze your sleep data. Further, it uses Azure AI to analyze your sleep data and provide you with a summary of your sleep. It also has a feature to generate a sleep schedule to help you adjust or fix your jet lag; this feature is also useful for shift workers who frequently have to shift their sleep schedule.

## Running the App

1. Clone the repository
2. Run `npm install` to install the dependencies
3. Run `npm run dev` to start the development server
4. Run `npm run start` to start the production server

## Running in production

1. Run `npm ci --omit=dev` to install only production dependencies.
2. Run `npm start`, which will set NODE_ENV to production and start the server.
  a. Alternatively, you can run `docker build -t sleep-analysis-app .` and then `docker run -p 3001:3001 sleep-analysis-app` to start the server in Docker.
  b. For environment variables, you can set them in the `.env` file or use the `.env.example` file to create your own `.env` file.

3. Check it runs on `http://localhost:3001`

## Running in development

1. Run `npm install` to install the dependencies.
2. Run `npm run dev` to start the development server.


