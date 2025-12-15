# 🔐 Security Specification

## Security Layers

### 1. Authentication & Authorization ✅

#### Password Security
```typescript
// Hashing with bcrypt
import * as bcrypt from 'bcrypt';

// Hash password
const saltRounds = 10;
const hashedPassword = await bcrypt.hash(plainPassword, saltRounds);

// Verify password
const isValid = await bcrypt.compare(plainPassword, hashedPassword);

// Requirements:
- Minimum 8 characters
- At least 1 uppercase letter
- At least 1 lowercase letter
- At least 1 number
- At least 1 special character
```

#### JWT Tokens
```typescript
// Access Token (short-lived)
{
  payload: {
    sub: userId,
    email: user.email,
    role: user.role
  },
  secret: process.env.JWT_SECRET,
  expiresIn: '15m'
}

// Refresh Token (long-lived)
{
  payload: {
    sub: userId,
    tokenVersion: user.tokenVersion // для инвалидации
  },
  secret: process.env.JWT_REFRESH_SECRET,
  expiresIn: '7d'
}

// Storage:
- Access token: localStorage or memory (XSS risk)
- Refresh token: httpOnly cookie (CSRF protection needed)
```

#### Role-Based Access Control (RBAC)
```typescript
// Decorator example (NestJS)
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@Get('admin/users')
async getUsers() {}

// Middleware
const rolesMatrix = {
  '/pets': ['OWNER', 'BOTH', 'ADMIN'],
  '/sitters/:id': ['SITTER', 'BOTH', 'ADMIN'],
  '/admin/*': ['ADMIN']
};
```

#### Email Verification
```typescript
// Flow:
1. User registers
2. Generate unique token: crypto.randomBytes(32).toString('hex')
3. Save token to user.emailVerifyToken
4. Send email with link: /auth/verify-email?token=xxx
5. User clicks link
6. Verify token, set isEmailVerified = true
7. Delete token

// Token expiry: 24 hours
```

#### Password Reset
```typescript
// Flow:
1. User requests reset
2. Generate token: crypto.randomBytes(32).toString('hex')
3. Save token + expiry (1 hour) to user
4. Send email with link: /auth/reset-password?token=xxx
5. User sets new password
6. Verify token not expired
7. Hash new password
8. Delete token
9. Invalidate all refresh tokens (optional)

// Security:
- Rate limit: max 3 requests per hour per email
- Token single-use only
- Old password NOT required (user forgot it)
```

---

### 2. Input Validation ✅

#### Request Validation (NestJS)
```typescript
// DTO with class-validator
import { IsEmail, IsString, MinLength, MaxLength, Matches } from 'class-validator';

export class RegisterDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  @MaxLength(64)
  @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message: 'Password too weak'
  })
  password: string;

  @IsString()
  @MinLength(2)
  @MaxLength(50)
  name: string;
}

// Usage
@Post('register')
async register(@Body() dto: RegisterDto) {}
```

#### Zod Schemas (Alternative)
```typescript
import { z } from 'zod';

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string()
    .min(8)
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/),
  name: z.string().min(2).max(50)
});

// Validate
const result = registerSchema.safeParse(data);
if (!result.success) {
  throw new BadRequestException(result.error);
}
```

#### SQL Injection Prevention
```typescript
// ✅ SAFE - Prisma ORM uses prepared statements
const user = await prisma.user.findFirst({
  where: { email: userInput }
});

// ❌ UNSAFE - Raw SQL without parameterization
const user = await prisma.$queryRaw(`SELECT * FROM users WHERE email = '${userInput}'`);

// ✅ SAFE - Parameterized raw query
const user = await prisma.$queryRaw`SELECT * FROM users WHERE email = ${userInput}`;
```

#### XSS Prevention
```typescript
// Sanitize user input before storing/displaying
import DOMPurify from 'isomorphic-dompurify';

const cleanHtml = DOMPurify.sanitize(userInput);

// Content Security Policy (CSP)
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
    }
  }
}));
```

---

### 3. Rate Limiting ✅

#### Express Rate Limit
```typescript
import rateLimit from 'express-rate-limit';

// General API rate limit
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // max 100 requests per window
  message: 'Too many requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api', apiLimiter);

// Strict limiter for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  skipSuccessfulRequests: true, // only count failed attempts
});

app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
```

#### Socket.IO Rate Limiting
```typescript
const socketRateLimits = new Map();

socket.on('send_message', (data) => {
  const userId = socket.data.userId;
  const now = Date.now();
  
  if (!socketRateLimits.has(userId)) {
    socketRateLimits.set(userId, []);
  }
  
  const userRequests = socketRateLimits.get(userId);
  
  // Remove requests older than 1 minute
  const recentRequests = userRequests.filter(
    time => now - time < 60000
  );
  
  if (recentRequests.length >= 30) {
    socket.emit('error', { message: 'Rate limit exceeded' });
    return;
  }
  
  recentRequests.push(now);
  socketRateLimits.set(userId, recentRequests);
  
  // Process message
});
```

---

### 4. File Upload Security ✅

#### Multer Configuration
```typescript
import multer from 'multer';
import path from 'path';

// Storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, './uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type'), false);
  }
};

// Multer instance
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
    files: 5 // max 5 files at once
  }
});

// Usage
@Post('upload')
@UseInterceptors(FileInterceptor('file'))
async uploadFile(@UploadedFile() file: Express.Multer.File) {
  // Validate file again
  if (!file) {
    throw new BadRequestException('No file uploaded');
  }
  
  // Additional checks
  const fileSize = file.size;
  const mimeType = file.mimetype;
  
  // Scan for malware (optional - ClamAV)
  await scanFile(file.path);
  
  return { url: `/uploads/${file.filename}` };
}
```

#### Image Processing & Security
```typescript
import sharp from 'sharp';

// Strip metadata, resize, optimize
const processImage = async (inputPath: string, outputPath: string) => {
  await sharp(inputPath)
    .resize(1920, 1080, { fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 85, progressive: true })
    .withMetadata(false) // remove EXIF data
    .toFile(outputPath);
};
```

---

### 5. CORS Configuration ✅

```typescript
import cors from 'cors';

const corsOptions = {
  origin: (origin, callback) => {
    const allowedOrigins = [
      'http://localhost:5173',
      'https://yourdomain.com'
    ];
    
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true, // allow cookies
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['X-Total-Count'],
  maxAge: 86400 // 24 hours
};

app.use(cors(corsOptions));
```

---

### 6. HTTPS & Security Headers ✅

#### Helmet.js
```typescript
import helmet from 'helmet';

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  frameguard: { action: 'deny' },
  noSniff: true,
  xssFilter: true
}));
```

#### HTTPS Redirect (Production)
```typescript
app.use((req, res, next) => {
  if (process.env.NODE_ENV === 'production' && req.header('x-forwarded-proto') !== 'https') {
    res.redirect(`https://${req.header('host')}${req.url}`);
  } else {
    next();
  }
});
```

---

### 7. Database Security ✅

#### Prisma Configuration
```prisma
// schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// Enable row-level security (RLS)
// Enable SSL connection in production
// DATABASE_URL="postgresql://user:pass@host:5432/db?schema=public&sslmode=require"
```

#### Connection Security
```typescript
// Use connection pooling
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  log: ['error', 'warn'],
});

// Close connections on shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});
```

#### Sensitive Data Encryption
```typescript
import crypto from 'crypto';

const algorithm = 'aes-256-cbc';
const key = crypto.scryptSync(process.env.ENCRYPTION_KEY, 'salt', 32);

export const encrypt = (text: string): string => {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
};

export const decrypt = (text: string): string => {
  const parts = text.split(':');
  const iv = Buffer.from(parts[0], 'hex');
  const encrypted = parts[1];
  const decipher = crypto.createDecipheriv(algorithm, key, iv);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
};

// Usage: encrypt sensitive data before storing
user.ssn = encrypt(ssn);
```

---

### 8. Payment Security (Stripe) ✅

```typescript
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
});

// ✅ Create payment intent server-side
@Post('payments/intent')
async createPaymentIntent(@Body() dto: CreatePaymentIntentDto) {
  const visit = await this.prismaService.visit.findUnique({
    where: { id: dto.visitId },
    include: { owner: true }
  });
  
  // Verify ownership
  if (visit.ownerId !== req.user.id) {
    throw new ForbiddenException();
  }
  
  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(visit.totalPrice.toNumber() * 100), // cents
    currency: 'eur',
    metadata: {
      visitId: visit.id,
      userId: req.user.id
    }
  });
  
  return { clientSecret: paymentIntent.client_secret };
}

// ✅ Webhook handling
@Post('webhooks/stripe')
async handleStripeWebhook(@Req() req: RawBodyRequest<Request>) {
  const sig = req.headers['stripe-signature'];
  
  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    throw new BadRequestException(`Webhook Error: ${err.message}`);
  }
  
  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object;
    await this.handlePaymentSuccess(paymentIntent);
  }
  
  return { received: true };
}

// ❌ NEVER send Stripe secret key to frontend
// ❌ NEVER trust client-side amount calculation
// ✅ ALWAYS verify payment on backend
```

---

### 9. Logging & Monitoring ✅

#### Winston Logger
```typescript
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'petsitting-api' },
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
  ],
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple(),
  }));
}

// Usage
logger.info('User logged in', { userId, email });
logger.error('Payment failed', { error, userId, visitId });

// Security events to log:
- Failed login attempts
- Password resets
- Payment transactions
- File uploads
- Admin actions
- API errors
- Rate limit violations
```

#### Sentry Integration
```typescript
import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
});

// Error handler
app.use(Sentry.Handlers.errorHandler());

// Capture exceptions
try {
  // code
} catch (error) {
  Sentry.captureException(error);
  throw error;
}
```

---

### 10. Privacy & GDPR Compliance ✅

#### Data Minimization
```typescript
// Only collect necessary data
// Don't store sensitive data unless required
// Delete data when no longer needed

// Example: Remove sensitive fields from API responses
const userPublicProfile = {
  id: user.id,
  name: user.name,
  avatar: user.avatar,
  // DON'T expose: email, phone, passwordHash
};
```

#### Right to be Forgotten
```typescript
@Delete('users/me')
async deleteAccount(@Req() req) {
  const userId = req.user.id;
  
  // Anonymize or delete user data
  await this.prisma.$transaction([
    // Delete or anonymize messages
    this.prisma.message.updateMany({
      where: { senderId: userId },
      data: { text: '[deleted]', deletedAt: new Date() }
    }),
    
    // Delete visits (if allowed by business logic)
    this.prisma.visit.deleteMany({ where: { ownerId: userId }}),
    
    // Delete reviews
    this.prisma.review.deleteMany({ where: { authorId: userId }}),
    
    // Delete user
    this.prisma.user.delete({ where: { id: userId }})
  ]);
  
  return { message: 'Account deleted' };
}
```

---

## Security Checklist

### Authentication
- [ ] Strong password policy
- [ ] Password hashing with bcrypt
- [ ] JWT with short expiry
- [ ] Refresh token mechanism
- [ ] Email verification
- [ ] Password reset with token expiry
- [ ] Rate limiting on auth endpoints

### Authorization
- [ ] Role-based access control
- [ ] Resource ownership validation
- [ ] Admin-only endpoints protected

### Input Validation
- [ ] Request DTOs validated
- [ ] SQL injection prevention (Prisma)
- [ ] XSS prevention (sanitization)
- [ ] CSRF protection (if using cookies)

### Files
- [ ] File type validation
- [ ] File size limits
- [ ] Malware scanning (optional)
- [ ] Metadata stripping
- [ ] Secure file storage

### Network
- [ ] HTTPS enabled (production)
- [ ] CORS configured
- [ ] Security headers (Helmet)
- [ ] Rate limiting

### Database
- [ ] Connection pooling
- [ ] SSL connection (production)
- [ ] Sensitive data encryption
- [ ] Backups configured

### Payment
- [ ] Server-side validation
- [ ] Webhook signature verification
- [ ] Never expose secret keys

### Monitoring
- [ ] Error logging
- [ ] Security events logged
- [ ] Sentry/monitoring setup

### Privacy
- [ ] GDPR compliance
- [ ] Data minimization
- [ ] Right to be forgotten

---

## Incident Response Plan

### 1. Detection
- Monitor logs for suspicious activity
- Set up alerts for security events
- Regular security audits

### 2. Response
1. Isolate affected systems
2. Investigate extent of breach
3. Notify affected users (GDPR requirement)
4. Patch vulnerabilities
5. Reset tokens/passwords if needed

### 3. Recovery
1. Restore from backups if needed
2. Implement additional security measures
3. Document incident

### 4. Post-Incident
1. Review and update security policies
2. Additional testing
3. Team training
