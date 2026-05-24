# Base image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy dependency files first
COPY package.json package-lock.json /app/

# Install dependencies
RUN npm install

# Copy source files
COPY . /app/

# Expose Next.js port
EXPOSE 3000

# Start development server binding to all interfaces
CMD ["npm", "run", "dev", "--", "--hostname", "0.0.0.0"]
