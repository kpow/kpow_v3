# Digital Ocean App Platform Migration Plan

## Overview
This document outlines the complete migration plan for the Book Metadata Enrichment Platform from Replit to Digital Ocean App Platform.

## Application Architecture
- **Frontend**: React with TypeScript, Vite build system
- **Backend**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM (Neon serverless)
- **Key Features**: Book/author metadata enrichment, Goodreads integration, image processing

## Migration Strategy: Two-Phase Approach

### Phase 1: Application Migration (Keep Current Neon Database)
- Migrate application code to Digital Ocean App Platform
- Continue using existing Neon database instance
- Minimal disruption to data and services
- Focus on application deployment and configuration

### Phase 2: Database Migration (New Neon Instance)
- Create new Neon database instance
- Migrate data from current to new Neon instance
- Update application configuration
- Optimize database performance and settings

## Pre-Migration Requirements

### 1. Digital Ocean Account Setup
- [ ] Create Digital Ocean account
- [ ] Verify billing information
- [ ] Install `doctl` CLI tool (optional but recommended)

### 2. Source Code Repository
- [ ] Push code to GitHub repository
- [ ] Ensure repository is public or grant Digital Ocean access
- [ ] Set main branch as default deployment branch

### 3. Environment Variables & Secrets
Collect all required API keys and configuration values:

#### Required Environment Variables
- `DATABASE_URL` - Your current Neon database connection string
- `SESSION_SECRET` - Generate a secure random string
- `NODE_ENV` - Set to "production"
- `PORT` - Set to "8080" (Digital Ocean standard)

#### Optional API Keys (based on your application features)
- `OPENAI_API_KEY` - For AI features
- `GOODREADS_API_KEY` - For book metadata enrichment
- `GOOGLE_API_KEY` - For Google services integration
- `LASTFM_API_KEY` - For music-related features
- `YOUTUBE_API_KEY` - For YouTube integration
- `INSTAGRAM_ACCESS_TOKEN` - For Instagram integration
- Email configuration (if using nodemailer):
  - `SMTP_HOST`
  - `SMTP_PORT`
  - `SMTP_USER`
  - `SMTP_PASS`

## Migration Steps

## Phase 1: Application Migration (Keep Current Neon Database)

### Step 1: Prepare Application for Production

#### 1.1 Update Package.json Scripts
The application already has proper build and start scripts:
```json
{
  "scripts": {
    "build": "vite build && esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist",
    "start": "NODE_ENV=production node dist/index.js"
  }
}
```

#### 1.2 Configuration Files
The following files have been created for you:
- `.env.example` - Template for environment variables
- `.do/app.yaml` - Digital Ocean App Platform configuration (updated for Neon database)

### Step 2: Prepare Current Neon Database

#### 2.1 Verify Current Database Connection
- Ensure your current Neon database is accessible
- Note down the current DATABASE_URL from your Replit environment
- Test connection and verify all tables are properly migrated

#### 2.2 Create Database Backup (Safety Measure)
```bash
# Export your current database data as backup
pg_dump $DATABASE_URL > neon_database_backup_$(date +%Y%m%d).sql
```

### Step 3: Digital Ocean Deployment

#### 3.1 Create App via Digital Ocean Control Panel
1. Go to [Digital Ocean Apps](https://cloud.digitalocean.com/apps)
2. Click "Create App"
3. Choose "GitHub" as source
4. Select your repository and branch
5. Digital Ocean will auto-detect it as a Node.js app

#### 3.2 Configure App Settings
1. **Service Configuration**:
   - Service Type: Web Service
   - Instance Size: Basic ($5/month recommended for start)
   - Instance Count: 1
   - HTTP Port: 8080

2. **Environment Variables**:
   Set all required environment variables from your `.env.example` file:
   - `DATABASE_URL` - Use your existing Neon database connection string
   - All other environment variables as needed

3. **Skip Database Configuration**:
   - Do NOT add Digital Ocean PostgreSQL database
   - We're using existing Neon database for Phase 1

#### 3.3 Deploy Application
1. Review configuration
2. Click "Create Resources"
3. Wait for deployment (typically 5-10 minutes)

### Step 4: Post-Deployment Configuration (Phase 1)

#### 4.1 Verify Database Connection
- Application should automatically connect to existing Neon database
- No migration needed since using existing database
- Verify all database operations work correctly

#### 4.2 Verify Deployment
- [ ] Check health endpoint: `https://your-app.ondigitalocean.app/api/health`
- [ ] Test main application functionality
- [ ] Verify database connections to Neon
- [ ] Test API endpoints
- [ ] Confirm all data is accessible and unchanged

## Phase 2: Database Migration (New Neon Instance)

### Step 1: Create New Neon Database Instance

#### 1.1 Set Up New Neon Database
1. Go to [Neon Console](https://console.neon.tech/)
2. Create new project/database
3. Choose appropriate region (same as or close to Digital Ocean)
4. Note the new DATABASE_URL

#### 1.2 Configure New Database
```bash
# Update your local .env with new DATABASE_URL temporarily
export DATABASE_URL=your_new_neon_database_url

# Run migrations on new database
npm run db:push
```

### Step 2: Data Migration

#### 2.1 Export Data from Current Database
```bash
# Export data from current Neon instance
pg_dump $CURRENT_DATABASE_URL > complete_data_export.sql
```

#### 2.2 Import Data to New Database
```bash
# Import data to new Neon instance
psql $NEW_DATABASE_URL < complete_data_export.sql
```

#### 2.3 Verify Data Migration
- Compare record counts between old and new databases
- Test critical application functionality with new database
- Verify all relationships and constraints are intact

### Step 3: Update Application Configuration

#### 3.1 Update Digital Ocean Environment Variables
1. Go to your Digital Ocean App settings
2. Update `DATABASE_URL` to point to new Neon instance
3. Deploy the updated configuration

#### 3.2 Test Updated Application
- [ ] Verify health endpoint responds
- [ ] Test all database operations
- [ ] Confirm data integrity
- [ ] Performance test with new database

### Step 4: Cleanup and Optimization

#### 4.1 Monitor New Database Performance
- Monitor query performance in new Neon instance
- Check connection pooling is working properly
- Verify no connection limits are being hit

#### 4.2 Decommission Old Database (After Verification)
- Keep old Neon database for 1-2 weeks as backup
- Monitor new database stability
- Once confident, decommission old instance

### Step 5: DNS and Domain Configuration (Optional)

#### 5.1 Custom Domain Setup
1. Go to your app settings in Digital Ocean
2. Add custom domain
3. Configure DNS records with your domain provider:
   - CNAME record pointing to your Digital Ocean app URL

#### 5.2 SSL Certificate
- Digital Ocean automatically provisions SSL certificates
- No additional configuration needed

## Cost Estimates

### Phase 1: Application Migration Only
- **Digital Ocean Basic Web Service**: $5/month
- **Current Neon Database**: $0-25/month (depending on usage)
- **Total Monthly Cost Phase 1**: ~$5-30/month

### Phase 2: With New Neon Database
- **Digital Ocean Basic Web Service**: $5/month
- **New Neon Database**: $0-25/month (depending on usage and plan)
- **Total Monthly Cost Phase 2**: ~$5-30/month

### Comparison with Replit
- More predictable pricing structure
- Better performance for production workloads
- Professional deployment environment
- Database flexibility with Neon's serverless scaling

## Monitoring and Maintenance

### 5.1 Application Monitoring
- Digital Ocean provides built-in metrics
- Monitor CPU, memory, and request metrics
- Set up alerts for deployment failures

### 5.2 Database Monitoring
- Monitor database performance
- Set up automated backups
- Monitor storage usage

### 5.3 Logs and Debugging
- Access application logs via Digital Ocean dashboard
- Use `doctl` CLI for advanced log management
- Set up log forwarding if needed

## Rollback Plan

### If Migration Fails
1. Keep Replit deployment running during migration
2. Test Digital Ocean deployment thoroughly
3. Update DNS only after full verification
4. Keep database backups for quick restoration

### Emergency Rollback
1. Revert DNS changes (if using custom domain)
2. Restore from database backup if needed
3. Redeploy to Replit if necessary

## Security Considerations

### 5.1 Environment Variables
- All secrets stored securely in Digital Ocean
- No secrets in code repository
- Regular rotation of API keys

### 5.2 Database Security
- Database accessible only from your app
- Encrypted connections
- Regular security updates

### 5.3 Application Security
- HTTPS enforced by default
- Regular dependency updates
- Security headers configured

## Performance Optimizations

### 5.1 Application Level
- Vite build optimization already configured
- Static file serving optimized
- Express.js performance middleware

### 5.2 Database Level
- Connection pooling configured
- Proper indexing on frequently queried fields
- Query optimization with Drizzle ORM

## Migration Checklist

### Phase 1: Application Migration
#### Pre-Migration
- [ ] Code pushed to GitHub
- [ ] Current Neon DATABASE_URL documented
- [ ] Environment variables documented
- [ ] Database backup created from current Neon instance
- [ ] Digital Ocean account set up

#### During Migration
- [ ] App created in Digital Ocean
- [ ] Environment variables configured (using existing Neon DATABASE_URL)
- [ ] Initial deployment successful
- [ ] Skip Digital Ocean database creation

#### Post-Migration Phase 1
- [ ] Health check endpoint responding
- [ ] Database connection to Neon verified
- [ ] All API endpoints tested
- [ ] Data accessibility confirmed
- [ ] Performance validated
- [ ] Monitoring configured

### Phase 2: Database Migration
#### Pre-Database Migration
- [ ] New Neon database instance created
- [ ] Schema migrations applied to new database
- [ ] Complete data export from current database
- [ ] Data imported to new Neon instance
- [ ] Data integrity verification completed

#### During Database Migration
- [ ] Digital Ocean environment variables updated with new DATABASE_URL
- [ ] Application redeployed with new database connection
- [ ] Comprehensive testing with new database

#### Post-Database Migration
- [ ] All functionality verified with new database
- [ ] Performance monitoring established
- [ ] Old database kept as backup for safety period
- [ ] Documentation updated with new database details

### Final Steps (Both Phases)
- [ ] DNS updated (if using custom domain)
- [ ] SSL certificate verified
- [ ] Documentation updated
- [ ] Team notified of new URLs

## Support and Resources

### Digital Ocean Documentation
- [App Platform Documentation](https://docs.digitalocean.com/products/app-platform/)
- [Database Documentation](https://docs.digitalocean.com/products/databases/)
- [CLI Tool (doctl)](https://docs.digitalocean.com/reference/doctl/)

### Application-Specific Resources
- Drizzle ORM documentation for database operations
- Express.js production best practices
- React deployment optimization guides

## Emergency Contacts
- Digital Ocean Support: Available 24/7 via ticket system
- Database issues: Check Digital Ocean status page first
- Application issues: Review application logs in dashboard

---

**Note**: This migration plan assumes you have administrative access to all required services and API keys. Ensure all team members have necessary permissions before beginning the migration process.