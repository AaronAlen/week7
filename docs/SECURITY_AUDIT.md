# Security Audit & Risk Assessment

## Implemented Controls

1. **Password Hashing**: Bcrypt with salt factor 10. Plain-text passwords are never stored or logged.
2. **JWT Security**: Dual-token strategy (Access Token 15m, Refresh Token 7d). Tokens contain non-sensitive payload fields (`id`, `email`, `role`).
3. **Role Authorization (RBAC)**: All protected endpoints are wrapped with `authenticateToken` and `authorizeRoles`.
4. **SQL Injection Protection**: All query parameters sanitized via Sequelize parameterized queries & ORM methods.
5. **Input Validation**: Request body parameters validated against strict Zod schemas before hitting business logic.
6. **File Upload Security**: Restricted extensions to image mime-types (`jpeg`, `png`, `webp`, `gif`) and capped at 5MB per file.
7. **CORS Configuration**: Restricts origin domain requests to configured `CLIENT_URL`.
8. **Sensitive Error Protection**: Stack traces and raw internal error details are suppressed in production mode.
