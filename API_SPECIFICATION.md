# 🔌 API Specifikacija

## Base URL
```
Development: http://localhost:5000/api
Production: https://api.petsitting.com/api
```

## Autentifikacija
Visi apsaugoti endpoint'ai reikalauja JWT token:
```
Authorization: Bearer <access_token>
```

---

## 📍 Endpoints

### 🔐 Auth

#### POST `/auth/register`
Registracija
```json
Request:
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "name": "John Doe",
  "phone": "+37061234567",
  "role": "OWNER" | "SITTER" | "BOTH"
}

Response 201:
{
  "message": "Registration successful. Please verify your email.",
  "userId": "uuid"
}
```

#### POST `/auth/verify-email`
Email verifikacija
```json
Request:
{
  "token": "verification_token_from_email"
}

Response 200:
{
  "message": "Email verified successfully"
}
```

#### POST `/auth/resend-verification`
Pakartotinis verifikacijos laiškas
```json
Request:
{
  "email": "user@example.com"
}

Response 200:
{
  "message": "Verification email sent"
}
```

#### POST `/auth/login`
Prisijungimas
```json
Request:
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}

Response 200:
{
  "accessToken": "jwt_token",
  "refreshToken": "refresh_jwt_token",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "OWNER",
    "avatar": "url",
    "isEmailVerified": true
  }
}
```

#### POST `/auth/refresh`
Token atnaujinimas
```json
Request:
{
  "refreshToken": "refresh_jwt_token"
}

Response 200:
{
  "accessToken": "new_jwt_token"
}
```

#### POST `/auth/forgot-password`
Slaptažodžio atkūrimas
```json
Request:
{
  "email": "user@example.com"
}

Response 200:
{
  "message": "Password reset email sent"
}
```

#### POST `/auth/reset-password`
Naujo slaptažodžio nustatymas
```json
Request:
{
  "token": "reset_token_from_email",
  "newPassword": "NewSecurePass123!"
}

Response 200:
{
  "message": "Password reset successful"
}
```

#### GET `/auth/me`
🔒 Gauti current user
```json
Response 200:
{
  "id": "uuid",
  "email": "user@example.com",
  "name": "John Doe",
  "phone": "+37061234567",
  "role": "OWNER",
  "avatar": "url",
  "isEmailVerified": true,
  "createdAt": "2024-01-01T00:00:00Z"
}
```

#### POST `/auth/logout`
🔒 Atsijungimas
```json
Response 200:
{
  "message": "Logged out successfully"
}
```

---

### 👤 Users

#### GET `/users/me`
🔒 Gauti savo profilį
```json
Response 200:
{
  "id": "uuid",
  "email": "user@example.com",
  "name": "John Doe",
  "phone": "+37061234567",
  "role": "OWNER",
  "avatar": "url",
  "isEmailVerified": true
}
```

#### PUT `/users/me`
🔒 Atnaujinti profilį
```json
Request:
{
  "name": "Jane Doe",
  "phone": "+37061234567",
  "role": "BOTH"
}

Response 200:
{
  "id": "uuid",
  "email": "user@example.com",
  "name": "Jane Doe",
  "phone": "+37061234567",
  "role": "BOTH",
  "avatar": "url"
}
```

#### POST `/users/me/avatar`
🔒 Upload avatar
```
Content-Type: multipart/form-data
Form field: avatar (file)

Response 200:
{
  "avatarUrl": "https://..."
}
```

#### DELETE `/users/me/avatar`
🔒 Ištrinti avatar
```json
Response 200:
{
  "message": "Avatar deleted"
}
```

---

### 🐾 Pets

#### GET `/pets`
🔒 Gauti savo pets (OWNER role)
```
Query params:
?limit=10&offset=0

Response 200:
{
  "pets": [
    {
      "id": "uuid",
      "name": "Buddy",
      "type": "DOG",
      "breed": "Golden Retriever",
      "age": 3,
      "photo": "url",
      "notes": "Friendly dog",
      "medicalNotes": "Allergic to chicken"
    }
  ],
  "total": 1
}
```

#### POST `/pets`
🔒 Sukurti pet (OWNER role)
```json
Request:
{
  "name": "Buddy",
  "type": "DOG",
  "breed": "Golden Retriever",
  "age": 3,
  "notes": "Friendly dog",
  "medicalNotes": "Allergic to chicken"
}

Response 201:
{
  "id": "uuid",
  "name": "Buddy",
  "type": "DOG",
  ...
}
```

#### GET `/pets/:id`
🔒 Gauti pet
```json
Response 200:
{
  "id": "uuid",
  "name": "Buddy",
  "type": "DOG",
  "breed": "Golden Retriever",
  "age": 3,
  "photo": "url",
  "notes": "Friendly dog",
  "medicalNotes": "Allergic to chicken",
  "createdAt": "2024-01-01T00:00:00Z"
}
```

#### PUT `/pets/:id`
🔒 Atnaujinti pet
```json
Request:
{
  "name": "Buddy Updated",
  "age": 4
}

Response 200:
{
  "id": "uuid",
  "name": "Buddy Updated",
  "age": 4,
  ...
}
```

#### DELETE `/pets/:id`
🔒 Ištrinti pet
```json
Response 200:
{
  "message": "Pet deleted successfully"
}
```

#### POST `/pets/:id/photo`
🔒 Upload pet photo
```
Content-Type: multipart/form-data
Form field: photo (file)

Response 200:
{
  "photoUrl": "https://..."
}
```

---

### 🧑‍💼 Sitters

#### GET `/sitters`
Paieška (public + filtrai)
```
Query params:
?city=Vilnius
&minRating=4
&maxHourlyRate=20
&service=DOG_WALKING
&date=2024-06-15
&latitude=54.6872
&longitude=25.2797
&radius=10 (km)
&sort=rating|price|distance
&limit=20
&offset=0

Response 200:
{
  "sitters": [
    {
      "id": "uuid",
      "userId": "uuid",
      "user": {
        "name": "Jane Smith",
        "avatar": "url"
      },
      "bio": "Experienced dog sitter",
      "city": "Vilnius",
      "hourlyRate": 15.00,
      "services": ["DOG_WALKING", "PET_SITTING"],
      "photos": ["url1", "url2"],
      "isVerified": true,
      "avgRating": 4.8,
      "totalReviews": 24,
      "responseTime": 30,
      "distance": 5.2 (if lat/lng provided)
    }
  ],
  "total": 15
}
```

#### GET `/sitters/:id`
Sitter profilis (public)
```json
Response 200:
{
  "id": "uuid",
  "userId": "uuid",
  "user": {
    "name": "Jane Smith",
    "avatar": "url"
  },
  "bio": "Experienced dog sitter with 5 years of experience",
  "city": "Vilnius",
  "address": "Vilnius, Lithuania" (be tikslaus adreso),
  "hourlyRate": 15.00,
  "services": ["DOG_WALKING", "PET_SITTING", "HOME_VISITS"],
  "photos": ["url1", "url2", "url3"],
  "availability": {
    "monday": { "start": "09:00", "end": "18:00" },
    "tuesday": { "start": "09:00", "end": "18:00" },
    ...
  },
  "maxPets": 2,
  "experienceYears": 5,
  "isVerified": true,
  "avgRating": 4.8,
  "totalReviews": 24,
  "responseTime": 30
}
```

#### POST `/sitters`
🔒 Sukurti/atnaujinti sitter profilį (SITTER role)
```json
Request:
{
  "bio": "Experienced dog sitter",
  "city": "Vilnius",
  "address": "Full address",
  "latitude": 54.6872,
  "longitude": 25.2797,
  "hourlyRate": 15.00,
  "services": ["DOG_WALKING", "PET_SITTING"],
  "availability": {
    "monday": { "start": "09:00", "end": "18:00" },
    ...
  },
  "maxPets": 2,
  "experienceYears": 5
}

Response 201:
{
  "id": "uuid",
  "userId": "uuid",
  "bio": "Experienced dog sitter",
  ...
}
```

#### PUT `/sitters/:id`
🔒 Atnaujinti sitter profilį (own profile)
```json
Request: (same as POST)

Response 200: (same as POST)
```

#### POST `/sitters/:id/photos`
🔒 Upload sitter photos
```
Content-Type: multipart/form-data
Form field: photos (multiple files)

Response 200:
{
  "photoUrls": ["url1", "url2"]
}
```

#### DELETE `/sitters/:id/photos`
🔒 Delete sitter photo
```json
Request:
{
  "photoUrl": "url_to_delete"
}

Response 200:
{
  "message": "Photo deleted"
}
```

#### GET `/sitters/:id/availability`
Check availability for date
```
Query: ?date=2024-06-15

Response 200:
{
  "available": true,
  "bookedSlots": [
    { "start": "09:00", "end": "12:00" }
  ]
}
```

#### GET `/sitters/:id/reviews`
Gauti reviews (public)
```
Query: ?limit=10&offset=0&sort=recent|rating

Response 200:
{
  "reviews": [
    {
      "id": "uuid",
      "author": {
        "name": "John Doe",
        "avatar": "url"
      },
      "rating": 5,
      "comment": "Great sitter!",
      "response": "Thank you!",
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ],
  "total": 24,
  "avgRating": 4.8
}
```

---

### 📅 Visits (Bookings)

#### GET `/visits`
🔒 Gauti visits
```
Query:
?role=owner|sitter (filtruoti pagal rolę)
&status=PENDING|ACCEPTED|PAID|COMPLETED|CANCELED
&limit=20
&offset=0

Response 200:
{
  "visits": [
    {
      "id": "uuid",
      "owner": {
        "name": "John Doe",
        "avatar": "url"
      },
      "sitter": {
        "name": "Jane Smith",
        "avatar": "url"
      },
      "pet": {
        "name": "Buddy",
        "type": "DOG",
        "photo": "url"
      },
      "date": "2024-06-15",
      "timeStart": "09:00",
      "timeEnd": "17:00",
      "address": "Vilnius, Gedimino pr. 1",
      "status": "PENDING",
      "totalPrice": 120.00,
      "notesForSitter": "Please feed at 12:00",
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ],
  "total": 5
}
```

#### POST `/visits`
🔒 Sukurti booking (OWNER role)
```json
Request:
{
  "sitterId": "uuid",
  "petId": "uuid",
  "date": "2024-06-15",
  "timeStart": "09:00",
  "timeEnd": "17:00",
  "address": "Vilnius, Gedimino pr. 1",
  "notesForSitter": "Please feed at 12:00"
}

Response 201:
{
  "id": "uuid",
  "status": "PENDING",
  "totalPrice": 120.00,
  ...
}
```

#### GET `/visits/:id`
🔒 Gauti visit
```json
Response 200:
{
  "id": "uuid",
  "owner": {...},
  "sitter": {...},
  "pet": {...},
  "date": "2024-06-15",
  "timeStart": "09:00",
  "timeEnd": "17:00",
  "address": "Vilnius, Gedimino pr. 1",
  "status": "ACCEPTED",
  "totalPrice": 120.00,
  "paidAt": "2024-01-02T00:00:00Z",
  "notesForSitter": "Please feed at 12:00"
}
```

#### PUT `/visits/:id/status`
🔒 Pakeisti statusą
```json
Request (SITTER):
{
  "status": "ACCEPTED" | "REJECTED",
  "reason": "optional rejection reason"
}

Request (OWNER - cancel):
{
  "status": "CANCELED",
  "reason": "optional cancellation reason"
}

Request (SITTER - complete):
{
  "status": "COMPLETED"
}

Response 200:
{
  "id": "uuid",
  "status": "ACCEPTED",
  ...
}
```

#### POST `/visits/:id/photos`
🔒 Upload visit photos (SITTER only)
```
Content-Type: multipart/form-data
Form field: photos (multiple files)
Form field: captions (optional JSON array)

Response 200:
{
  "photos": [
    {
      "id": "uuid",
      "url": "https://...",
      "caption": "Playing in the park",
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

#### GET `/visits/:id/photos`
🔒 Gauti visit photos
```json
Response 200:
{
  "photos": [
    {
      "id": "uuid",
      "url": "https://...",
      "caption": "Playing in the park",
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

---

### 💳 Payments

#### POST `/payments/intent`
🔒 Sukurti payment intent (OWNER)
```json
Request:
{
  "visitId": "uuid"
}

Response 200:
{
  "clientSecret": "pi_xxx_secret_xxx",
  "amount": 12000, // cents
  "transactionId": "uuid"
}
```

#### POST `/payments/confirm`
🔒 Confirm payment (webhook arba client)
```json
Request:
{
  "transactionId": "uuid",
  "paymentIntentId": "pi_xxx"
}

Response 200:
{
  "status": "COMPLETED",
  "visit": {
    "id": "uuid",
    "status": "PAID",
    ...
  }
}
```

#### POST `/payments/refund`
🔒 Refund (ADMIN arba auto on cancellation)
```json
Request:
{
  "transactionId": "uuid",
  "reason": "Cancellation within policy"
}

Response 200:
{
  "refundId": "re_xxx",
  "status": "REFUNDED",
  "amount": 12000
}
```

#### GET `/payments/history`
🔒 Transaction history
```
Query: ?limit=20&offset=0

Response 200:
{
  "transactions": [
    {
      "id": "uuid",
      "visit": {
        "id": "uuid",
        "date": "2024-06-15",
        "sitter": "Jane Smith"
      },
      "amount": 120.00,
      "status": "COMPLETED",
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ],
  "total": 15
}
```

---

### ⭐ Reviews

#### POST `/reviews`
🔒 Sukurti review (OWNER only, completed visit)
```json
Request:
{
  "visitId": "uuid",
  "sitterId": "uuid",
  "rating": 5,
  "comment": "Amazing sitter! Highly recommend!"
}

Response 201:
{
  "id": "uuid",
  "rating": 5,
  "comment": "Amazing sitter!",
  "createdAt": "2024-01-01T00:00:00Z"
}
```

#### PUT `/reviews/:id/response`
🔒 Sitter response
```json
Request:
{
  "response": "Thank you for the kind words!"
}

Response 200:
{
  "id": "uuid",
  "rating": 5,
  "comment": "Amazing sitter!",
  "response": "Thank you!",
  "respondedAt": "2024-01-02T00:00:00Z"
}
```

#### DELETE `/reviews/:id`
🔒 Ištrinti review (author only, within 24h)
```json
Response 200:
{
  "message": "Review deleted"
}
```

---

### 💬 Chat (REST)

#### GET `/chats`
🔒 Gauti visus chats
```
Query: ?limit=20&offset=0

Response 200:
{
  "chats": [
    {
      "id": "uuid",
      "otherUser": {
        "id": "uuid",
        "name": "Jane Smith",
        "avatar": "url"
      },
      "lastMessage": {
        "text": "See you tomorrow!",
        "createdAt": "2024-01-01T12:00:00Z"
      },
      "unreadCount": 2,
      "lastMessageAt": "2024-01-01T12:00:00Z"
    }
  ],
  "total": 5
}
```

#### POST `/chats`
🔒 Sukurti/gauti chat
```json
Request:
{
  "otherUserId": "uuid"
}

Response 201:
{
  "id": "uuid",
  "user1Id": "uuid",
  "user2Id": "uuid",
  "createdAt": "2024-01-01T00:00:00Z"
}
```

#### GET `/chats/:id/messages`
🔒 Gauti messages
```
Query: ?limit=50&before=messageId (pagination)

Response 200:
{
  "messages": [
    {
      "id": "uuid",
      "senderId": "uuid",
      "text": "Hello!",
      "attachmentUrl": null,
      "isRead": true,
      "readAt": "2024-01-01T12:01:00Z",
      "createdAt": "2024-01-01T12:00:00Z"
    }
  ],
  "hasMore": false
}
```

---

### 🔔 Notifications

#### GET `/notifications`
🔒 Gauti notifications
```
Query: ?limit=20&offset=0&unreadOnly=true

Response 200:
{
  "notifications": [
    {
      "id": "uuid",
      "type": "BOOKING_REQUEST",
      "title": "New booking request",
      "body": "John Doe wants to book you for June 15",
      "isRead": false,
      "relatedEntityId": "visit_uuid",
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ],
  "total": 10,
  "unreadCount": 3
}
```

#### PUT `/notifications/:id/read`
🔒 Mark as read
```json
Response 200:
{
  "message": "Notification marked as read"
}
```

#### PUT `/notifications/read-all`
🔒 Mark all as read
```json
Response 200:
{
  "message": "All notifications marked as read"
}
```

---

### 👨‍💼 Admin

#### GET `/admin/users`
🔒 ADMIN only
```
Query: ?search=email&limit=50&offset=0

Response 200:
{
  "users": [
    {
      "id": "uuid",
      "email": "user@example.com",
      "name": "John Doe",
      "role": "OWNER",
      "isBlocked": false,
      "isEmailVerified": true,
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ],
  "total": 150
}
```

#### PUT `/admin/users/:id/block`
🔒 ADMIN only
```json
Request:
{
  "isBlocked": true,
  "reason": "Violation of terms"
}

Response 200:
{
  "message": "User blocked successfully"
}
```

#### POST `/admin/sitters/:id/verify`
🔒 ADMIN only
```json
Request:
{
  "isVerified": true
}

Response 200:
{
  "message": "Sitter verified successfully"
}
```

#### PUT `/admin/reviews/:id/hide`
🔒 ADMIN only
```json
Request:
{
  "isHidden": true,
  "reason": "Inappropriate content"
}

Response 200:
{
  "message": "Review hidden"
}
```

#### GET `/admin/stats`
🔒 ADMIN only
```json
Response 200:
{
  "totalUsers": 1500,
  "totalSitters": 350,
  "totalVisits": 2400,
  "totalRevenue": 48000.00,
  "activeBookings": 45,
  "recentSignups": [...]
}
```

---

## Error Responses

```json
400 Bad Request:
{
  "error": "Validation failed",
  "message": "Invalid email format",
  "statusCode": 400
}

401 Unauthorized:
{
  "error": "Unauthorized",
  "message": "Invalid or expired token",
  "statusCode": 401
}

403 Forbidden:
{
  "error": "Forbidden",
  "message": "You don't have permission to access this resource",
  "statusCode": 403
}

404 Not Found:
{
  "error": "Not Found",
  "message": "Resource not found",
  "statusCode": 404
}

409 Conflict:
{
  "error": "Conflict",
  "message": "Email already exists",
  "statusCode": 409
}

500 Internal Server Error:
{
  "error": "Internal Server Error",
  "message": "Something went wrong",
  "statusCode": 500
}
```
