# Build context: repository root
# Railway settings: Root Directory = "." (repo root), Dockerfile path = "worker/Dockerfile"
FROM node:20-alpine
WORKDIR /app

# Copy shared DB schema and index (needed at compile time and runtime)
COPY db/ ./db/

# Install worker dependencies
COPY worker/package*.json ./worker/
WORKDIR /app/worker
RUN npm install

# Copy worker source and build
COPY worker/ ./
RUN npm run build

CMD ["node", "dist/worker/src/index.js"]
