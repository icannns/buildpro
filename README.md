# BuildPro - Construction Management System

Sistem manajemen proyek konstruksi dengan arsitektur microservices menggunakan Docker.

## 🚀 Technology Stack

- **Frontend:** React + Vite
- **Backend Services:**
  - API Gateway (Node.js)
  - Auth Service (Node.js)
  - Project Service (Node.js)
  - Material Service (Python/Flask)
  - Vendor Service (Go)
  - Budget Service (Java)
  - GraphQL Server (Node.js)
- **Database:** MySQL 8.0
- **Containerization:** Docker + Docker Compose

## 📋 Prerequisites

- Docker Desktop
- Git

## 🐳 Quick Start with Docker

1. **Clone repository**
```bash
git clone <your-repo-url>
cd BuildPro
```

2. **Start all services**
```bash
docker-compose up -d
```

3. **Access application**
- Frontend: http://localhost:5173
- API Gateway: http://localhost:5000
- GraphQL: http://localhost:5006/graphql

4. **Default login credentials**
```
Email: admin@buildpro.com
Password: 123456
```

## 🛠️ Development Commands

```bash
# Start all services
docker-compose up -d

# Stop all services
docker-compose down

# View logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f project-service

# Rebuild after code changes
docker-compose build [service-name]
docker-compose up -d [service-name]

# Rebuild all services
docker-compose build
docker-compose up -d
```

## 📦 Services & Ports

| Service | Port | Technology |
|---------|------|------------|
| Frontend Client | 5173 | React + Vite |
| API Gateway | 5000 | Node.js |
| Auth Service | 5004 | Node.js |
| Project Service | 5003 | Node.js |
| Material Service | 5002 | Python/Flask |
| Budget Service | 5001 | Java |
| Vendor Service | 5005 | Golang |
| GraphQL Server | 5006 | Node.js |
| MySQL Database | 3307 | MySQL 8.0 |

## 🔧 Configuration

Environment variables are configured in `docker-compose.yml`. Key configurations:

- Database host: `db` (Docker network)
- JWT Secret: Set in auth-service environment
- Service URLs: Configured in API Gateway

## 📁 Project Structure

```
BuildPro/
├── client/                 # React frontend
├── server/                 # GraphQL server
├── services/
│   ├── api-gateway/       # API Gateway
│   ├── auth-service/      # Authentication
│   ├── project-service/   # Project management
│   ├── material-service/  # Material management
│   ├── vendor-service/    # Vendor management
│   └── budget-service/    # Budget & payments
├── database/
│   └── schema.sql         # Database schema
└── docker-compose.yml     # Docker orchestration
```

## 🔐 Production Deployment

Before deploying to production:

1. **Enable authentication** in `services/api-gateway/middleware/auth.js`
2. **Set strong JWT_SECRET** in environment variables
3. **Change database password**
4. **Disable debug mode** in all services
5. **Use HTTPS** for all connections

## 📝 Database

Database schema and sample data are automatically set up when containers start. 

To access MySQL directly:
```bash
docker exec -it buildpro-db mysql -uroot -proot buildpro_db
```

## 🐛 Troubleshooting

**Containers not starting:**
```bash
docker-compose logs [service-name]
docker-compose restart [service-name]
```

**Port already in use:**
Change port mapping in `docker-compose.yml`:
```yaml
ports:
  - "5001:5000"  # Map to different host port
```

**Database connection failed:**
Wait for database health check, then restart services:
```bash
docker-compose restart project-service
```

## 👥 Contributors

- Your Name

## 📄 License

MIT License
