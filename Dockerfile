# Stage 1: Build
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json yarn.lock ./

# Install dependencies
RUN yarn install --frozen-lockfile

# Copy source code
COPY . .

# Build the TypeScript code
RUN yarn build

# Stage 2: Production
FROM node:20-alpine AS runner

# Set working directory
WORKDIR /app

# Install production dependencies only
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile --production

# Install TypeScript and type definitions needed for LangGraph CLI
RUN yarn add --dev typescript @types/node

# Copy built code from builder stage
COPY --from=builder /app/build ./build
COPY --from=builder /app/src ./src
COPY --from=builder /app/langgraph.json ./langgraph.json
COPY --from=builder /app/tsconfig.json ./tsconfig.json

# Create empty .env file (environment variables are passed via docker-compose)
RUN touch .env

# Set environment variables
ENV NODE_ENV=production
ENV PORT=8000
# Enable JSON imports for langgraph CLI on Node 20
ENV NODE_OPTIONS="--experimental-json-modules"

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Install LangGraph CLI globally (pin latest requested version)
RUN npm install -g @langchain/langgraph-cli@1.1.2

# Run the agent server using the global CLI
CMD ["langgraph", "dev", "--host", "0.0.0.0", "--port", "8000", "--no-browser"]
