FROM node:18-alpine

WORKDIR /app
COPY package*json package-lock.json ./
RUN npm ci --omit=dev

# copy app source AFTER dependencies are installed
COPY . .

ENV NODE_ENV=production
EXPOSE 8080

CMD ["node", "src/index.js"]