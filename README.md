# Leads UrbanHub - Production Ready CRM

A comprehensive lead management and student accommodation CRM system built with React, TypeScript, and Supabase.

## 🚀 **Production Deployment Guide**

### **Pre-Deployment Checklist**

Before deploying to production, ensure you have:

- [ ] Set up production Supabase project
- [ ] Configured environment variables
- [ ] Set up database indexes
- [ ] Configured authentication settings
- [ ] Set up backup strategy

### **Environment Setup**

1. **Copy the example environment file:**
   ```bash
   cp env.production.example .env.production
   ```

2. **Fill in your production credentials:**
   ```env
   VITE_SUPABASE_URL=your_production_supabase_url
   VITE_SUPABASE_ANON_KEY=your_production_supabase_anon_key
   VITE_APP_ENV=production
   VITE_ENABLE_DEBUG=false
   ```

3. **Build for production:**
   ```bash
   npm run build
   ```

### **Security Features Implemented**

✅ **Input Validation & Sanitization**
- Zod schema validation for all forms
- XSS prevention with input sanitization
- SQL injection protection

✅ **Authentication Security**
- Rate limiting on login/signup attempts
- Session management
- Role-based access control

✅ **Error Handling**
- Centralized error handling
- User-friendly error messages
- Production-safe error logging

✅ **Performance Optimizations**
- Code splitting and lazy loading
- Pagination for large datasets
- Optimized bundle size

### **Database Setup**

Run these SQL commands in your Supabase SQL editor:

```sql
-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_leads_dateofinquiry ON leads(dateofinquiry);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_source ON leads(source);
CREATE INDEX IF NOT EXISTS idx_students_checkin ON students(checkin);
CREATE INDEX IF NOT EXISTS idx_students_assignedto ON students(assignedto);

-- Add foreign key constraints
ALTER TABLE students ADD CONSTRAINT fk_students_assignedto 
FOREIGN KEY (assignedto) REFERENCES profiles(id);

ALTER TABLE leads ADD CONSTRAINT fk_leads_assignedto 
FOREIGN KEY (assignedto) REFERENCES profiles(id);
```

## 🛠️ **Development**

### **Prerequisites**
- Node.js 18+ 
- npm or yarn
- Supabase account

### **Installation**

```bash
# Clone the repository
git clone <your-repo-url>
cd leads-urbanhub

# Install dependencies
npm install

# Start development server
npm run dev
```

### **Available Scripts**

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## 📁 **Project Structure**

```
src/
├── components/          # Reusable UI components
│   ├── ui/             # shadcn/ui components
│   └── ...             # Custom components
├── pages/              # Page components
├── lib/                # Utilities and configurations
│   ├── supabaseClient.ts
│   ├── supabaseCrud.ts
│   ├── validation.ts   # Input validation schemas
│   ├── errorHandler.ts # Error handling
│   └── rateLimiter.ts  # Rate limiting
├── hooks/              # Custom React hooks
├── contexts/           # React contexts
└── types/              # TypeScript type definitions
```

## 🔧 **Configuration**

### **Environment Variables**

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_SUPABASE_URL` | Supabase project URL | Yes |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous key | Yes |
| `VITE_APP_ENV` | Environment (development/production) | No |
| `VITE_ENABLE_DEBUG` | Enable debug mode | No |
| `VITE_ENABLE_ANALYTICS` | Enable analytics | No |

### **Feature Flags**

The application includes several feature flags that can be configured:

- **Analytics**: Performance monitoring and user analytics
- **Debug Mode**: Enhanced error reporting and development tools
- **Rate Limiting**: API request rate limiting
- **Bulk Operations**: Bulk import/export functionality

## 🚨 **Security Considerations**

### **Production Security Checklist**

- [ ] Environment variables are properly configured
- [ ] No hardcoded credentials in source code
- [ ] Input validation is enabled
- [ ] Rate limiting is configured
- [ ] Error messages don't expose sensitive information
- [ ] HTTPS is enabled
- [ ] CORS is properly configured

### **Data Protection**

- All user inputs are validated and sanitized
- Sensitive data is not logged in production
- Database queries are parameterized
- Authentication tokens are properly managed

## 📊 **Performance**

### **Optimizations Implemented**

- **Code Splitting**: Lazy loading of components
- **Pagination**: Efficient handling of large datasets
- **Caching**: Smart caching strategies
- **Bundle Optimization**: Minimized bundle size
- **Image Optimization**: Optimized asset loading

### **Monitoring**

The application includes built-in performance monitoring:

- Error tracking and reporting
- Performance metrics collection
- User interaction analytics
- Database query performance

## 🔄 **Updates & Maintenance**

### **Regular Maintenance Tasks**

1. **Security Updates**
   - Keep dependencies updated
   - Monitor for security vulnerabilities
   - Review access logs

2. **Performance Monitoring**
   - Monitor application performance
   - Review error rates
   - Optimize database queries

3. **Backup Strategy**
   - Regular database backups
   - Configuration backups
   - Disaster recovery plan

## 📞 **Support**

For support and questions:

1. Check the documentation
2. Review error logs
3. Contact the development team

## 📄 **License**

This project is proprietary software. All rights reserved.

---

**Last Updated**: December 2024
**Version**: 1.0.0
