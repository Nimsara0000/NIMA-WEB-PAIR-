FROM node:lts-buster

# Install dependencies
RUN apt-get update && \
  apt-get install -y --no-install-recommends \
    ffmpeg \
    imagemagick \
    webp && \
  apt-get clean && \
  rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /usr/src/app

# Copy package info and install dependencies
COPY package*.json ./

RUN npm install || exit 1 && \
    npm install -g qrcode-terminal pm2

# Copy application source
COPY . .

# Expose port
EXPOSE 5000

# Start app
CMD ["npm", "start"]
