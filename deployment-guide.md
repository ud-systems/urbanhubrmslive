# Leads UrbanHub - Production Deployment Guide

## 🚀 **Production Deployment Checklist**

### **Phase 1: Environment Setup**

#### **1.1 Supabase Production Setup**
```bash
# 1. Create production Supabase project
# 2. Run database optimization script
# 3. Set up Row Level Security (RLS)
# 4. Configure authentication settings
# 5. Set up backup strategy
```

#### **1.2 Environment Variables**
```bash
# Copy and configure production environment
cp env.production.example .env.production

# Required variables for production:
VITE_SUPABASE_URL=your_production_supabase_url
VITE_SUPABASE_ANON_KEY=your_production_supabase_anon_key
VITE_APP_ENV=production
VITE_ENABLE_DEBUG=false
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_AUDIT_TRAIL=true
VITE_ENABLE_REAL_TIME=true
```

#### **1.3 Database Optimization**
```sql
-- Run the database_optimization.sql script in Supabase SQL Editor
-- This includes:
-- - Performance indexes
-- - Foreign key constraints
-- - Audit trail system
-- - Data validation triggers
-- - Performance views
```

### **Phase 2: Security Hardening**

#### **2.1 Authentication Security**
```typescript
// Configure Supabase Auth settings:
// - Enable email confirmation
// - Set password strength requirements
// - Configure session timeout
// - Enable MFA (optional)
// - Set up rate limiting
```

#### **2.2 Row Level Security (RLS)**
```sql
-- Enable RLS on all tables
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE studios ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own data" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Admins can view all data" ON leads
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );
```

#### **2.3 API Security**
```typescript
// Implement rate limiting
// Add request validation
// Set up CORS properly
// Use HTTPS only
// Implement API key rotation
```

### **Phase 3: Performance Optimization**

#### **3.1 Build Optimization**
```bash
# Production build with optimizations
npm run build

# Bundle analysis
npm install -g webpack-bundle-analyzer
npx webpack-bundle-analyzer dist/stats.json
```

#### **3.2 CDN Setup**
```bash
# Configure CDN for static assets
# Set up caching headers
# Enable compression
# Configure edge locations
```

#### **3.3 Database Performance**
```sql
-- Monitor query performance
-- Set up connection pooling
-- Configure read replicas if needed
-- Implement query caching
```

### **Phase 4: Monitoring & Analytics**

#### **4.1 Error Tracking**
```typescript
// Set up Sentry for error tracking
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "your-sentry-dsn",
  environment: "production",
  integrations: [
    new Sentry.BrowserTracing(),
  ],
  tracesSampleRate: 0.1,
});
```

#### **4.2 Performance Monitoring**
```typescript
// Set up performance monitoring
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

getCLS(console.log);
getFID(console.log);
getFCP(console.log);
getLCP(console.log);
getTTFB(console.log);
```

#### **4.3 Analytics Setup**
```typescript
// Google Analytics 4
import { GA4React } from 'ga-4-react';

const ga4react = new GA4React('G-XXXXXXXXXX');
ga4react.initialize().then(ga4 => {
  ga4.pageview('/');
});
```

### **Phase 5: Deployment Platforms**

#### **5.1 Vercel Deployment**
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy to Vercel
vercel --prod

# Configure environment variables in Vercel dashboard
# Set up custom domain
# Configure build settings
```

#### **5.2 Netlify Deployment**
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Deploy to Netlify
netlify deploy --prod

# Configure environment variables
# Set up form handling
# Configure redirects
```

#### **5.3 AWS S3 + CloudFront**
```bash
# Build the application
npm run build

# Upload to S3
aws s3 sync dist/ s3://your-bucket-name

# Configure CloudFront distribution
# Set up custom domain with SSL
# Configure caching policies
```

### **Phase 6: CI/CD Pipeline**

#### **6.1 GitHub Actions**
```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run build
      - run: npm run test
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
```

#### **6.2 Automated Testing**
```bash
# Run tests before deployment
npm run test
npm run test:e2e
npm run lint
npm run type-check
```

### **Phase 7: Backup & Recovery**

#### **7.1 Database Backup**
```sql
-- Set up automated backups in Supabase
-- Configure backup retention policy
-- Test backup restoration process
-- Document recovery procedures
```

#### **7.2 Application Backup**
```bash
# Backup configuration files
# Backup environment variables
# Backup custom scripts
# Document deployment procedures
```

### **Phase 8: Post-Deployment**

#### **8.1 Health Checks**
```typescript
// Implement health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version
  });
});
```

#### **8.2 Monitoring Dashboard**
```typescript
// Set up monitoring dashboard
// Monitor key metrics:
// - Response times
// - Error rates
// - User activity
// - Database performance
// - API usage
```

#### **8.3 Alerting**
```typescript
// Set up alerts for:
// - High error rates
// - Performance degradation
// - Security incidents
// - Database issues
// - API failures
```

## 🔧 **Production Configuration**

### **Environment Variables Reference**

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `VITE_SUPABASE_URL` | Supabase project URL | Yes | - |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous key | Yes | - |
| `VITE_APP_ENV` | Environment name | No | development |
| `VITE_ENABLE_DEBUG` | Enable debug mode | No | false |
| `VITE_ENABLE_ANALYTICS` | Enable analytics | No | false |
| `VITE_ENABLE_AUDIT_TRAIL` | Enable audit trail | No | false |
| `VITE_ENABLE_REAL_TIME` | Enable real-time features | No | false |
| `VITE_API_TIMEOUT` | API timeout (ms) | No | 30000 |
| `VITE_MAX_FILE_SIZE` | Max file upload size | No | 5242880 |

### **Performance Benchmarks**

| Metric | Target | Current |
|--------|--------|---------|
| First Contentful Paint | < 1.5s | - |
| Largest Contentful Paint | < 2.5s | - |
| Time to Interactive | < 3.5s | - |
| Bundle Size | < 500KB | - |
| API Response Time | < 200ms | - |

### **Security Checklist**

- [ ] HTTPS enabled
- [ ] Environment variables secured
- [ ] RLS policies configured
- [ ] Rate limiting implemented
- [ ] Input validation active
- [ ] XSS protection enabled
- [ ] CSRF protection enabled
- [ ] Audit trail active
- [ ] Error tracking configured
- [ ] Backup strategy in place

### **Monitoring Checklist**

- [ ] Error tracking setup
- [ ] Performance monitoring active
- [ ] Analytics configured
- [ ] Health checks implemented
- [ ] Alerting configured
- [ ] Log aggregation setup
- [ ] Dashboard configured
- [ ] Backup monitoring active

## 🚨 **Emergency Procedures**

### **Rollback Procedure**
```bash
# 1. Identify the issue
# 2. Stop new deployments
# 3. Rollback to previous version
# 4. Verify functionality
# 5. Investigate root cause
# 6. Deploy fix
```

### **Database Recovery**
```sql
-- 1. Stop application
-- 2. Restore from backup
-- 3. Verify data integrity
-- 4. Restart application
-- 5. Monitor for issues
```

### **Security Incident Response**
```bash
# 1. Assess the incident
# 2. Contain the threat
# 3. Investigate root cause
# 4. Implement fixes
# 5. Notify stakeholders
# 6. Document lessons learned
```

## 📊 **Performance Monitoring**

### **Key Metrics to Track**

1. **User Experience**
   - Page load times
   - Time to interactive
   - Error rates
   - User engagement

2. **System Performance**
   - API response times
   - Database query performance
   - Memory usage
   - CPU utilization

3. **Business Metrics**
   - Lead conversion rates
   - User activity
   - Revenue tracking
   - Feature usage

4. **Security Metrics**
   - Failed login attempts
   - Suspicious activity
   - Data access patterns
   - Security incidents

## 🔄 **Maintenance Schedule**

### **Daily**
- Monitor error rates
- Check system health
- Review security alerts
- Monitor performance

### **Weekly**
- Review analytics
- Update dependencies
- Check backup status
- Performance analysis

### **Monthly**
- Security audit
- Performance optimization
- User feedback review
- Feature planning

### **Quarterly**
- Full security review
- Performance benchmarking
- Infrastructure review
- Disaster recovery test 