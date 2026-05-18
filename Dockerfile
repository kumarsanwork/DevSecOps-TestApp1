# ============================================================
# Dockerfile - DevSecOps Demo App
# Note: Uses older base image intentionally for Container Scan demo
# ============================================================

# IaC/Container Scan Finding: Using old Node image with known CVEs
FROM node:14-alpine

# IaC/Container Scan Finding: Running as root user (no USER directive)
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy source
COPY . .

# IaC/Container Scan Finding: Exposing default port with no restriction
EXPOSE 3000

# IaC/Container Scan Finding: No health check defined
# HEALTHCHECK --interval=30s --timeout=3s CMD wget -qO- http://localhost:3000/health || exit 1

# Start app
CMD ["node", "app.js"]
