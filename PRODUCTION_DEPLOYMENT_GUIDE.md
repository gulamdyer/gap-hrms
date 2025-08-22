# 🚀 GAP HRMS Production Deployment Guide

This guide provides step-by-step instructions for deploying the GAP HRMS application to production, including database setup, backend deployment, and frontend deployment.

## 📋 Prerequisites

### Production Server Requirements
- **OS**: Ubuntu 20.04+ or CentOS 8+
- **Node.js**: 18.x or 20.x LTS
- **Oracle Instant Client**: 19c or 21c
- **PM2**: For process management
- **Nginx**: For reverse proxy (optional)
- **SSL Certificate**: For HTTPS

### Oracle Database Requirements
- **Oracle Database**: 19c or 21c
- **User**: Dedicated user with appropriate privileges
- **Tablespace**: Sufficient space for HRMS tables
- **Network**: Accessible from production server

## 🔧 Step 1: Production Server Setup

### 1.1 Install Node.js
```bash
# Ubuntu/Debian
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# CentOS/RHEL
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
sudo yum install -y nodejs
```

### 1.2 Install Oracle Instant Client
```bash
# Download Oracle Instant Client
wget https://download.oracle.com/otn_software/linux/instantclient/219000/instantclient-basic-linux.x64-21.9.0.0.0dbru.zip

# Extract and install
unzip instantclient-basic-linux.x64-21.9.0.0.0dbru.zip
sudo mv instantclient_21_9 /opt/oracle/instantclient_21_9

# Set environment variables
echo 'export ORACLE_HOME=/opt/oracle/instantclient_21_9' >> ~/.bashrc
echo 'export LD_LIBRARY_PATH=/opt/oracle/instantclient_21_9:$LD_LIBRARY_PATH' >> ~/.bashrc
echo 'export PATH=/opt/oracle/instantclient_21_9:$PATH' >> ~/.bashrc
source ~/.bashrc
```

### 1.3 Install PM2
```bash
sudo npm install -g pm2
```

## 🗄️ Step 2: Database Migration

### 2.1 Create Production Database User
```sql
-- Connect as SYSTEM or SYS
CREATE USER HRMS_PROD IDENTIFIED BY "SecurePassword123!";
GRANT CONNECT, RESOURCE TO HRMS_PROD;
GRANT CREATE SESSION TO HRMS_PROD;
GRANT CREATE TABLE TO HRMS_PROD;
GRANT CREATE SEQUENCE TO HRMS_PROD;
GRANT CREATE VIEW TO HRMS_PROD;
GRANT CREATE PROCEDURE TO HRMS_PROD;
GRANT UNLIMITED TABLESPACE TO HRMS_PROD;
```

### 2.2 Run Database Migration
```bash
# Clone the repository
git clone <your-repo-url>
cd GAP HRMS/backend

# Install dependencies
npm install

# Create production environment file
cp env.example .env
```

### 2.3 Configure Production Environment
Edit `.env` file:
```env
# Production Environment
NODE_ENV=production
PORT=5000

# Oracle Database Configuration
ORACLE_USER=HRMS_PROD
ORACLE_PASSWORD=SecurePassword123!
ORACLE_CONNECT_STRING=(DESCRIPTION=(ADDRESS=(PROTOCOL=TCP)(HOST=your-db-host)(PORT=1521))(CONNECT_DATA=(SERVICE_NAME=your-service-name)))

# JWT Configuration
JWT_SECRET=your-super-secure-jwt-secret-key-here
JWT_EXPIRES_IN=24h

# Rate Limiting (Production)
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# CORS Configuration
CORS_ORIGIN=https://your-frontend-domain.com

# Logging
LOG_LEVEL=info
```

### 2.4 Execute Database Migration
```bash
# Test database connection
node test-oracle-connection.js

# Run complete database migration
node database-migration.js

# Verify tables created
node -e "
const { executeQuery } = require('./config/database');
(async () => {
  try {
    const result = await executeQuery('SELECT table_name FROM user_tables WHERE table_name LIKE \'HRMS_%\' ORDER BY table_name');
    console.log('✅ Created tables:', result.rows.map(row => row[0]));
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
})();
"
```

### 2.5 Run Additional Migrations (if needed)
```bash
# Enhanced calendar tables
node migrate-enhanced-calendar-tables.js

# Weekly holidays
node migrate-weekly-holidays.js

# Pay grades table
node migrate-pay-grades-table.js

# Employee-shift-paygrade assignments
node migrate-employee-shift-paygrade.js

# Populate settings data
node populate-settings-data.js
```

## 🖥️ Step 3: Backend Deployment

### 3.1 Deploy Backend Application
```bash
# Navigate to backend directory
cd backend

# Install production dependencies
npm install --production

# Create PM2 ecosystem file
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'gap-hrms-backend',
    script: 'server.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    max_memory_restart: '1G',
    restart_delay: 4000,
    max_restarts: 10,
    min_uptime: '10s'
  }]
};
EOF

# Create logs directory
mkdir -p logs

# Start application with PM2
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 startup script
pm2 startup
```

### 3.2 Configure Nginx (Optional)
```bash
# Install Nginx
sudo apt-get install nginx

# Create Nginx configuration
sudo tee /etc/nginx/sites-available/gap-hrms-backend << 'EOF'
server {
    listen 80;
    server_name your-backend-domain.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

# Enable site
sudo ln -s /etc/nginx/sites-available/gap-hrms-backend /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 3.3 Setup SSL with Let's Encrypt
```bash
# Install Certbot
sudo apt-get install certbot python3-certbot-nginx

# Obtain SSL certificate
sudo certbot --nginx -d your-backend-domain.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

## 🌐 Step 4: Frontend Deployment

### 4.1 Build Frontend for Production
```bash
# Navigate to frontend directory
cd ../frontend

# Install dependencies
npm install

# Create production environment file
cat > .env.production << 'EOF'
REACT_APP_API_URL=https://your-backend-domain.com
REACT_APP_ENVIRONMENT=production
EOF

# Build for production
npm run build
```

### 4.2 Deploy Frontend

#### Option A: Nginx Static Hosting
```bash
# Copy build files to Nginx directory
sudo cp -r build/* /var/www/html/

# Create Nginx configuration for frontend
sudo tee /etc/nginx/sites-available/gap-hrms-frontend << 'EOF'
server {
    listen 80;
    server_name your-frontend-domain.com;
    root /var/www/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /static/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
EOF

# Enable site
sudo ln -s /etc/nginx/sites-available/gap-hrms-frontend /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

#### Option B: Netlify/Vercel Deployment
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Deploy to Netlify
netlify deploy --prod --dir=build
```

#### Option C: AWS S3 + CloudFront
```bash
# Install AWS CLI
pip install awscli

# Configure AWS credentials
aws configure

# Create S3 bucket and upload
aws s3 mb s3://your-hrms-frontend-bucket
aws s3 sync build/ s3://your-hrms-frontend-bucket --delete
aws s3 website s3://your-hrms-frontend-bucket --index-document index.html --error-document index.html
```

## 🔍 Step 5: Verification and Testing

### 5.1 Health Checks
```bash
# Backend health check
curl https://your-backend-domain.com/health

# Database connection test
curl https://your-backend-domain.com/api/auth/profile \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### 5.2 Database Verification
```bash
# Connect to Oracle and verify tables
sqlplus HRMS_PROD@your-connection-string

# Check tables
SELECT table_name FROM user_tables WHERE table_name LIKE 'HRMS_%' ORDER BY table_name;

# Check sample data
SELECT COUNT(*) FROM HRMS_USERS;
SELECT COUNT(*) FROM HRMS_EMPLOYEES;
```

### 5.3 Application Testing
```bash
# Test admin login
curl -X POST https://your-backend-domain.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "AdminPass123!"
  }'
```

## 📊 Step 6: Monitoring and Maintenance

### 6.1 PM2 Monitoring
```bash
# Monitor application
pm2 monit

# View logs
pm2 logs gap-hrms-backend

# Restart application
pm2 restart gap-hrms-backend
```

### 6.2 Database Monitoring
```sql
-- Check table sizes
SELECT table_name, 
       ROUND(bytes/1024/1024, 2) MB 
FROM user_segments 
WHERE segment_type = 'TABLE' 
AND table_name LIKE 'HRMS_%';

-- Check recent activity
SELECT * FROM AUDIT_LOG 
WHERE created_at > SYSDATE - 1 
ORDER BY created_at DESC;
```

### 6.3 Backup Strategy
```bash
# Database backup script
cat > backup-database.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/opt/backups/hrms"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="hrms_backup_$DATE.dmp"

mkdir -p $BACKUP_DIR

expdp HRMS_PROD@your-connection-string \
  DIRECTORY=DATA_PUMP_DIR \
  DUMPFILE=$BACKUP_FILE \
  SCHEMAS=HRMS_PROD \
  LOGFILE=hrms_backup_$DATE.log

# Keep only last 7 days of backups
find $BACKUP_DIR -name "*.dmp" -mtime +7 -delete
find $BACKUP_DIR -name "*.log" -mtime +7 -delete
EOF

chmod +x backup-database.sh

# Add to crontab for daily backups
echo "0 2 * * * /opt/backups/hrms/backup-database.sh" | crontab -
```

## 🚨 Step 7: Security Checklist

### 7.1 Environment Security
- [ ] JWT_SECRET is strong and unique
- [ ] Database passwords are secure
- [ ] SSL certificates are valid
- [ ] Firewall rules are configured
- [ ] Rate limiting is enabled

### 7.2 Application Security
- [ ] CORS is properly configured
- [ ] Input validation is enabled
- [ ] SQL injection protection is active
- [ ] XSS protection headers are set
- [ ] HTTPS is enforced

### 7.3 Database Security
- [ ] Database user has minimal required privileges
- [ ] Network access is restricted
- [ ] Regular security patches are applied
- [ ] Audit logging is enabled

## 📞 Step 8: Support and Troubleshooting

### 8.1 Common Issues

#### Database Connection Issues
```bash
# Test Oracle connection
node test-oracle-connection.js

# Check Oracle Instant Client
ldd /opt/oracle/instantclient_21_9/libclntsh.so
```

#### Application Crashes
```bash
# Check PM2 logs
pm2 logs gap-hrms-backend --lines 100

# Check system resources
htop
df -h
free -h
```

#### Performance Issues
```bash
# Monitor Node.js performance
pm2 monit

# Check database performance
sqlplus HRMS_PROD@your-connection-string
-- Run: SELECT * FROM v$session WHERE username = 'HRMS_PROD';
```

### 8.2 Emergency Procedures
```bash
# Emergency restart
pm2 restart gap-hrms-backend

# Rollback to previous version
pm2 restart gap-hrms-backend --update-env

# Database emergency backup
expdp HRMS_PROD@your-connection-string \
  DIRECTORY=DATA_PUMP_DIR \
  DUMPFILE=emergency_backup.dmp \
  SCHEMAS=HRMS_PROD
```

## ✅ Success Criteria

Your production deployment is successful when:

1. ✅ **Backend**: Health check returns `{"success": true}`
2. ✅ **Database**: All HRMS tables are created and accessible
3. ✅ **Frontend**: Application loads without errors
4. ✅ **Authentication**: Admin login works with default credentials
5. ✅ **SSL**: HTTPS is working and certificate is valid
6. ✅ **Monitoring**: PM2 shows application as "online"
7. ✅ **Backup**: Database backup script runs successfully

## 📚 Additional Resources

- [Oracle Database Documentation](https://docs.oracle.com/en/database/)
- [Node.js Production Best Practices](https://nodejs.org/en/docs/guides/nodejs-docker-webapp/)
- [PM2 Documentation](https://pm2.keymetrics.io/docs/)
- [Nginx Configuration Guide](https://nginx.org/en/docs/)

---

**🎉 Congratulations! Your GAP HRMS application is now deployed to production and ready for use.** 