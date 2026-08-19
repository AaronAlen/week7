# Deployment Guide

## Production Requirements

1. **Node.js**: v18.0.0 or higher.
2. **Database**: MySQL Server 8.0+ (Set `DB_DIALECT=mysql` in production `.env`).
3. **Environment Setup**:
   ```bash
   NODE_ENV=production
   PORT=5000
   DB_DIALECT=mysql
   DB_HOST=your-mysql-host
   DB_USER=your-mysql-user
   DB_PASSWORD=your-mysql-password
   DB_NAME=stockpilot_prod
   JWT_ACCESS_SECRET=long_random_production_secret
   JWT_REFRESH_SECRET=long_random_production_refresh_secret
   CLIENT_URL=https://your-production-app.com
   ```

## Production Build & Start

1. Install root dependencies:
   ```bash
   npm run install:all
   ```
2. Build frontend client:
   ```bash
   cd client && npm run build
   ```
3. Run database seed / migrations:
   ```bash
   cd server && npm run seed
   ```
4. Start backend server:
   ```bash
   cd server && npm start
   ```
