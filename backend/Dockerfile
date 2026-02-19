FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Push schema to DB and start server
CMD sh -c "npx drizzle-kit push --force && npm run dev"
