# Enterprise HRIS Backend

A comprehensive Human Resource Information System built with NestJS and TypeScript, designed to support organizations from small businesses to large enterprises with over 10,000 employees.

## Features

- **Multi-tenancy**: Support for multiple independent companies with complete data isolation
- **Multi-branch operations**: Manage employees across multiple physical locations
- **Multi-currency**: Process payroll in different currencies with exchange rate management
- **Dynamic RBAC**: Flexible role-based access control with company and branch scoping
- **Configurable workflows**: Customizable approval workflows for different transaction types
- **Indonesian compliance**: Built-in support for BPJS Kesehatan, BPJS Ketenagakerjaan, and PPh21 calculations
- **Comprehensive audit**: Complete audit trail for compliance and security

## Technology Stack

- **Framework**: NestJS 10.x
- **Language**: TypeScript 5.x (Strict Mode)
- **Database**: MySQL 8.0+ (To be configured in Task 1.3)
- **Cache**: Redis (To be configured later)
- **Queue**: BullMQ (To be configured later)
- **Authentication**: JWT-based authentication (To be implemented in Auth module)
- **API**: RESTful APIs with OpenAPI 3.0 documentation

## Prerequisites

- Node.js 20.x or higher
- npm 9.x or higher
- MySQL 8.0+ (for later tasks)
- Redis (for later tasks)

## Installation

1. Install dependencies:
```bash
npm install
```

2. Copy the environment configuration:
```bash
cp .env.example .env
```

3. Configure environment variables in `.env` file

## Development

### Running the application

```bash
# Development mode with hot-reload
npm run start:dev

# Production mode
npm run start:prod

# Debug mode
npm run start:debug
```

The API will be available at `http://localhost:3000/api/v1`

### Type Checking

```bash
npm run typecheck
```

### Linting

```bash
# Run ESLint
npm run lint

# Fix linting issues automatically
npm run lint -- --fix
```

### Code Formatting

```bash
# Format code with Prettier
npm run format
```

### Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov

# Watch mode
npm run test:watch
```

## Project Structure

```
src/
├── modules/              # Feature modules organized by domain
│   ├── core-hr/         # Company, Branch, Department, Position, Employee
│   ├── attendance/      # Clock in/out, shift management
│   ├── leave/           # Leave requests and policies
│   ├── overtime/        # Overtime requests
│   ├── payroll/         # Salary processing, tax calculations
│   ├── recruitment/     # Job postings, applicant tracking
│   ├── performance/     # Performance reviews
│   ├── auth/            # Authentication and authorization
│   ├── notification/    # Email and in-app notifications
│   ├── audit/           # Audit logging
│   ├── workflow/        # Approval workflows
│   └── configuration/   # System configuration
├── common/              # Shared utilities and components
│   ├── guards/          # Authorization guards
│   ├── interceptors/    # Request/response interceptors
│   ├── filters/         # Exception filters
│   ├── decorators/      # Custom decorators
│   ├── utils/           # Utility functions
│   └── constants/       # Application constants
├── database/            # Database related files
│   ├── migrations/      # Database migrations
│   └── seeders/         # Initial data seeders
├── config/              # Configuration management
├── app.module.ts        # Root application module
└── main.ts              # Application entry point
```

## Modules

### Core HR Module
Handles Company, Branch, Department, Position, and Employee management.

### Attendance Module
Handles clock in/out, shift management, and attendance corrections.

### Leave Module
Handles leave requests, leave policies, and leave balance tracking.

### Overtime Module
Handles overtime requests and calculations.

### Payroll Module
Handles salary processing, tax calculations, BPJS contributions, and payslip generation.

### Recruitment Module
Handles job postings and applicant tracking.

### Performance Module
Handles performance reviews and goal tracking.

### Auth Module
Handles authentication, authorization, and RBAC.

### Notification Module
Handles email and in-app notifications.

### Audit Module
Handles comprehensive audit logging.

### Workflow Module
Handles configurable approval workflows.

### Configuration Module
Handles system and company-specific configuration management.

## Coding Standards

### TypeScript

- **Strict Mode Enabled**: All TypeScript strict checks are enforced
- **No Explicit Any**: Avoid using `any` type unless absolutely necessary
- **Type Safety**: All functions should have explicit return types
- **Null Safety**: Properly handle null and undefined values

### Code Style

- **Single Quotes**: Use single quotes for strings
- **Trailing Commas**: Include trailing commas in multi-line structures
- **Print Width**: Maximum 100 characters per line
- **Indentation**: 2 spaces

### Git Hooks

Pre-commit hooks are configured with Husky to:
- Run ESLint on staged files
- Run Prettier formatting
- Run type checking

## API Documentation

API documentation will be available at `/api/v1/docs` (to be configured with Swagger in later tasks)

## Database

Database configuration and migrations will be set up in Task 1.3.

## Security

- Password hashing with bcrypt (cost factor 10)
- JWT-based authentication (to be implemented)
- HTTPS/TLS 1.2+ for data transmission
- SQL injection prevention through parameterized queries
- XSS prevention through output encoding
- CSRF protection through token validation

## Performance

- Sub-2-second response times for 95% of read operations
- Caching with Redis for frequently accessed data (to be configured)
- Pagination for list endpoints (max 100 records)
- Background job processing with BullMQ (to be configured)

## Contributing

1. Create a feature branch from `main`
2. Make your changes following the coding standards
3. Ensure all tests pass
4. Run linting and type checking
5. Submit a pull request

## License

UNLICENSED - Private and Proprietary
