# Multi-stage build for React + Vite application

# ===================================
# Stage 1: Build the application
# ===================================
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Build-time variables used by Vite during `npm run build`
ARG VITE_API_URL
ARG VITE_GOOGLE_MAPS_API_KEY
ARG VITE_JITSI_DOMAIN
ENV VITE_API_URL=${VITE_API_URL}
ENV VITE_GOOGLE_MAPS_API_KEY=${VITE_GOOGLE_MAPS_API_KEY}
ENV VITE_JITSI_DOMAIN=${VITE_JITSI_DOMAIN}
ENV HUSKY=0

# Copy package files
COPY package*.json ./

# Install dependencies (including devDependencies for build)
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build && node scripts/write-csp-header.mjs /tmp/jobloom-security-headers.conf

# ===================================
# Stage 2: Production with Nginx
# ===================================
FROM nginx:alpine AS production

# Install curl for healthcheck
RUN apk add --no-cache curl

# Copy custom nginx configuration
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
RUN mkdir -p /etc/nginx/snippets
COPY --from=builder /tmp/jobloom-security-headers.conf /etc/nginx/snippets/jobloom-security-headers.conf

# Copy built assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Add healthcheck
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD curl -f http://localhost/health || exit 1

# Expose port
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]

# ===================================
# Stage 3: Development (optional)
# ===================================
FROM node:20-alpine AS development

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host"]
