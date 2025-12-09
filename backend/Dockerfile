# Backend - Node.js App
FROM node:18

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 5000
ENV NODE_ENV=production

CMD ["node", "index.js"]
