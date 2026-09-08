# 🚀 StockPilot Production Deployment Guide

This guide covers deploying StockPilot to production cloud platforms (such as **Render**, **Railway**, **AWS**, or **DigitalOcean** for the backend, and **Vercel** for the frontend).

---

## 1. System Requirements

- **Node.js**: v18.0.0 or higher (v20+ recommended)
- **Database**: MySQL Server 8.0+ or SQLite for zero-config instances
- **AI Services**: Groq API Key (`GROQ_API_KEY`)
- **Email Service**: Brevo REST API Key (`BREVO_API_KEY`) for firewall-free email delivery over HTTPS Port 443

---

## 2. Environment Variables Specification

Set the following variables in your cloud hosting dashboard (e.g., Render / Railway):

```bash
# Server Environment
NODE_ENV=production
PORT=5000

# Client Application URL (For CORS Authorization)
CLIENT_URL=https://your-frontend-domain.vercel.app

# Database Configuration
# Use 'mysql' for production MySQL database or 'sqlite' for local persistent SQLite
DB_DIALECT=mysql
DB_HOST=your-mysql-cloud-host.com
DB_PORT=3306
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_NAME=stockpilot_prod

# JWT Authentication Secrets
JWT_ACCESS_SECRET=your_super_strong_jwt_access_secret_key_2026
JWT_REFRESH_SECRET=your_super_strong_jwt_refresh_secret_key_2026
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Groq LLM Reasoning Engine
GROQ_API_KEY=gsk_your_groq_api_key_here

# Email Dispatch (Brevo HTTPS REST API - Recommended for Cloud)
# Dispatches emails over HTTPS (Port 443), bypassing cloud SMTP port 587 firewalls
BREVO_API_KEY=xkeysib-your-brevo-api-key-here
EMAIL_USER=your-brevo-login-email@gmail.com
EMAIL_FROM="StockPilot Operations" <your-brevo-login-email@gmail.com>

# Optional: Cloudinary for Product Image Uploads
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# Optional: Twilio SMS Alerts
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=+1234567890
SMS_ENABLED=true
```

---

## 3. Why Brevo HTTPS REST API is Used for Cloud Deployments

> [!IMPORTANT]
> Free and standard tier cloud hosting providers (e.g., Render, AWS EC2, DigitalOcean) **block outbound TCP on SMTP ports 25, 465, and 587** by default to prevent spam.

StockPilot includes a **Universal Email Dispatcher** (`server/src/services/emailService.js`):
1. When `BREVO_API_KEY` (`xkeysib-...`) is present, it routes all emails through **Brevo's REST API (`https://api.brevo.com/v3/smtp/email`) over standard HTTPS Port 443**.
2. Port 443 is never blocked by cloud firewalls, ensuring **0ms socket timeouts and instant delivery**.

---

## 4. Frontend Deployment (Vercel)

1. Connect your GitHub repository to [Vercel](https://vercel.com).
2. Set **Root Directory** to `client`.
3. Set **Build Command** to `npm run build`.
4. Set **Output Directory** to `dist`.
5. Add Environment Variable:
   - `VITE_API_URL` = `https://your-backend-service.onrender.com/api`
6. Click **Deploy**.

---

## 5. Backend Deployment (Render / Railway)

1. Connect your GitHub repository to [Render](https://render.com).
2. Choose **Web Service** with **Root Directory** set to `server` (or repository root).
3. Set **Build Command**: `npm run install:all` (or `npm install`).
4. Set **Start Command**: `npm start`.
5. In **Environment Variables**, paste all keys from Section 2.
6. Trigger manual deployment or push to `main` branch for automatic deployment.
