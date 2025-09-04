# InvoLex Technical Specifications

## System Architecture

### Overview
InvoLex is a production-grade Chrome extension and web application that automates legal billing through AI-powered email analysis and practice management integration.

### Architecture Diagram
```
┌─────────────────────────────────────────────────────────────┐
│                    Chrome Extension                         │
│  ┌─────────────────────────────────────────────────────┐    │
│  │                 React Application                   │    │
│  │  ┌─────────────┬─────────────┬─────────────────┐   │    │
│  │  │  Dashboard  │   Email     │   Settings      │   │    │
│  │  │             │   Parser    │                 │   │    │
│  │  └─────────────┴─────────────┴─────────────────┘   │    │
│  └─────────────────────────────────────────────────────┘    │
│           │                      │                          │
│           ▼                      ▼                          │
│  ┌─────────────────┐    ┌─────────────────┐                 │
│  │  Content Script │    │  Background     │                 │
│  │                 │    │  Service Worker │                 │
│  └─────────────────┘    └─────────────────┘                 │
└─────────────────────┼───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                    Backend API                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │                 Node.js/Express                      │    │
│  │  ┌─────────────┬─────────────┬─────────────────┐   │    │
│  │  │  Auth       │  Email      │   Clio          │   │    │
│  │  │  Service    │  Service    │   Service       │   │    │
│  │  └─────────────┴─────────────┴─────────────────┘   │    │
│  └─────────────────────────────────────────────────────┘    │
│           │                      │                          │
│           ▼                      ▼                          │
│  ┌─────────────────┐    ┌─────────────────┐                 │
│  │   PostgreSQL    │    │   Redis Cache   │                 │
│  │   Database      │    │                 │                 │
│  └─────────────────┘    └─────────────────┘                 │
└─────────────────────┼───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                 External APIs                              │
│  ┌─────────────┬─────────────┬─────────────┬─────────┐     │
│  │   Gmail     │  Outlook    │    Clio     │ Gemini  │     │
│  │    API      │    API      │    API      │   AI    │     │
│  └─────────────┴─────────────┴─────────────┴─────────┘     │
└─────────────────────────────────────────────────────────────┘
```

## Technical Specifications

### 1. Frontend (Chrome Extension)

#### Technology Stack
- **Framework**: React 19.1.1 with TypeScript
- **Build Tool**: Vite 6.2.0
- **Styling**: Tailwind CSS
- **State Management**: React Context + localStorage
- **Charts**: Recharts 2.12.7
- **AI Integration**: Google Gemini API (@google/genai 1.12.0)

#### Chrome Extension Configuration
```json
{
  "manifest_version": 3,
  "name": "InvoLex - AI Billable Hour Tracker",
  "version": "1.0.0",
  "permissions": [
    "storage",
    "activeTab",
    "identity",
    "https://mail.google.com/*",
    "https://outlook.live.com/*"
  ],
  "host_permissions": [
    "https://api.involex.com/*",
    "https://*.clio.com/*"
  ],
  "background": {
    "service_worker": "background.js"
  },
  "content_scripts": [
    {
      "matches": ["https://mail.google.com/*", "https://outlook.live.com/*"],
      "js": ["content.js"],
      "css": ["content.css"]
    }
  ],
  "action": {
    "default_popup": "popup.html",
    "default_title": "InvoLex"
  }
}
```

#### Key Components
- **Dashboard**: Analytics and entry management
- **Email Parser**: Gmail/Outlook content extraction
- **Settings Panel**: User preferences and integrations
- **AI Assistant**: Real-time billing suggestions

### 2. Backend API

#### Technology Stack
- **Runtime**: Node.js 18+
- **Framework**: Express.js 4.x
- **Database**: PostgreSQL 15+
- **ORM**: Prisma 5.x
- **Authentication**: JWT with refresh tokens
- **Caching**: Redis 7.x
- **Documentation**: Swagger/OpenAPI 3.0

#### API Endpoints

##### Authentication
```
POST   /api/auth/login
POST   /api/auth/register
POST   /api/auth/refresh
POST   /api/auth/logout
GET    /api/auth/me
```

##### Email Integration
```
GET    /api/emails
GET    /api/emails/:id
POST   /api/emails/sync
GET    /api/emails/providers
POST   /api/emails/providers/:provider/oauth
```

##### Billable Entries
```
GET    /api/entries
POST   /api/entries
PUT    /api/entries/:id
DELETE /api/entries/:id
POST   /api/entries/:id/sync
POST   /api/entries/bulk-sync
```

##### Matters & Clients
```
GET    /api/matters
POST   /api/matters
PUT    /api/matters/:id
DELETE /api/matters/:id
GET    /api/matters/:id/entries
```

##### Clio Integration
```
GET    /api/clio/matters
GET    /api/clio/entries
POST   /api/clio/sync
GET    /api/clio/status
```

##### AI Processing
```
POST   /api/ai/analyze
POST   /api/ai/triage
POST   /api/ai/suggest
GET    /api/ai/corrections
```

##### Analytics
```
GET    /api/analytics/overview
GET    /api/analytics/productivity
GET    /api/analytics/revenue
GET    /api/analytics/insights
```

#### Database Schema

##### Users Table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255),
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

##### Email Providers Table
```sql
CREATE TABLE email_providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  provider VARCHAR(50) NOT NULL, -- 'gmail', 'outlook'
  email VARCHAR(255) NOT NULL,
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

##### Matters Table
```sql
CREATE TABLE matters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  name VARCHAR(255) NOT NULL,
  client_name VARCHAR(255),
  rate DECIMAL(10,2) NOT NULL,
  clio_id VARCHAR(100),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

##### Billable Entries Table
```sql
CREATE TABLE billable_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  matter_id UUID REFERENCES matters(id),
  email_ids TEXT[], -- Array of email IDs
  description TEXT NOT NULL,
  hours DECIMAL(4,2) NOT NULL,
  rate DECIMAL(10,2) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  date DATE NOT NULL,
  clio_id VARCHAR(100),
  sync_error TEXT,
  confidence_score DECIMAL(3,2),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### 3. External API Integrations

#### Gmail API Integration
- **Scopes**: `https://www.googleapis.com/auth/gmail.readonly`
- **Endpoints**:
  - `GET /gmail/v1/users/{userId}/messages`
  - `GET /gmail/v1/users/{userId}/messages/{id}`
- **Rate Limits**: 1 billion quota units/day
- **Authentication**: OAuth 2.0 with refresh tokens

#### Outlook API Integration
- **Scopes**: `Mail.Read`, `Mail.ReadWrite`
- **Endpoints**:
  - `GET /me/messages`
  - `GET /me/messages/{id}`
- **Rate Limits**: 10,000 requests per 10 minutes
- **Authentication**: Microsoft OAuth 2.0

#### Clio API Integration
- **Version**: Clio API v4
- **Scopes**: `api:read`, `api:write`
- **Endpoints**:
  - `GET /api/v4/matters`
  - `POST /api/v4/activities`
  - `PUT /api/v4/activities/{id}`
- **Rate Limits**: 1000 requests/hour
- **Authentication**: OAuth 2.0

#### Gemini AI Integration
- **Model**: `gemini-1.5-flash` or `gemini-1.5-pro`
- **Rate Limits**: 60 requests/minute (free tier)
- **Authentication**: API key
- **Usage**: Email analysis, billing suggestions, corrections

### 4. Security Specifications

#### Authentication & Authorization
- **JWT Tokens**: 15-minute expiration for access tokens
- **Refresh Tokens**: 7-day expiration with rotation
- **Password Hashing**: bcrypt with 12 salt rounds
- **Session Management**: Secure HTTP-only cookies

#### Data Protection
- **Encryption**: AES-256-GCM for sensitive data at rest
- **HTTPS**: TLS 1.3 required for all communications
- **API Keys**: Encrypted storage with AWS KMS or similar
- **PII Handling**: Data minimization and secure deletion

#### Security Headers
```
Content-Security-Policy: default-src 'self'
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Strict-Transport-Security: max-age=31536000
X-XSS-Protection: 1; mode=block
```

### 5. Performance Specifications

#### Response Times
- **API Endpoints**: <500ms average response time
- **Email Sync**: <30 seconds for 100 emails
- **AI Processing**: <10 seconds for email analysis
- **Page Load**: <3 seconds initial load

#### Scalability
- **Concurrent Users**: Support 1000+ simultaneous users
- **Database**: Read replicas for analytics queries
- **Caching**: Redis for session and API response caching
- **CDN**: Static assets served via CDN

#### Monitoring
- **Uptime**: 99.9% availability target
- **Error Rate**: <1% of API requests
- **Performance**: Real-time monitoring with alerts
- **Logging**: Structured logging with ELK stack

### 6. Testing Specifications

#### Unit Tests
- **Coverage**: >90% code coverage
- **Framework**: Jest with React Testing Library
- **Mocking**: API calls and external dependencies

#### Integration Tests
- **API Testing**: Supertest for Express routes
- **Database Testing**: Test containers with PostgreSQL
- **External APIs**: Mock servers for Gmail, Outlook, Clio

#### End-to-End Tests
- **Framework**: Playwright or Cypress
- **Scenarios**: Complete user workflows
- **Cross-browser**: Chrome, Firefox, Safari, Edge

### 7. Deployment Specifications

#### Infrastructure
- **Cloud Provider**: AWS/GCP/Azure
- **Containerization**: Docker with Kubernetes
- **Database**: Managed PostgreSQL (RDS/Aurora/Cloud SQL)
- **Cache**: Managed Redis (ElastiCache/Memorystore)
- **CDN**: CloudFront/Cloud CDN

#### CI/CD Pipeline
- **Version Control**: Git with GitHub/GitLab
- **CI**: GitHub Actions/GitLab CI
- **Testing**: Automated test execution
- **Deployment**: Blue-green deployments
- **Monitoring**: Application Performance Monitoring (APM)

#### Environment Configuration
- **Development**: Local development with hot reload
- **Staging**: Full environment mirroring production
- **Production**: Multi-region deployment with failover
- **Secrets**: Environment-specific secret management

### 8. Compliance Specifications

#### Data Privacy
- **GDPR**: EU user data protection compliance
- **CCPA**: California consumer privacy compliance
- **Legal Ethics**: Compliance with legal professional standards

#### Security Compliance
- **SOC 2**: Security, availability, and confidentiality
- **ISO 27001**: Information security management
- **HIPAA**: Healthcare data protection (if applicable)

#### Accessibility
- **WCAG 2.1**: Level AA compliance
- **Screen Readers**: Full support for assistive technologies
- **Keyboard Navigation**: Complete keyboard accessibility

---

## Implementation Checklist

### Phase 1: Backend Infrastructure
- [ ] PostgreSQL database setup
- [ ] Prisma schema and migrations
- [ ] Express.js API server
- [ ] JWT authentication
- [ ] Basic CRUD operations
- [ ] API documentation

### Phase 2: Email Integration
- [ ] Gmail OAuth implementation
- [ ] Outlook OAuth implementation
- [ ] Email fetching and parsing
- [ ] Real-time email monitoring
- [ ] Email processing pipeline

### Phase 3: Clio Integration
- [ ] Clio OAuth setup
- [ ] Matter synchronization
- [ ] Time entry creation
- [ ] Sync status tracking
- [ ] Webhook implementation

### Phase 4: AI Processing
- [ ] Gemini AI integration
- [ ] Email triage automation
- [ ] Billable entry generation
- [ ] Confidence scoring
- [ ] Learning from corrections

### Phase 5: Chrome Extension
- [ ] Manifest V3 migration
- [ ] Content script optimization
- [ ] Background service worker
- [ ] Extension UI polish
- [ ] Cross-origin handling

### Phase 6: Production Deployment
- [ ] Comprehensive testing
- [ ] CI/CD pipeline
- [ ] Infrastructure provisioning
- [ ] Monitoring setup
- [ ] Security audit

---

*These specifications will be updated as the implementation progresses and new requirements are identified.*
