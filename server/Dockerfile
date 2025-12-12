FROM node:18-alpine

# Install dependencies for building native modules (bcrypt)
RUN apk add --no-cache python3 make g++

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 5006

CMD ["node", "index.js"]
