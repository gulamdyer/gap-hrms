# 🚀 GAP HRMS Production Deployment Checklist

## 📋 Pre-Deployment Checklist

### Server Requirements
- [ ] Ubuntu 20.04+ or CentOS 8+ server
- [ ] Node.js 18.x or 20.x LTS installed
- [ ] Oracle Instant Client 19c/21c installed
- [ ] PM2 installed globally (`npm install -g pm2`)
- [ ] Nginx installed (optional)
- [ ] SSL certificate ready (Let's Encrypt or purchased)

### Database Requirements
- [ ] Oracle Database 19c/21c accessible
- [ ] Dedicated database user created with proper privileges
- [ ] Network connectivity to database verified
- [ ] Database backup strategy planned

## 🔧 Step-by-Step Deployment

### 1. Server Setup
```bash
# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install Oracle Instant Client
wget https://download.oracle.com/otn_software/linux/instantclient/219000/instantclient-basic-linux.x64-21.9.0.0.0dbru.zip
unzip instantclient-basic-linux.x64-21.9.0.0.0dbru.zip
sudo mv instantclient_21_9 /opt/oracle/instantclient_21_9

# Set environment variables
echo 'export ORACLE_HOME=/opt/oracle/instantclient_21_9' >> ~/.bashrc
echo 'export LD_LIBRARY_PATH=/opt/oracle/instantclient_21_9:$LD_LIBRARY_PATH' >> ~/.bashrc
echo 'export PATH=/opt/oracle/instantclient_21_9:$PATH' >> ~/.bashrc
source ~/.bashrc

# Install PM2
sudo npm install -g pm2
```

### 2. Database Setup
```sql
-- Create production user
CREATE USER HRMS_PROD IDENTIFIED BY "SecurePassword123!";
GRANT CONNECT, RESOURCE TO HRMS_PROD;
GRANT CREATE SESSION TO HRMS_PROD;
GRANT CREATE TABLE TO HRMS_PROD;
GRANT CREATE SEQUENCE TO HRMS_PROD;
GRANT CREATE VIEW TO HRMS_PROD;
GRANT CREATE PROCEDURE TO HRMS_PROD;
GRANT UNLIMITED TABLESPACE TO HRMS_PROD;
```

### 3. Application Deployment
```bash
# Clone repository
git clone <your-repo-url>
cd GAP HRMS/backend

# Install dependencies
npm install

# Create production environment
cp env.example .env
# Edit .env with production values

# Test database connection
node test-oracle-connection.js

# Run production migration
node production-migration.js
```

### 4. Backend Deployment
```bash
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

# Start application
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### 5. Frontend Deployment
```bash
# Navigate to frontend
cd ../frontend

# Install dependencies
npm install

# Create production environment
cat > .env.production << 'EOF'
REACT_APP_API_URL=https://your-backend-domain.com
REACT_APP_ENVIRONMENT=production
EOF

# Build for production
npm run build

# Deploy to web server
sudo cp -r build/* /var/www/html/
```

### 6. Nginx Configuration (Optional)
```bash
# Install Nginx
sudo apt-get install nginx

# Backend configuration
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

# Frontend configuration
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

# Enable sites
sudo ln -s /etc/nginx/sites-available/gap-hrms-backend /etc/nginx/sites-enabled/
sudo ln -s /etc/nginx/sites-available/gap-hrms-frontend /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 7. SSL Setup
```bash
# Install Certbot
sudo apt-get install certbot python3-certbot-nginx

# Obtain SSL certificates
sudo certbot --nginx -d your-backend-domain.com
sudo certbot --nginx -d your-frontend-domain.com

# Setup auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

## 🔍 Verification Checklist

### Database Verification
- [ ] All HRMS tables created successfully
- [ ] Admin user exists (username: admin, password: AdminPass123!)
- [ ] Sample data populated correctly
- [ ] Database connection stable

### Backend Verification
- [ ] Health check endpoint responds: `{"success": true}`
- [ ] PM2 shows application as "online"
- [ ] No errors in PM2 logs
- [ ] API endpoints accessible
- [ ] Rate limiting working correctly

### Frontend Verification
- [ ] Application loads without errors
- [ ] Login functionality works
- [ ] All pages render correctly
- [ ] API calls to backend successful
- [ ] SSL certificate valid

### Security Verification
- [ ] HTTPS enforced
- [ ] CORS properly configured
- [ ] JWT authentication working
- [ ] Rate limiting active
- [ ] Input validation enabled

## 📊 Monitoring Setup

### PM2 Monitoring
```bash
# Monitor application
pm2 monit

# View logs
pm2 logs gap-hrms-backend

# Check status
pm2 status
```

### Database Monitoring
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

### System Monitoring
```bash
# Check system resources
htop
df -h
free -h

# Check application logs
tail -f logs/combined.log
```

## 🔄 Backup Strategy

### Database Backup
```bash
# Create backup script
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

## 🚨 Emergency Procedures

### Application Restart
```bash
# Restart application
pm2 restart gap-hrms-backend

# Check status
pm2 status
```

### Database Emergency Backup
```bash
# Emergency backup
expdp HRMS_PROD@your-connection-string \
  DIRECTORY=DATA_PUMP_DIR \
  DUMPFILE=emergency_backup.dmp \
  SCHEMAS=HRMS_PROD
```

### Rollback Procedure
```bash
# Stop application
pm2 stop gap-hrms-backend

# Restore from backup
impdp HRMS_PROD@your-connection-string \
  DIRECTORY=DATA_PUMP_DIR \
  DUMPFILE=backup_file.dmp \
  SCHEMAS=HRMS_PROD

# Restart application
pm2 start gap-hrms-backend
```

## ✅ Success Criteria

Your production deployment is successful when:

1. ✅ **Database**: All HRMS tables created and accessible
2. ✅ **Backend**: Health check returns `{"success": true}`
3. ✅ **Frontend**: Application loads without errors
4. ✅ **Authentication**: Admin login works with default credentials
5. ✅ **SSL**: HTTPS working and certificate valid
6. ✅ **Monitoring**: PM2 shows application as "online"
7. ✅ **Backup**: Database backup script runs successfully
8. ✅ **Security**: All security measures in place

## 📞 Support Information

- **Application Logs**: `pm2 logs gap-hrms-backend`
- **Database Connection**: `node test-oracle-connection.js`
- **Health Check**: `curl https://your-backend-domain.com/health`
- **Backup Location**: `/opt/backups/hrms/`
- **PM2 Status**: `pm2 status`

---

**🎉 Your GAP HRMS application is now deployed to production and ready for use!** 