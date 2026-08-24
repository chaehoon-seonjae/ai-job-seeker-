# Use official Node LTS
FROM node:20-bullseye

# Install Python and pip
RUN apt-get update && apt-get install -y python3 python3-pip python3-venv && rm -rf /var/lib/apt/lists/*

# Set working dir
WORKDIR /usr/src/app

# Copy package files and install
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev

# Copy app
COPY . .

# Install k-skill Python deps if any will be needed at runtime (we'll install pip packages when required)
# Optionally install @nomadamas/k-skill if it provides pip requirements; we'll rely on npx to fetch the package at runtime.

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

CMD [ "node", "node_modules/next/dist/bin/next", "start" ]
