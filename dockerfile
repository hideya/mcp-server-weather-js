# Use Node.js LTS image
FROM node:20-slim

# Create app directory
WORKDIR /usr/src/app

# Copy all source files first
COPY . .

# Install dependencies
RUN npm install

# Command to run the MCP server
CMD ["node", "dist/index.js"]