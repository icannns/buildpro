# BuildPro Authentication System - Setup Guide

## ✅ What's Been Implemented

We've successfully implemented a **complete authentication and authorization system** for BuildPro:

### 1. Database Schema (MySQL)
- ✅ `users` table with email, password_hash, name, role
- ✅ `user_sessions` table for JWT token management
- ✅ 4 default users with different roles

### 2. Authentication Service (Port 5005)
- ✅ JWT-based authentication
- ✅ Bcrypt password hashing
- ✅ Role-based access control (RBAC)
- ✅ Endpoints: `/register`, `/login`, `/verify`, `/me`, `/logout`

### 3. API Gateway Updates
- ✅ Authentication middleware on all API routes
- ✅ Public routes: `/api/auth/*`
- ✅ Protected routes: all other endpoints require JWT token
- ✅ User info forwarding to microservices

### 4. Frontend (React)
- ✅ Login page with beautiful UI
- ✅ Auth context for state management
- ✅ Protected routes
- ✅ Auto-redirect to login if not authenticated
- ✅ Logout functionality

---

## 🚀 Quick Start

### Step 1: Database Setup (Already Done)

The database has been set up with:
```bash
node services/auth-service/setup-db.js
```

### Step 2: Start All Services

Use the updated startup script:
```powershell
.\start-all.ps1
```

This will start (in order):
1. **Auth Service** - Port 5005
2. **API Gateway** - Port 5000
3. **Project Service** - Port 5001  
4. **Material Service** - Port 5002
5. **Vendor Service** - Port 5003
6. **Budget Service** - Port 5004
7. **Frontend (React)** - Port 5173 or 3000
8. **Vendor Portal** - Port 5006

### Step 3: Access the Application

Open your browser to:
- **Main App**: http://localhost:5173 (or http://localhost:3000)
- You'll be redirected to the login page

---

## 👤 Default User Accounts

| Email | Password | Role | Permissions |
|-------|----------|------|-------------|
| admin@buildpro.com | admin123 | ADMIN | Full system access |
| pm@buildpro.com | pm123 | PROJECT_MANAGER | Projects, Materials, Payments (read/write) |
| vendor@buildpro.com | vendor123 | VENDOR | Materials (read + update price) |
| viewer@buildpro.com | viewer123 | VIEWER | Read-only access |

---

## 🔐 How Authentication Works

### Login Flow:
1. User enters email/password on login page
2. Frontend sends POST to `/api/auth/login`
3. Auth service validates credentials
4. If valid, returns JWT token + user info
5. Frontend stores token in localStorage
6. All subsequent API calls include token in `Authorization: Bearer <token>` header

### Protected Routes:
- API Gateway intercepts all `/api/*` requests
- Checks for valid JWT token (except `/api/auth/*`)
- If invalid/missing: returns 401 Unauthorized
- If valid: forwards request to appropriate microservice with user info

### Logout:
- Removes token from localStorage
- Redirects to login page

---

## 📝 API Examples

### Login
```javascript
POST http://localhost:5000/api/auth/login
Content-Type: application/json

{
  "email": "admin@buildpro.com",
  "password": "admin123"
}

Response:
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "email": "admin@buildpro.com",
      "name": "Admin User",
      "role": "ADMIN"
    }
  }
}
```

### Access Protected Endpoint
```javascript
GET http://localhost:5000/api/projects
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

Response:
{
  "success": true,
  "data": [...]
}
```

---

## 🔄 Role-Based Permissions

### ADMIN
- Full CRUD on projects, materials, payments
- User management

### PROJECT_MANAGER  
- Read/Write projects
- Read/Write materials
- Read/Write payments

### VENDOR
- Read materials
- Update material prices

### VIEWER
- Read-only access to all resources

---

## 🛠 Troubleshooting

### Issue: "Access token required"
**Solution**: Make sure you're logged in and the token is being sent with requests.

### Issue: "Invalid or expired token"
**Solution**: Token expires after 24 hours. Logout and login again.

### Issue: Auth service won't start
**Solution**: 
```bash
cd services/auth-service
npm install
node index.js
```

### Issue: Database connection error
**Solution**: Ensure MySQL is running and `buildpro_db` database exists.

---

## 📦 Dependencies Added

### Auth Service:
- express
- jsonwebtoken
- bcrypt
- mysql2
- joi
- cors

### API Gateway:
- jsonwebtoken (added)

### Frontend (Client):
- axios (added)

---

## 🎯 Next Steps (Optional Enhancements)

1. **Input Validation** - Add Joi validators to all services
2. **Rate Limiting** - Prevent brute force attacks
3. **Refresh Tokens** - Implement token refresh mechanism
4. **Email Verification** - Send verification emails on registration
5. **Password Reset** - "Forgot password" functionality
6. **Audit Logging** - Track all user actions
7. **Session Management** - View and revoke active sessions

---

## 📚 File Structure

```
BuildPro/
├── database/
│   ├── users-schema.sql          # User tables
│   └── seed-users.sql             # Default users
├── services/
│   ├── auth-service/              # NEW
│   │   ├── index.js
│   │   ├── db.js
│   │   ├── config/roles.js
│   │   ├── middleware/auth.js
│   │   ├── validators/authValidator.js
│   │   ├── setup-db.js
│   │   └── generate-seeds.js
│   └── api-gateway/
│       ├── index.js               # UPDATED
│       └── middleware/
│           ├── auth.js            # NEW
│           └── errorHandler.js    # NEW
└── client/src/
    ├── context/
    │   └── AuthContext.jsx        # NEW
    ├── utils/
    │   └── api.js                 # NEW
    ├── pages/
    │   └── Login.jsx              # NEW
    └── App.jsx                    # UPDATED
```

---

## ✅ Verification Checklist

- [x] Database tables created
- [x] Default users seeded
- [x] Auth service runs on port 5005
- [x] Login endpoint works
- [x] JWT tokens generated correctly
- [x] API Gateway requires authentication
- [x] Frontend login page displays
- [x] Protected routes redirect to login
- [x] Logout functionality works

**All systems operational! ✨**
