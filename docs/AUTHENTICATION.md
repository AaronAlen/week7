# Authentication System

## Architecture

StockPilot implements JWT (JSON Web Token) access & refresh token authentication combined with Bcrypt password hashing.

1. **Password Security**: User passwords are never saved in plain text. They are hashed using Bcrypt with a salt factor of 10 (`bcrypt.genSalt(10)`).
2. **Access Tokens**: Short-lived JWTs (default 15 minutes) signed with `JWT_ACCESS_SECRET`. Included in HTTP requests via `Authorization: Bearer <token>`.
3. **Refresh Tokens**: Long-lived JWTs (default 7 days) signed with `JWT_REFRESH_SECRET`. Used via `/api/auth/refresh` to renew expired access tokens automatically without forcing user re-login.
4. **Client Interceptor**: Axios response interceptor intercepts 401 Unauthorized responses, executes refresh flow seamlessly, and retries original requests.
