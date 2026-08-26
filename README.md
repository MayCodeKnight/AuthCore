# AuthCore

A production-style authentication and authorization REST API built with Node.js, Express, PostgreSQL, JWT, and bcrypt.

AuthCore was built to practice backend development concepts including authentication, authorization, refresh-token rotation, password reset, input validation, database design, error handling, and automated API testing.

## Features

- User registration
- User login
- JWT access tokens
- Secure refresh tokens
- Refresh-token rotation
- Refresh-token revocation
- Logout
- Password reset
- Password-reset token expiration
- Password-reset token invalidation after use
- Automatic refresh-token revocation after password reset
- Current-user profile
- Update current-user profile
- Delete current-user account
- Admin-only user listing
- Admin-only user lookup
- Admin-only role management
- Admin-only user deletion
- Role-based authorization
- Request validation
- Centralized error handling
- PostgreSQL database
- Automated API tests

## Tech Stack

- Node.js
- Express.js
- PostgreSQL
- `pg`
- JWT
- bcrypt
- Supertest
- Node.js built-in test runner
- Nodemon

## Project Structure

```text
src/
├── config/
│   ├── db.js
│   └── env.js
│
├── controllers/
│   ├── adminController.js
│   ├── authController.js
│   └── userController.js
│
├── middleware/
│   ├── authMiddleware.js
│   ├── errorMiddleware.js
│   ├── roleMiddleware.js
│   └── validateId.js
│
├── routes/
│   ├── adminRoutes.js
│   ├── authRoutes.js
│   └── userRoutes.js
│
├── services/
│   ├── authService.js
│   └── userService.js
│
├── utils/
│   ├── AppError.js
│   └── validation.js
│
├── app.js
└── server.js

tests/
├── auth.test.js
└── setup.js