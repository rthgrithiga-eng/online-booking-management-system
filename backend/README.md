# Online Booking Management System - Backend

A Spring Boot backend application built with a layered architecture:
`Controller` → `Service` → `Repository` → `Entity` → `MySQL`

## Technology Stack

- **Java**: 17+
- **Framework**: Spring Boot 3.3.4
- **Modules**:
  - Spring Web (`spring-boot-starter-web`)
  - Spring Security (`spring-boot-starter-security`)
  - JJWT (`io.jsonwebtoken:jjwt-api:0.11.5`)
  - Spring Data JPA (`spring-boot-starter-data-jpa`)
  - Jakarta Validation (`spring-boot-starter-validation`)
- **Database Driver**: MySQL Connector/J (`mysql-connector-j`)
- **Build Tool**: Maven

## Package Structure

```
com.onlinebooking
├── BookingApplication.java       # Main entry point
├── config
│   ├── PasswordEncoderConfig.java# BCrypt password encoder bean definition
│   ├── SecurityConfig.java       # Spring Security & JWT filter chain configuration
│   └── WebConfig.java            # Global CORS and Web MVC configuration
├── controller
│   ├── AuthController.java       # Authentication & JWT token issuance (POST /api/auth/login)
│   ├── BookingController.java    # REST Endpoints for appointments (role-protected)
│   ├── HealthController.java     # System health check (public)
│   ├── ServiceController.java    # REST Endpoints for services (public read, admin write)
│   └── UserController.java       # REST Endpoints for user registration & management
├── dto
│   ├── BookingRequestDTO.java    # Booking creation validation DTO
│   ├── BookingResponseDTO.java   # Booking response with user & service details
│   ├── BookingStatusUpdateDTO.java# Status update validation DTO
│   ├── BookingUpdateDTO.java      # Reschedule & notes update DTO
│   ├── LoginRequestDTO.java      # Email & password login payload
│   ├── LoginResponseDTO.java     # JWT token & user identity payload
│   ├── ServiceRequestDTO.java    # Service creation/update validation DTO
│   ├── ServiceResponseDTO.java   # Service item response DTO
│   ├── UserRequestDTO.java       # User registration request DTO
│   └── UserResponseDTO.java      # Safe user response (passwords excluded)
├── entity
│   ├── Booking.java              # Booking JPA Entity
│   ├── BookingStatus.java        # Enum: PENDING, CONFIRMED, CANCELLED, COMPLETED
│   ├── ServiceItem.java          # Service item JPA Entity
│   ├── User.java                 # User account JPA Entity
│   └── UserRole.java             # Enum: CUSTOMER, ADMIN
├── exception
│   ├── DuplicateResourceException.java # 409 conflict for duplicate entities (e.g., email)
│   ├── ErrorResponse.java        # Standardized error payload
│   ├── GlobalExceptionHandler.java # Centralized @RestControllerAdvice (401, 403, 404, 409)
│   ├── ResourceNotFoundException.java # 404 handler
│   └── SlotUnavailableException.java  # 409 conflict handler
├── repository
│   ├── BookingRepository.java    # Spring Data JPA Repository for bookings
│   ├── ServiceItemRepository.java# Spring Data JPA Repository for services
│   └── UserRepository.java       # Spring Data JPA Repository for users
├── security
│   ├── JwtAccessDeniedHandler.java    # 403 Forbidden handler
│   ├── JwtAuthenticationEntryPoint.java# 401 Unauthorized handler
│   ├── JwtAuthenticationFilter.java   # OncePerRequestFilter extracting Bearer token
│   ├── JwtTokenProvider.java          # HMAC-SHA256 JWT generation & validation
│   └── UserPrincipal.java             # Authenticated user representation
└── service
    ├── BookingService.java       # Interface for appointment workflows
    ├── ServiceItemService.java   # Interface for catalog management
    ├── UserService.java          # Interface for user management
    └── impl
        ├── BookingServiceImpl.java     # Booking workflow & conflict business logic
        ├── ServiceItemServiceImpl.java # ServiceItem CRUD business logic implementation
        └── UserServiceImpl.java        # User registration, BCrypt hashing & query implementation
```

## Authentication & Authorization (Spring Security + JWT)

The backend uses stateless JWT (JSON Web Token) authentication with HMAC-SHA256 signatures. Passwords are encrypted using `BCryptPasswordEncoder` (strength 10).

### Access Control Matrix

| Endpoint | Method | Required Role / Auth | Description |
| :--- | :--- | :--- | :--- |
| `/api/auth/login` | `POST` | **Public** | Authenticate credentials and acquire JWT |
| `/api/users` | `POST` | **Public** | Register a new user account |
| `/api/services` | `GET` | **Public** | Browse catalog of services |
| `/api/services/{id}` | `GET` | **Public** | View service details |
| `/api/health` | `GET` | **Public** | Health check |
| `/api/services` | `POST` | `ADMIN` | Create a new service |
| `/api/services/{id}` | `PUT` | `ADMIN` | Update a service |
| `/api/services/{id}` | `DELETE` | `ADMIN` | Deactivate a service |
| `/api/users` | `GET` | `ADMIN` | List all registered users |
| `/api/bookings` | `GET` | `ADMIN` (all) / `CUSTOMER` (own) | View all bookings across users (Admin) or own bookings (Customer) |
| `/api/bookings/{id}` | `GET` | `ADMIN` or Owner | View single booking details |
| `/api/bookings` | `POST` | Authenticated | Create a booking (customers book for themselves) |
| `/api/bookings/{id}` | `PUT` | `ADMIN` or Owner | Reschedule booking |
| `/api/bookings/{id}` | `DELETE` | `ADMIN` or Owner | Cancel booking |
| `/api/bookings/{id}/status` | `PATCH` | `ADMIN` | Update booking status (`CONFIRMED`, `COMPLETED`, etc.) |

---

### 1. User Login (`POST /api/auth/login`)

Authenticate with registered email and password to receive a JWT token.

**Request:**
```http
POST /api/auth/login HTTP/1.1
Content-Type: application/json

{
  "email": "elena.rostova@example.com",
  "password": "SecurePassword123!"
}
```

**Success Response (`200 OK`):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJlbGVuYS5yb3N0b3ZhQGV4YW1wbGUuY29tIiwidXNlcklkIjoxLCJyb2xlIjoiQ1VTVE9NRVIiLCJpYXQiOjE3MjY0MDEwMDAsImV4cCI6MTcyNjQ4NzQwMH0...",
  "tokenType": "Bearer",
  "userId": 1,
  "email": "elena.rostova@example.com",
  "fullName": "Elena Rostova",
  "role": "CUSTOMER"
}
```

**Failure Response (`401 UNAUTHORIZED`):**
```json
{
  "statusCode": 401,
  "error": "Unauthorized",
  "message": "Invalid email or password",
  "path": "/api/auth/login",
  "timestamp": "2026-09-15T02:50:00"
}
```

---

### 2. Passing the JWT Token in Protected Requests

Include the token in the standard HTTP `Authorization` header prefixed with `Bearer `:

```http
GET /api/bookings HTTP/1.1
Authorization: Bearer eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJlbGVuYS5yb3N0b3ZhQGV4YW1wbGUuY29tI...
```

**Example using `curl`:**
```bash
# 1. Login to get token
TOKEN=$(curl -s -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"AdminPassword123!"}' \
  | grep -o '"token":"[^"]*' | cut -d'"' -f4)

# 2. Make authenticated admin request
curl -X GET http://localhost:8080/api/bookings \
  -H "Authorization: Bearer $TOKEN"
```

If the header is missing, malformed, or expired on a protected endpoint, the backend responds with `401 Unauthorized`. If a user attempts to access an endpoint restricted to a different role (such as a customer attempting `POST /api/services`), the backend responds with `403 Forbidden`.


## User Management Module REST APIs

| HTTP Method | Endpoint | Description | Request Body / Params | Status Code |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/users` | Register a new user (hashes password via BCrypt) | `UserRequestDTO` (JSON) | `201 CREATED` (or `409 CONFLICT` if email exists) |
| `GET` | `/api/users` | List all users (passwords never exposed) | None (optional query param `?email=...`) | `200 OK` |
| `GET` | `/api/users/{id}` | View one user by ID | None | `200 OK` (or `404 NOT FOUND`) |

### User Request Payloads

#### 1. Register User (`POST /api/users`)
```json
{
  "fullName": "Elena Rostova",
  "email": "elena.rostova@example.com",
  "password": "SecurePassword123!",
  "phone": "+1 (555) 432-8765",
  "role": "CUSTOMER"
}
```
*Validations & Business Rules:*
- `fullName`: Required, 2–100 characters
- `email`: Required, valid email format, must be unique across the database (returns `409 CONFLICT` if already registered)
- `password`: Required, minimum 6 characters (hashed with `BCryptPasswordEncoder` before database persistence)
- `phone`: Optional, validated against phone regex pattern
- `role`: Optional, defaults to `CUSTOMER` (`CUSTOMER` or `ADMIN`)
- Response: Returns `UserResponseDTO` with user ID, name, email, phone, role, and created timestamp without exposing the password hash.

## Service Management CRUD REST APIs

| HTTP Method | Endpoint | Description | Request Body | Success Status |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/services` | Create a new service | `ServiceRequestDTO` (JSON) | `201 CREATED` |
| `GET` | `/api/services` | View all services | None (query param `?activeOnly=true` optional) | `200 OK` |
| `GET` | `/api/services/{id}` | View one service by ID | None | `200 OK` (or `404 NOT FOUND`) |
| `PUT` | `/api/services/{id}` | Update existing service | `ServiceRequestDTO` (JSON) | `200 OK` (or `404 NOT FOUND`) |
| `DELETE` | `/api/services/{id}` | Soft delete (deactivate) service | None | `200 OK` (or `404 NOT FOUND`) |

## Booking Management Module REST APIs

| HTTP Method | Endpoint | Description | Request Body / Params | Status Code |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/bookings` | Create a new booking | `BookingRequestDTO` (JSON) | `201 CREATED` (or `409 CONFLICT`) |
| `GET` | `/api/bookings` | List all bookings / search & filter | Query: `status`, `userId`, `serviceId`, `date` | `200 OK` |
| `GET` | `/api/bookings/{id}` | View booking details by ID | None | `200 OK` (or `404 NOT FOUND`) |
| `PUT` | `/api/bookings/{id}` | Update / Reschedule booking | `BookingUpdateDTO` (JSON) | `200 OK` (or `409 CONFLICT`) |
| `PATCH` | `/api/bookings/{id}/status` | Update booking status | `BookingStatusUpdateDTO` (JSON) | `200 OK` (or `400 BAD REQUEST`) |
| `DELETE` | `/api/bookings/{id}` | Cancel booking (sets status to CANCELLED) | None | `200 OK` (or `404 NOT FOUND`) |

### Booking Request Payloads

#### 1. Create Booking (`POST /api/bookings`)
```json
{
  "userId": 1,
  "serviceId": 2,
  "bookingDateTime": "2026-09-20T10:00:00",
  "notes": "Morning appointment requested"
}
```
*Validations enforced:*
- User must exist (throws 404 if not found)
- Service must exist (throws 404 if not found)
- Service must be active (`isActive == true`)
- Booking date/time must be in the future
- Slot must not conflict with an existing active booking for the same service (returns `409 CONFLICT` with error message if booked)

#### 2. Reschedule Booking (`PUT /api/bookings/{id}`)
```json
{
  "bookingDateTime": "2026-09-22T14:30:00",
  "notes": "Updated due to schedule change"
}
```
*Validations enforced:*
- Booking must exist
- New date/time must be in the future
- New time slot must not conflict with other bookings (excluding current booking and cancelled bookings)

#### 3. Update Status (`PATCH /api/bookings/{id}/status`)
```json
{
  "status": "CONFIRMED"
}
```
Allowed status values: `PENDING`, `CONFIRMED`, `CANCELLED`, `COMPLETED`

#### 4. Filter Bookings (`GET /api/bookings`)
- By status: `GET /api/bookings?status=CONFIRMED`
- By user ID: `GET /api/bookings?userId=1`
- By service ID: `GET /api/bookings?serviceId=2`
- By specific date: `GET /api/bookings?date=2026-09-20`
- Combine filters: `GET /api/bookings?status=CONFIRMED&serviceId=2&date=2026-09-20`

## Design Decisions

### Soft Delete Strategy

Both `DELETE /api/services/{id}` and `DELETE /api/bookings/{id}` perform soft deletes rather than removing database rows. Hard deletes were intentionally avoided to preserve appointment history, maintain business and revenue audit trails, and prevent orphaned foreign key references.

- **Services (`isActive = false`)**: Deleting a service marks `isActive = false` (deactivation). This ensures that no new appointments can be booked against the service while keeping all existing and past customer bookings intact without breaking relational foreign key constraints.
- **Bookings (`status = CANCELLED`)**: Deleting a booking sets its `status = CANCELLED` and records an `updatedAt` timestamp. This immediately frees the reserved time slot for other customers while retaining the historical trail for customer accounts, cancellation analytics, and administrative auditing.

## Configuration & Environment Variables

The backend application requires database credentials and a JWT signing secret to run. For security reasons, sensitive secrets do not have baked-in source code defaults and must be supplied via environment variables:

- **`DB_USERNAME`**: Database username (defaults to `root` if omitted).
- **`DB_PASSWORD`**: Database password (**REQUIRED** — no default fallback).
- **`JWT_SECRET`**: HMAC-SHA256 secret key for signing JWT tokens (**REQUIRED** — no default fallback; Spring Boot will fail to start if this is unset). Must be at least 256 bits (32 bytes).

### Generating a Secure JWT Secret

You can generate a cryptographically secure 256-bit (64 hex characters) secret key using OpenSSL:

```bash
openssl rand -hex 32
```

Example output:
```text
8f4a1c7e9b2d3f0a5e8c1b4d7a0f2e5c8b1d4a7f0e3c6b9d2a5f8c1e4b7d0a3f
```

### Setting Environment Variables

**Linux / macOS (Bash / Zsh):**
```bash
export DB_USERNAME="root"
export DB_PASSWORD="your_password_here"
export JWT_SECRET="$(openssl rand -hex 32)"
```

**Windows (PowerShell):**
```powershell
$env:DB_USERNAME="root"
$env:DB_PASSWORD="your_password_here"
$env:JWT_SECRET="8f4a1c7e9b2d3f0a5e8c1b4d7a0f2e5c8b1d4a7f0e3c6b9d2a5f8c1e4b7d0a3f"
```

Refer to `.env.example` for reference variable definitions.

## Database Setup (MySQL)

1. Ensure MySQL is running on your machine on port `3306`.
2. Create the database:
   ```sql
   CREATE DATABASE IF NOT EXISTS online_booking_db;
   ```

Tables (`users`, `service_items`, `bookings`) will be automatically created and synchronized by Hibernate with `spring.jpa.hibernate.ddl-auto=update`.

## Running the Application

Using Maven with environment variables set:

```bash
cd backend
export DB_USERNAME="root"
export DB_PASSWORD="your_password_here"
export JWT_SECRET="$(openssl rand -hex 32)"
mvn clean spring-boot:run
```

Or pass credentials inline in a single command:

```bash
cd backend
DB_PASSWORD="your_password_here" JWT_SECRET="8f4a1c7e9b2d3f0a5e8c1b4d7a0f2e5c8b1d4a7f0e3c6b9d2a5f8c1e4b7d0a3f" mvn spring-boot:run
```

Or via Spring Boot CLI arguments:

```bash
cd backend
mvn spring-boot:run -Dspring-boot.run.arguments="--spring.datasource.username=root --spring.datasource.password=your_password_here --jwt.secret=8f4a1c7e9b2d3f0a5e8c1b4d7a0f2e5c8b1d4a7f0e3c6b9d2a5f8c1e4b7d0a3f"
```

## Verification

Once started, test the health check endpoint:

```bash
curl http://localhost:8080/api/health
```

Expected response:
```json
{
  "service": "Online Booking Management System Backend",
  "database": "MySQL (online_booking_db)",
  "framework": "Spring Boot 3",
  "status": "UP",
  "timestamp": "2026-09-15T..."
}
```

## Testing (Postman)

A ready-to-import Postman collection covering every REST API endpoint is included at:

```
backend/postman/OnlineBookingSystem.postman_collection.json
```

### What it covers

The collection is organized into folders that mirror the API structure, and follows the project's testing procedure by including, for each resource, **valid**, **missing-field**, **duplicate**, **not-found**, and **conflict** cases:

| Folder | Requests | Cases covered |
|---|---|---|
| `0. Health` | 1 | Health check (`200 UP`) |
| `1. Users` | 8 | Register (valid, missing field, duplicate email, invalid email format), list all (admin), get by id (valid + not found), plus a flagged security-regression check (see below) |
| `2. Auth` | 4 | Login (valid admin, valid customer, invalid password, non-existent email) |
| `3. Services` | 11 | Create (valid, missing field, non-admin forbidden), read all/active-only/by-id/not-found, update (valid + not found), delete/deactivate (valid + not found) |
| `4. Bookings` | 14 | Create (valid, invalid service id, past date, conflicting slot), read all/filtered/by-id/not-found, reschedule (valid + not found), status update (valid + invalid value), cancel (valid + not found) |

### How to run it

1. Start the backend (`mvn spring-boot:run`) and confirm `GET /api/health` returns `UP`.
2. Open Postman → **Import** → select `backend/postman/OnlineBookingSystem.postman_collection.json`.
3. The collection uses a `baseUrl` variable (defaults to `http://localhost:8080/api`) — update it in the collection's **Variables** tab if your backend runs elsewhere.
4. Run the folders **in order, top to bottom**: `Health → Users → Auth → Services → Bookings`. Later requests depend on IDs and JWT tokens captured automatically by earlier ones (via collection variables, set through each request's **Tests** script) — for example, registering a user in the `Users` folder must happen before logging in as that user in the `Auth` folder.
5. Easiest way to run the whole sequence: select the collection → **Run** (Collection Runner) → keep the default top-to-bottom order → **Run Online Booking Management System API**.
6. Review the **Test Results** tab after each request/run — every request has assertions on status code and, where relevant, response shape (e.g. no `password` field leaking, status transitions, array responses).

### ⚠️ Known issue surfaced by this collection

The `[SECURITY CHECK] Register - Self-Assign ADMIN Role` request in the `Users` folder is an **intentional regression test**, not a feature test. It demonstrates that `POST /api/users` (a public, unauthenticated endpoint) currently accepts a client-supplied `"role": "ADMIN"` field and honors it — meaning any unauthenticated caller can register themselves directly as an administrator. The request is used here only to obtain a working admin account for the rest of the collection (since the seeded admin account in `data.sql` has an invalid password hash and cannot log in). This should be fixed by having `UserServiceImpl.registerUser()` always force `UserRole.CUSTOMER` on public registration, with admin accounts created only through a separate, authenticated admin-only path (or seeded directly in the database with a real BCrypt hash).
