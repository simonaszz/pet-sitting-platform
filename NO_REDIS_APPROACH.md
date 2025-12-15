# 🚫 No Redis Approach

**Projektas dirba BE Redis** - PostgreSQL užtenka 1000 vartotojų vienu metu! 

---

## 📊 Sprendimo priežastys:

```
✅ Mažas/vidutinis srautas (~1000 vartotojų)
✅ Paprastesnė architektūra
✅ Mažiau moving parts
✅ Lengviau debug'inti
✅ PostgreSQL pakankamai greitas
```

---

## 🔄 Kas buvo planuota Redis → Kaip darysime:

### 1. **Refresh Tokens** 🔐

**Su Redis (kompleksiau):**
```typescript
await redis.set(`refresh:${userId}`, token, 'EX', 604800);
```

**Su PostgreSQL (paprasčiau):**
```typescript
await prisma.refreshToken.create({
  data: {
    userId,
    token: hashedToken,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  }
});
```

**Privalumai:**
- ✅ Persistent (nedingas per restart)
- ✅ Galima query (kada sukurtas, kiek aktyvių)
- ✅ Automatinis cleanup per cron job

**Schema:**
```prisma
model RefreshToken {
  id        String   @id @default(uuid())
  userId    String
  token     String   @unique
  expiresAt DateTime
  createdAt DateTime @default(now())
  
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@index([userId])
  @@index([expiresAt])
}
```

---

### 2. **Rate Limiting** 🚦

**Su Redis (greičiau):**
```typescript
const attempts = await redis.incr(`rate:${ip}`);
```

**Su PostgreSQL (pakanka):**
```typescript
// Middleware su in-memory Map (per NestJS)
const rateLimitMap = new Map<string, { count: number, resetAt: number }>();

function checkRateLimit(ip: string) {
  const now = Date.now();
  const record = rateLimitMap.get(ip);
  
  if (!record || record.resetAt < now) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + 60000 }); // 1 min
    return true;
  }
  
  if (record.count >= 10) {
    throw new Error('Too many requests');
  }
  
  record.count++;
  return true;
}
```

**Privalumai:**
- ✅ In-memory - super greitas
- ✅ Automatinis cleanup
- ✅ Pakanka MVP

**Alternatyva (persistent):**
```prisma
model RateLimit {
  id        String   @id @default(uuid())
  ip        String
  endpoint  String
  attempts  Int      @default(1)
  resetAt   DateTime
  
  @@unique([ip, endpoint])
  @@index([resetAt])
}
```

---

### 3. **Caching** 💾

**Su Redis (dedikuotas):**
```typescript
await redis.set('popular-sitters', data, 'EX', 300);
```

**Su PostgreSQL (paprasčiau):**

#### A) Materialized Views (PostgreSQL feature):
```sql
CREATE MATERIALIZED VIEW popular_sitters AS
SELECT * FROM sitter_profiles
ORDER BY avg_rating DESC
LIMIT 10;

-- Refresh kas 5 min
REFRESH MATERIALIZED VIEW popular_sitters;
```

#### B) In-memory cache (NestJS):
```typescript
@Injectable()
export class CacheService {
  private cache = new Map<string, { data: any, expiresAt: number }>();
  
  set(key: string, data: any, ttl: number) {
    this.cache.set(key, {
      data,
      expiresAt: Date.now() + ttl * 1000
    });
  }
  
  get(key: string) {
    const record = this.cache.get(key);
    if (!record || record.expiresAt < Date.now()) {
      this.cache.delete(key);
      return null;
    }
    return record.data;
  }
}
```

**Privalumai:**
- ✅ Pakanka mažam/vidutiniam traffic
- ✅ 0 external dependencies
- ✅ Lengva implementuoti

---

### 4. **Online Users** (Chat) 💬

**Su Redis (centralizuotas):**
```typescript
await redis.sadd('online-users', userId);
```

**Su Socket.IO in-memory (pakanka):**
```typescript
// Socket.IO saugo connected sockets
const connectedUsers = new Map<string, string>(); // userId -> socketId

io.on('connection', (socket) => {
  const userId = socket.handshake.auth.userId;
  connectedUsers.set(userId, socket.id);
  
  socket.on('disconnect', () => {
    connectedUsers.delete(userId);
  });
});

// Check if online
function isUserOnline(userId: string): boolean {
  return connectedUsers.has(userId);
}
```

**Privalumai:**
- ✅ Vienas server - nereikia sharing state
- ✅ Socket.IO jau turi šitą info
- ✅ Real-time, greitas

---

### 5. **Session Storage** 🔑

**Su Redis:**
```typescript
await redis.set(`session:${sessionId}`, data);
```

**Su JWT (stateless - geriau!):**
```typescript
// Nereikia saugoti session - viskas JWT token
const token = jwt.sign({ userId, role }, secret);

// Verify
const payload = jwt.verify(token, secret);
```

**Privalumai:**
- ✅ Stateless - horizontal scaling lengviau
- ✅ Nereikia DB query kiekvienam request
- ✅ Modernus approach

---

## 📈 Performance palyginimai (1000 vartotojų):

| Operacija | Su Redis | Su PostgreSQL | Su In-Memory |
|-----------|----------|---------------|--------------|
| **Rate limit check** | ~1ms | ~5ms | ~0.1ms |
| **Cache read** | ~2ms | ~10ms (query) | ~0.1ms |
| **Session verify** | ~1ms | N/A (JWT) | N/A (JWT) |
| **Online check** | ~1ms | N/A | ~0.1ms (Map) |

**Rezultatas:** Skirtumas 1000 vartotojų - **nežymus!** ⚡

---

## 🎯 Kada reikės Redis?

```
❌ DABAR: 100-1000 vartotojų
❌ ATEITYJE: 1,000-10,000 vartotojų (vis dar gali be Redis)
✅ KAI: 10,000+ concurrent users
✅ KAI: Multiple backend instances (horizontal scaling)
✅ KAI: Real-time features intensyvūs (100+ msg/sec)
```

---

## 💡 Migracijos planas (jei kada reikės):

1. **Pridėti Redis container** - 5 min
2. **Install ioredis** - 1 min
3. **Sukurti RedisModule** - 15 min
4. **Migruoti cache** - 30 min
5. **Migruoti rate limiting** - 30 min

**Total: ~1-2 valandos** kai reikės! 🚀

---

## ✅ TL;DR:

**PostgreSQL + In-memory caching = PAKANKA MVP!**

```
✅ PostgreSQL - persistent data
✅ JWT - stateless auth
✅ Map/Set - in-memory cache
✅ Socket.IO - online users
✅ Cron jobs - cleanup
```

**Redis pridėsime tik kai TIKRAI reikės!** 🎯
