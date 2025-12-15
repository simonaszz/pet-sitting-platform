# ✅ Validation Schemas

Validation schemas su pavyzdžiais backend (NestJS) ir frontend (Zod).

---

## 🔧 Backend Validation (class-validator)

### Auth DTOs

#### RegisterDto
```typescript
import { IsEmail, IsString, MinLength, MaxLength, Matches, IsEnum, IsOptional } from 'class-validator';
import { UserRole } from '@prisma/client';

export class RegisterDto {
  @IsEmail({}, { message: 'Invalid email format' })
  email: string;

  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @MaxLength(64, { message: 'Password must not exceed 64 characters' })
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
    { message: 'Password must contain uppercase, lowercase, number, and special character' }
  )
  password: string;

  @IsString()
  @MinLength(2, { message: 'Name must be at least 2 characters' })
  @MaxLength(50, { message: 'Name must not exceed 50 characters' })
  name: string;

  @IsOptional()
  @IsString()
  @Matches(/^\+?[1-9]\d{1,14}$/, { message: 'Invalid phone number format' })
  phone?: string;

  @IsEnum(UserRole, { message: 'Invalid role' })
  role: UserRole;
}
```

#### LoginDto
```typescript
export class LoginDto {
  @IsEmail({}, { message: 'Invalid email format' })
  email: string;

  @IsString()
  @MinLength(8)
  password: string;
}
```

#### ForgotPasswordDto
```typescript
export class ForgotPasswordDto {
  @IsEmail({}, { message: 'Invalid email format' })
  email: string;
}
```

#### ResetPasswordDto
```typescript
export class ResetPasswordDto {
  @IsString()
  token: string;

  @IsString()
  @MinLength(8)
  @MaxLength(64)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
  newPassword: string;
}
```

---

### User DTOs

#### UpdateUserDto
```typescript
import { IsString, IsOptional, MinLength, MaxLength, Matches, IsEnum } from 'class-validator';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  name?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\+?[1-9]\d{1,14}$/)
  phone?: string;

  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;
}
```

---

### Pet DTOs

#### CreatePetDto
```typescript
import { IsString, IsEnum, IsInt, IsOptional, Min, Max, MaxLength } from 'class-validator';
import { PetType } from '@prisma/client';

export class CreatePetDto {
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  name: string;

  @IsEnum(PetType, { message: 'Invalid pet type' })
  type: PetType;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  breed?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(50)
  age?: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  medicalNotes?: string;
}
```

#### UpdatePetDto
```typescript
import { PartialType } from '@nestjs/mapped-types';

export class UpdatePetDto extends PartialType(CreatePetDto) {}
```

---

### Sitter DTOs

#### CreateSitterProfileDto
```typescript
import { IsString, IsNumber, IsArray, IsOptional, MinLength, MaxLength, Min, Max, IsObject, IsInt, IsLatitude, IsLongitude } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateSitterProfileDto {
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  bio?: string;

  @IsString()
  @MinLength(2)
  @MaxLength(100)
  city: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  address?: string;

  @IsOptional()
  @IsLatitude()
  latitude?: number;

  @IsOptional()
  @IsLongitude()
  longitude?: number;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(1000)
  @Type(() => Number)
  hourlyRate: number;

  @IsArray()
  @IsString({ each: true })
  services: string[];

  @IsOptional()
  @IsObject()
  availability?: object;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10)
  maxPets?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(50)
  experienceYears?: number;
}
```

#### SearchSittersDto
```typescript
import { IsOptional, IsString, IsNumber, IsEnum, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

enum SortOption {
  RATING = 'rating',
  PRICE = 'price',
  DISTANCE = 'distance',
}

export class SearchSittersDto {
  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(5)
  @Type(() => Number)
  minRating?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  maxHourlyRate?: number;

  @IsOptional()
  @IsString()
  service?: string;

  @IsOptional()
  @IsString()
  date?: string; // YYYY-MM-DD

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  latitude?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  longitude?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  radius?: number; // km

  @IsOptional()
  @IsEnum(SortOption)
  sort?: SortOption;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit?: number = 20;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  offset?: number = 0;
}
```

---

### Visit DTOs

#### CreateVisitDto
```typescript
import { IsString, IsUUID, IsDateString, Matches, IsOptional, MaxLength } from 'class-validator';

export class CreateVisitDto {
  @IsUUID()
  sitterId: string;

  @IsUUID()
  petId: string;

  @IsDateString()
  date: string; // YYYY-MM-DD

  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, { message: 'Invalid time format (HH:mm)' })
  timeStart: string;

  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, { message: 'Invalid time format (HH:mm)' })
  timeEnd: string;

  @IsString()
  @MaxLength(200)
  address: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notesForSitter?: string;
}
```

#### UpdateVisitStatusDto
```typescript
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { VisitStatus } from '@prisma/client';

export class UpdateVisitStatusDto {
  @IsEnum(VisitStatus)
  status: VisitStatus;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}
```

---

### Review DTOs

#### CreateReviewDto
```typescript
import { IsUUID, IsInt, IsOptional, IsString, Min, Max, MaxLength } from 'class-validator';

export class CreateReviewDto {
  @IsUUID()
  visitId: string;

  @IsUUID()
  sitterId: string;

  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  comment?: string;
}
```

#### RespondReviewDto
```typescript
export class RespondReviewDto {
  @IsString()
  @MaxLength(500)
  response: string;
}
```

---

### Payment DTOs

#### CreatePaymentIntentDto
```typescript
import { IsUUID } from 'class-validator';

export class CreatePaymentIntentDto {
  @IsUUID()
  visitId: string;
}
```

---

### Chat DTOs

#### SendMessageDto
```typescript
import { IsUUID, IsOptional, IsString, MaxLength, IsUrl } from 'class-validator';

export class SendMessageDto {
  @IsUUID()
  chatId: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  text?: string;

  @IsOptional()
  @IsUrl()
  attachmentUrl?: string;
}
```

---

## ⚛️ Frontend Validation (Zod)

### Auth Schemas

```typescript
import { z } from 'zod';

// Register
export const registerSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(64, 'Password must not exceed 64 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
      'Password must contain uppercase, lowercase, number, and special character'
    ),
  name: z.string().min(2, 'Name must be at least 2 characters').max(50),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number').optional(),
  role: z.enum(['OWNER', 'SITTER', 'BOTH']),
});

export type RegisterFormData = z.infer<typeof registerSchema>;

// Login
export const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export type LoginFormData = z.infer<typeof loginSchema>;

// Forgot Password
export const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email format'),
});

// Reset Password
export const resetPasswordSchema = z.object({
  newPassword: z
    .string()
    .min(8)
    .max(64)
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});
```

---

### Pet Schemas

```typescript
export const petSchema = z.object({
  name: z.string().min(2).max(50),
  type: z.enum(['DOG', 'CAT', 'BIRD', 'RABBIT', 'OTHER']),
  breed: z.string().max(50).optional(),
  age: z.number().int().min(0).max(50).optional(),
  notes: z.string().max(500).optional(),
  medicalNotes: z.string().max(1000).optional(),
});

export type PetFormData = z.infer<typeof petSchema>;
```

---

### Sitter Schemas

```typescript
export const sitterProfileSchema = z.object({
  bio: z.string().max(1000).optional(),
  city: z.string().min(2).max(100),
  address: z.string().max(200).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  hourlyRate: z.number().min(0).max(1000),
  services: z.array(z.string()).min(1, 'Select at least one service'),
  availability: z.object({}).optional(),
  maxPets: z.number().int().min(1).max(10).optional(),
  experienceYears: z.number().int().min(0).max(50).optional(),
});

export type SitterProfileFormData = z.infer<typeof sitterProfileSchema>;
```

---

### Visit Schemas

```typescript
export const visitSchema = z.object({
  sitterId: z.string().uuid(),
  petId: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
  timeStart: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format'),
  timeEnd: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format'),
  address: z.string().max(200),
  notesForSitter: z.string().max(500).optional(),
}).refine((data) => data.timeEnd > data.timeStart, {
  message: 'End time must be after start time',
  path: ['timeEnd'],
});

export type VisitFormData = z.infer<typeof visitSchema>;
```

---

### Review Schema

```typescript
export const reviewSchema = z.object({
  visitId: z.string().uuid(),
  sitterId: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(1000).optional(),
});

export type ReviewFormData = z.infer<typeof reviewSchema>;
```

---

### Message Schema

```typescript
export const messageSchema = z.object({
  text: z.string().max(5000).optional(),
  attachmentUrl: z.string().url().optional(),
}).refine((data) => data.text || data.attachmentUrl, {
  message: 'Either text or attachment is required',
  path: ['text'],
});

export type MessageFormData = z.infer<typeof messageSchema>;
```

---

## 🎯 Usage Examples

### Backend (NestJS)

```typescript
import { Body, Controller, Post, ValidationPipe } from '@nestjs/common';
import { RegisterDto } from './dto/register.dto';

@Controller('auth')
export class AuthController {
  @Post('register')
  async register(@Body(new ValidationPipe()) dto: RegisterDto) {
    // dto is validated automatically
    return this.authService.register(dto);
  }
}
```

### Frontend (React Hook Form + Zod)

```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { registerSchema, RegisterFormData } from '@/schemas/auth.schema';

export function RegisterForm() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormData) => {
    try {
      await authService.register(data);
    } catch (error) {
      // Handle error
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('email')} />
      {errors.email && <p>{errors.email.message}</p>}

      <input {...register('password')} type="password" />
      {errors.password && <p>{errors.password.message}</p>}

      <button type="submit">Register</button>
    </form>
  );
}
```

---

## 📝 Custom Validators

### Backend

```typescript
// custom-validators/is-future-date.validator.ts
import { registerDecorator, ValidationOptions, ValidationArguments } from 'class-validator';

export function IsFutureDate(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isFutureDate',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          return value && new Date(value) > new Date();
        },
        defaultMessage(args: ValidationArguments) {
          return 'Date must be in the future';
        },
      },
    });
  };
}

// Usage
export class CreateVisitDto {
  @IsFutureDate()
  date: string;
}
```

### Frontend (Zod)

```typescript
// Custom date validator
const isFutureDate = z.string().refine((date) => {
  return new Date(date) > new Date();
}, {
  message: 'Date must be in the future',
});

export const visitSchema = z.object({
  date: isFutureDate,
  // ...
});
```

---

## 🔍 Error Handling

### Backend

```typescript
// Global validation pipe
app.useGlobalPipes(
  new ValidationPipe({
    whitelist: true, // Strip unknown properties
    forbidNonWhitelisted: true, // Throw error on unknown properties
    transform: true, // Auto-transform types
    transformOptions: {
      enableImplicitConversion: true,
    },
  })
);
```

### Frontend

```typescript
// Form error display
{errors.email && (
  <span className="text-sm text-red-500">
    {errors.email.message}
  </span>
)}
```

---

## ✅ Validation Checklist

### Backend:
- [ ] All DTOs have validation decorators
- [ ] Custom validators for complex logic
- [ ] Global validation pipe configured
- [ ] Error messages are user-friendly

### Frontend:
- [ ] All forms use Zod schemas
- [ ] Error messages displayed clearly
- [ ] Real-time validation (optional)
- [ ] Accessibility (ARIA labels for errors)

---

Ši specifikacija užtikrina, kad duomenų validacija būtų nuosekli ir saugi tiek backend, tiek frontend pusėje.
