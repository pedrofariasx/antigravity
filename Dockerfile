# Use Node.js LTS (Alpine for smaller size)
FROM node:20-alpine

# Create app directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (including dev for build)
RUN npm ci

# Copy app source
COPY . .

# Create directory for persistent config/db
RUN mkdir -p /root/.config/antigravity

# Prune dev dependencies to reduce image size
RUN npm prune --production

# Expose port
EXPOSE 8080

# Environment variables with defaults
ENV PORT=8080
ENV NODE_ENV=production

# Start the server
CMD ["node", "src/index.js"]