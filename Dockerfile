# Use Node.js 20 as base image with PostgreSQL
FROM node:20-alpine

# Install PostgreSQL and supervisor for process management
RUN apk add --no-cache postgresql postgresql-contrib supervisor

# Set working directory
WORKDIR /app

# Copy package files first for better Docker layer caching
COPY package*.json ./

# Install all dependencies (including devDependencies for build)
RUN npm ci

# Copy application code
COPY . .

# Copy initialization scripts and supervisor config
COPY docker/init-schema.js ./init-schema.js
COPY docker/supervisord.conf /etc/supervisor/conf.d/supervisord.conf

# Build the application
RUN npm run build

# Keep drizzle-kit for database migrations in production
RUN npm ci --only=production && npm install drizzle-kit && npm cache clean --force

# Set up PostgreSQL
RUN mkdir -p /var/lib/postgresql/data /var/run/postgresql
RUN chown -R postgres:postgres /var/lib/postgresql /var/run/postgresql

# Initialize PostgreSQL database
USER postgres
RUN initdb -D /var/lib/postgresql/data
RUN echo "host all all 0.0.0.0/0 md5" >> /var/lib/postgresql/data/pg_hba.conf
RUN echo "listen_addresses='*'" >> /var/lib/postgresql/data/postgresql.conf

# Switch back to root to set up supervisor
USER root

# Create necessary directories for supervisor
RUN mkdir -p /var/log/supervisor

# Set up PostgreSQL user and create database directory
RUN mkdir -p /var/lib/postgresql/data && \
    chown -R postgres:postgres /var/lib/postgresql && \
    chmod 700 /var/lib/postgresql/data

# Expose port
EXPOSE 5000

# Set environment variables
ENV NODE_ENV=production
ENV PORT=5000
ENV DATABASE_URL=postgresql://postgres:postgres@localhost:5432/nonprofit_connect

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/api/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })" || exit 1

# Start supervisor to manage PostgreSQL and Node.js app
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]