# Build context: repository root
# Railway settings: Root Directory = "." (repo root), Dockerfile path = "worker/Dockerfile"
FROM node:20-alpine
WORKDIR /app

# Install root dependencies so tsc can resolve ../db/schema.ts imports
# (e.g. drizzle-orm/pg-core, next-auth/adapters)
COPY package*.json ./
RUN npm install

# Copy shared DB schema and index
COPY db/ ./db/

# Install worker dependencies
COPY worker/package*.json ./worker/
WORKDIR /app/worker
RUN npm install

# Copy worker source and build
COPY worker/ ./
RUN npm run build

CMD ["node", "dist/worker/src/index.js"]
