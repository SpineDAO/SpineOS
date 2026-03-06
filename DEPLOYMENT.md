# SpineOS Deployment Guide — HIPAA-Compliant Production Setup

## Architecture

```
[Browser] → HTTPS → [Express API :3001] → [Supabase (PostgreSQL)]
                         ↓
                    [Anthropic Claude API]
                    (PHI scrubbed before sending)
```

## Security Measures Implemented

### Data Protection (HIPAA Technical Safeguards)
- **PHI scrubbing**: All operative notes are run through `server/lib/phi-scrubber.js` before being sent to Claude API — names, SSNs, MRNs, DOBs, phone numbers, emails, addresses are replaced with `[REDACTED]`
- **No browser API keys**: Anthropic API key is server-side only, never exposed to client
- **Patient ID hashing**: Patient identifiers are SHA-256 hashed before database storage
- **No-cache headers**: All API responses include `Cache-Control: no-store` to prevent PHI caching
- **JSONB storage**: Op notes stored server-side only, not in browser localStorage

### Access Controls
- **RBAC**: Three roles (surgeon, biller, admin) enforced server-side via JWT middleware
- **Row Level Security**: Supabase RLS policies enforce data isolation per user/practice
- **Invite system**: New users must be invited with a specific role — no self-registration as admin
- **Auto-role assignment**: Database trigger assigns role from invite on signup

### Network Security
- **HSTS**: Strict-Transport-Security header in production
- **CORS lockdown**: Only configured frontend origin allowed
- **Rate limiting**: 60 req/min general, 10 req/min for AI routes
- **Security headers**: X-Content-Type-Options, X-Frame-Options, CSP, Referrer-Policy
- **No x-powered-by**: Express fingerprint disabled

### Audit Trail
- **All mutating requests logged**: Every POST/PUT/PATCH/DELETE recorded to `audit_log` table
- **User, action, resource, timestamp**: Full audit chain for HIPAA compliance review
- **Training signals**: Every AI interaction (analysis, approval, edit, rejection) logged

## Deployment Steps

### 1. Supabase Setup
```bash
# Run the schema in Supabase SQL Editor
# Use supabase/schema_v2.sql for the full production schema
```

### 2. Environment Variables
Set these in your deployment platform (Replit Secrets, Railway, Render, etc.):

```
# Required
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
ANTHROPIC_API_KEY=sk-ant-your-key

# Production
NODE_ENV=production
PORT=3001
FRONTEND_URL=https://your-domain.com

# Optional tuning
RATE_LIMIT_MAX=60
RATE_LIMIT_AI_MAX=10
```

### 3. Docker Deployment
```bash
docker build -t spineos .
docker run -p 3001:3001 --env-file .env spineos
```

### 4. Or deploy on Replit
- Set environment variables in Secrets
- Run command: `npm run dev` (dev) or `npm start` (production)

## HIPAA Compliance Checklist

### Technical Safeguards (§164.312)
- [x] Access control — unique user IDs, role-based access
- [x] Audit controls — all API mutations logged
- [x] Transmission security — HTTPS enforced (HSTS)
- [x] Integrity controls — database constraints, input validation
- [x] Authentication — Supabase Auth with JWT verification

### Administrative Safeguards (§164.308) — Your Responsibility
- [ ] **BAA with Supabase** — Required before storing any real PHI
- [ ] **BAA with Anthropic** — Required for Claude API access with medical data
- [ ] **Risk assessment** — Document your specific deployment risks
- [ ] **Workforce training** — Train users on PHI handling
- [ ] **Incident response plan** — Document breach procedures
- [ ] **Data backup procedures** — Configure Supabase point-in-time recovery

### Physical Safeguards (§164.310)
- [ ] Cloud provider compliance — Use HIPAA-eligible tier (Supabase Pro, AWS GovCloud, etc.)
- [ ] Encryption at rest — Enabled by default on Supabase Pro

## BAA Requirements

Before going live with real patient data, you MUST have signed BAAs with:

1. **Supabase** — Available on Pro plan ($25/mo). Contact support@supabase.io
2. **Anthropic** — Contact sales for enterprise/healthcare tier with BAA
3. **Hosting provider** — If not Replit, ensure your host offers HIPAA compliance (Railway, Render, AWS, GCP)

## Database Backups

Configure in Supabase Dashboard → Settings → Database:
- Enable Point-in-Time Recovery (Pro plan)
- Set daily backups with 7-day retention minimum
