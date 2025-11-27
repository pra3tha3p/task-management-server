# --- Stage 1: The Builder ---
# This stage builds the application
FROM node:22-alpine AS builder

WORKDIR /app

# Copy package files and install ALL dependencies (including dev)
COPY package*.json ./
RUN npm install

# Copy the rest of the source code
COPY . .

# Run the build command to create the /app/build directory
RUN npm run build

# --- Stage 2: The Final Image ---
# This stage creates the small, final image
FROM node:22-alpine

WORKDIR /app

# Copy package files again
COPY package*.json ./

# Install ONLY production dependencies
RUN npm install 

# Copy the built application from the 'builder' stage
COPY --from=builder /app/build ./build

# Expose the application port
EXPOSE 4002

# Command to run the built application
CMD ["node", "build/index.js"]

