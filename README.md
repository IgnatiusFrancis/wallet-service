# Wallet Service

A Domain-Driven Design (DDD) based wallet system built with NestJS, supporting wallet creation, funding, and secure fund transfers with strong domain rules, idempotency, and comprehensive test coverage.

## Overview

This project implements a cleanly architected wallet service that models core financial concepts such as Wallets, Money, and Transactions using Domain-Driven Design principles.

The system focuses on:

- Correctness of financial operations
- Strong domain invariants
- Testability and maintainability
- Production-readiness (idempotency, locking, scalability awareness)

## Table of Contents

- [Key Features](#key-features)
- [Architecture Overview](#architecture-overview)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)
  - [Starting the Server](#starting-the-server)
  - [API Endpoints](#api-endpoints)
- [Testing](#testing)
  - [Unit Tests](#unit-tests)
  - [Coverage](#coverage)
- [CI/CD](#cicd)
- [Development Challenges](#development-challenges)
- [Scaling in Production](#scaling-in-production)
- [What I Would Improve With More Time](#what-i-would-improve-with-more-time)
- [Contributing](#contributing)
- [Contact](#contact)

## Key Features

- Wallet creation with currency support
- Wallet funding (credit operations)
- Secure wallet-to-wallet fund transfers
- Strong domain rules:
  - Insufficient funds protection
  - Currency mismatch prevention
  - Invalid amount validation
- Idempotent transfer support
- Transaction history tracking
- Clean Domain-Driven Design architecture
- Comprehensive unit test coverage
- CI pipeline running tests on every push or pull request

## Architecture Overview

The system follows Domain-Driven Design (DDD) with clear separation of concerns:

### Layers

- **Domain Layer**
  - Core business logic
  - Entities (Wallet, Transaction)
  - Value Objects (Money, WalletId)
  - Domain Exceptions
- **Application Layer**
  - Use cases (CreateWallet, FundWallet, TransferFunds, GetWallet)
  - Orchestrates domain logic
  - No framework or infrastructure dependencies
- **Infrastructure Layer**
  - HTTP controllers
  - Persistence repositories
  - Framework-specific implementations

This ensures the business logic is framework-agnostic, highly testable, and easy to evolve.

## Project Structure

src/
├── application/
│ └── use-cases/
├── domain/
│ ├── entities/
│ ├── value-objects/
│ └── exceptions/
├── infrastructure/
│ ├── http/
│ └── persistence/
├── app.module.ts
└── main.ts

test/
└── unit/

## Prerequisites

- Node.js (v18 or higher recommended)
- npm
- Basic understanding of NestJS and TypeScript

## Installation

1. Clone the repository:

```bash
git clone https://github.com/IgnatiusFrancis/wallet-service.git
cd wallet-service

Install dependencies:
npm install

Configuration
Create a .env file in the root directory if needed (optional for local testing):
PORT=3000
NODE_ENV=development

Usage
Starting the Server
# Development mode
npm run start:dev

# Production mode
npm run build
npm run start:prod

API Endpoints
Method	Endpoint	Description
POST	/wallets	Create a new wallet
POST	/wallets/fund	Fund a wallet
POST	/wallets/transfer	Transfer funds between wallets
GET	/wallets/:id	Get wallet details

Testing
The project includes extensive unit test coverage, focusing on domain logic and use cases, which are the most critical parts of a financial system.

Unit Tests
Run all tests:
npm test
Run tests with coverage:

bash
npm run test:cov

Coverage Highlights
Domain layer: ~100% coverage

Use cases: High functional and branch coverage

Controllers and infrastructure intentionally excluded from deep unit coverage

This aligns with best practices: test business logic heavily, not frameworks.

CI/CD
A GitHub Actions pipeline is included to ensure code quality.

CI Pipeline Features
Runs on every push and pull_request

Installs dependencies

Runs all tests

Fails the build if any test fails

Development Challenges
1. Jest & UUID (ESM vs CommonJS)
The uuid package ships as ESM

Jest required additional configuration to handle module transformation

Solved by configuring ts-jest and proper Jest transforms

2. Deterministic Testing
UUID generation caused flaky tests

Solved by mocking UUIDs in test environments

3. Domain Exception Consistency
Ensuring domain rules throw explicit domain exceptions

Improved clarity and testability of failure cases

4. Idempotent Transfers
Handling retries safely without duplicate debits

Implemented idempotency key checks at the use-case level

Scaling in Production
If deployed to production, the system would scale as follows:

Horizontal Scalability
Stateless application instances

Can be scaled behind a load balancer

Database
Use transactional database (PostgreSQL/MySQL)

Wallet row-level locking for transfers

Proper indexing on wallet IDs and transaction timestamps

Concurrency Safety
findMultipleByIdsWithLock ensures consistent balance updates

Prevents race conditions during concurrent transfers

Idempotency
Protects against duplicate requests (network retries, client errors)

Future Enhancements
Redis for idempotency keys and caching

Event-driven architecture for transaction notifications

Async processing for audit logs and analytics

What I Would Improve With More Time
Add integration and e2e tests with a real database

Introduce database migrations

Implement pagination for transaction history

Add authentication and authorization

Add observability (logging, metrics, tracing)

Dockerize the application for easier deployment

Introduce CQRS for read-heavy workloads

Contributing
Contributions are welcome:

Fork the repository

Create a feature branch

Commit your changes

Open a pull request

Contact
Ignatius Francis
📧 Email: obiignatiusfrancis@outlook.com
🐙 GitHub: https://github.com/IgnatiusFrancis

```

## Nice-to-Have Features (Planned)

1.  Docker Integration:
    . Containerization for easy deployment
    . Docker Compose for service orchestration
    . Scaling Solutions

2.  Redis implementation for caching
    . Bull Queueimplementation for automated email sending to customers
    . Horizontal scaling capabilities

<!-- ## Development Challenges

1.  Time Management:
    . Met tight deadlines during festive period
    . Balanced feature implementation with testing requirements

2.  Technical Challenges:
    . Implementing real-time WebSocket communication
    . Ensuring proper state management across the system
    . Maintaining test coverage while adding features -->

## Contributing

To contribute to this project, please follow these guidelines:

- Fork the repository.
- Create a feature branch (git checkout -b feature/your-feature).
- Commit your changes (git commit -m 'Add new feature').
- Push to the branch (git push origin feature/your-feature).
- Open a pull request.

## Contact

For any inquiries, please reach out to:

- **Name: Ignatius Francis**
- **Email: obiignatiusfrancis@outlook.com**
- **GitHub: IgnatiusFrancis**

```

```
