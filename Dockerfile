# Use Node.js LTS (Alpine for smaller size)
FROM node:20-alpine

# Create app directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (including dev for build)
RUN npm ci --ignore-scripts

# Copy app source
COPY . .

# Build CSS
RUN npm run build:css

# Create directory for persistent config/db
# Create directory for persistent config/db
RUN mkdir -p /app/data

# Prune dev dependencies to reduce image size
RUN npm prune --production

# Expose port
EXPOSE 8080

# Environment variables with defaults
ENV PORT=8080
ENV NODE_ENV=production
ENV ANTIGRAVITY_CONFIG_DIR=/app/data

# Start the server
CMD ["node", "src/index.js"]