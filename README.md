# Online Booking Management System

A responsive, full-stack appointment scheduling and service management application. Customers can explore available services, pick convenient dates and time slots, book appointments, and view or reschedule upcoming reservations. Service providers and administrators have access to an administrative dashboard to manage bookings, track revenue and appointment analytics, and update service catalog offerings in real time.

---

## Tech Stack

- **Frontend**:
  - Vanilla JavaScript (ES Modules)
  - Vite dev server & production bundler
  - Responsive CSS3 layout with mobile-first styling
  - Dynamic client-side routing & modal management
  - Resilient offline fallback to local storage

- **Backend**:
  - Java 17
  - Spring Boot 3.3.4 (REST API)
  - Spring Data JPA & Hibernate ORM
  - Jakarta Bean Validation
  - Spring Security Crypto (BCrypt password hashing)
  - MySQL Database

> For in-depth backend architecture, entity relationships, package structure, and complete REST API documentation, see the [Backend Documentation](backend/README.md).

---

## Prerequisites

- **Frontend**:
  - [Node.js](https://nodejs.org/) (version 18 or higher)
  - npm (bundled with Node.js)
- **Backend**:
  - [Java Development Kit (JDK)](https://adoptium.net/) (version 17 or higher)
  - [Apache Maven](https://maven.apache.org/) (version 3.8 or higher)
  - [MySQL Server](https://dev.mysql.com/downloads/mysql/) (version 8.0 or higher) running on port `3306`

---

## How to Run the Backend

1. **Create the Database in MySQL**:
   ```sql
   CREATE DATABASE IF NOT EXISTS online_booking_db;
   ```

2. **Configure Environment Variables**:
   The backend datasource requires database credentials. No hardcoded password defaults exist in source control.

   - **Linux / macOS (Bash / Zsh)**:
     ```bash
     export DB_USERNAME="root"
     export DB_PASSWORD="your_mysql_password"
     ```

   - **Windows (PowerShell)**:
     ```powershell
     $env:DB_USERNAME="root"
     $env:DB_PASSWORD="your_mysql_password"
     ```

   *(See `backend/.env.example` and `backend/README.md` for more configuration options).*

3. **Start the Spring Boot Application**:
   ```bash
   cd backend
   mvn spring-boot:run
   ```
   The backend REST API will start on `http://localhost:8080`.

---

## How to Run the Frontend

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Start the Development Server**:
   ```bash
   npm run dev
   ```
   The frontend will be available at `http://localhost:3000`.

3. **Build for Production**:
   ```bash
   npm run build
   ```

---

## Connecting Frontend and Backend

The frontend client communicates with the Spring Boot backend REST API:

- **Default Endpoint**: `http://localhost:8080/api`
- **Runtime Configuration**: The base URL can be dynamically customized by setting `window.__API_BASE_URL__` in the browser console:
  ```javascript
  window.__API_BASE_URL__ = "http://localhost:8080/api";
  ```
- **Build / Environment Configuration**: You can also configure `VITE_API_BASE_URL` in your `.env` file:
  ```env
  VITE_API_BASE_URL=http://localhost:8080/api
  ```
- **Resilient Fallback**: If the Spring Boot backend is not yet started or temporarily unreachable, the frontend automatically falls back to client storage, allowing all views, booking forms, reschedule dialogs, and admin tables to function seamlessly in offline/preview mode.

---

## Project Structure

```
├── backend/               # Spring Boot 3.3 + MySQL REST Backend
│   ├── pom.xml            # Maven project descriptor
│   ├── .env.example       # Backend database environment variables reference
│   ├── README.md          # Comprehensive REST API specifications and database setup
│   └── src/main/java/com/onlinebooking/
│       ├── controller/    # REST Controllers (Booking, Service, User, Health)
│       ├── dto/           # Request/Response Data Transfer Objects with validation
│       ├── entity/        # JPA Entities (User, ServiceItem, Booking)
│       ├── exception/     # Global exception handlers & custom exceptions
│       ├── repository/    # Spring Data JPA repositories
│       └── service/       # Business logic interfaces and implementations
├── src/                   # Frontend Application (Vite + Vanilla JS)
│   ├── app.js             # UI Controller, event bindings, and DOM rendering
│   ├── bookingService.js  # Client API service layer with REST fetch & offline fallback
│   ├── mockData.js        # Initial seed datasets
│   └── style.css          # Application styles
├── index.html             # Application entry point
├── package.json           # Frontend dependencies and npm scripts
└── .env.example           # Frontend environment configuration reference
```
