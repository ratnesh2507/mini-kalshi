# Mini Kalshi

A backend implementation of a simplified **prediction market platform** inspired by Kalshi.

Mini Kalshi allows users to create binary **YES/NO prediction markets**, fund their wallet, place bets on markets created by other users, and resolve markets once the outcome is known.

The project is built with **TypeScript, Express.js, MongoDB, Mongoose, JWT, bcrypt, and Zod**, and runs using **Bun**.

---

## Features

- User registration and login
- JWT-based authentication
- Password hashing with bcrypt
- Wallet balance management
- Wallet transaction history
- Create YES/NO prediction markets
- Set market expiry and initial wager
- Browse available markets
- Place bets on existing markets
- Prevent users from betting on their own markets
- Prevent betting after market expiry
- Prevent betting on already-resolved markets
- Limit total bets to the market's available wager
- Resolve markets as `YES` or `NO`
- Automatic winner payouts
- Refund unmatched market funds
- Request validation using Zod
- MongoDB persistence using Mongoose

---

## Tech Stack

| Technology     | Purpose                                           |
| -------------- | ------------------------------------------------- |
| **TypeScript** | Type-safe backend development                     |
| **Express.js** | REST API framework                                |
| **MongoDB**    | Database                                          |
| **Mongoose**   | MongoDB ODM                                       |
| **JWT**        | Authentication                                    |
| **bcrypt**     | Password hashing                                  |
| **Zod**        | Request validation                                |
| **Bun**        | JavaScript/TypeScript runtime and package manager |
| **tsx**        | Development server with watch mode                |

The current `package.json` uses Express 5, Mongoose 9, Zod 4, bcrypt 6, jsonwebtoken 9, dotenv, and TypeScript 5.

---

## How It Works

Mini Kalshi models a simplified prediction market where a **market creator** takes one side of a YES/NO outcome and other users can bet against that position.

### Example

Suppose a user creates:

> **Will Bitcoin reach $100,000 before the end of the month?**

The creator chooses:

```text
Side: YES
Initial Wager: $100
```

Other users can place bets against the creator's position.

If the market resolves to **YES**:

- The creator wins.
- The creator receives the appropriate payout.
- The opposing bettors lose their wagers.

If the market resolves to **NO**:

- The users who bet against the creator receive `2x` their wager.
- Any unmatched portion of the creator's initial wager is refunded.

The resolution logic is implemented in the market resolution controller.

---

# Architecture

```text
Client
  │
  ▼
Express API
  │
  ├── Authentication
  │     ├── Signup
  │     ├── Signin
  │     └── JWT Middleware
  │
  ├── Wallet
  │     ├── Onramp
  │     ├── Balance
  │     └── Transactions
  │
  ├── Markets
  │     ├── Create Market
  │     ├── List Markets
  │     ├── Place Bet
  │     └── View Bets
  │
  ├── Resolution
  │     └── Resolve Market
  │
  ▼
MongoDB
```

The Express application mounts the API under three main route groups:

```text
/api/v1/auth
/api/v1/market
/api/v1/resolve
```

---

# Project Structure

```text
mini-kalshi/
│
├── src/
│   ├── controller/
│   │   ├── auth.ts
│   │   ├── market.ts
│   │   └── resolve.ts
│   │
│   ├── middleware/
│   │   └── auth.ts
│   │
│   ├── model/
│   │   ├── user.ts
│   │   ├── market.ts
│   │   ├── bet.ts
│   │   └── walletEvent.ts
│   │
│   ├── routes/
│   │   ├── auth.ts
│   │   ├── market.ts
│   │   └── resolve.ts
│   │
│   ├── types/
│   │   ├── auth.ts
│   │   ├── market.ts
│   │   └── resolve.ts
│   │
│   └── index.ts
│
├── .gitignore
├── bun.lock
├── package.json
├── tsconfig.json
└── README.md
```

The repository currently follows a straightforward **routes → controllers → models** architecture, with authentication middleware and Zod schemas separated into their own modules.

---

# Database Models

## User

Stores user credentials and wallet balance.

```text
User
├── username
├── password
└── balance
```

Usernames are unique, and passwords are stored as bcrypt hashes rather than plaintext.

---

## Market

Represents a binary prediction market.

```text
Market
├── title
├── initialWager
├── side
├── creatorId
├── expiry
└── resolution
```

`side` can be:

```text
yes
no
```

`resolution` can be:

```text
yes
no
null
```

A `null` resolution means the market is still unresolved.

---

## Bet

Stores a user's wager on a market.

```text
Bet
├── userId
├── marketId
└── betAmount
```

---

## WalletEvent

Maintains a record of wallet-related transactions.

Supported transaction types are:

```text
onramp
created
bet
payout
refund
```

---

# API Documentation

Base URL:

```text
http://localhost:3000/api/v1
```

---

## Authentication

### Sign Up

```http
POST /auth/signup
```

Request body:

```json
{
  "username": "ratnesh",
  "password": "password123"
}
```

Requirements:

- Username must contain at least 3 characters.
- Password must contain at least 6 characters.

On successful registration, the API returns the newly created user's ID.

---

### Sign In

```http
POST /auth/signin
```

Request body:

```json
{
  "username": "ratnesh",
  "password": "password123"
}
```

Response:

```json
{
  "token": "YOUR_JWT_TOKEN"
}
```

The token must be supplied to protected endpoints using:

```http
Authorization: Bearer YOUR_JWT_TOKEN
```

---

## Wallet

### Add Balance

```http
POST /auth/onramp
```

Authentication required.

Request:

```json
{
  "amount": 1000
}
```

Response:

```json
{
  "balance": 1000
}
```

The amount is added to the authenticated user's balance and an `onramp` wallet event is recorded.

---

### Get Profile

```http
GET /auth/profile
```

Authentication required.

Returns the authenticated user's profile without exposing the password.

---

### Get Transactions

```http
GET /auth/transactions
```

Authentication required.

Returns the user's wallet transaction history.

---

# Markets

## Create Market

```http
POST /market
```

Authentication required.

Request:

```json
{
  "title": "Will Bitcoin reach $100,000?",
  "initialWager": 1000,
  "side": "yes",
  "expiry": "2026-12-31T23:59:59.000Z"
}
```

Requirements:

- `title` must contain at least 3 characters.
- `initialWager` must be a positive integer.
- `side` must be either `yes` or `no`.
- Expiry must be in the future.
- Creator must have enough balance for the initial wager.

The initial wager is deducted from the creator's wallet when the market is created.

---

## Get Markets

```http
GET /market
```

Authentication not required.

Returns the available markets along with their creator information.

---

## Place a Bet

```http
POST /market/bet
```

Authentication required.

Request:

```json
{
  "marketId": "MARKET_ID",
  "amount": 100
}
```

Requirements:

- Market must exist.
- Market must not be resolved.
- Market must not have expired.
- Creator cannot bet against their own market.
- User must have sufficient balance.
- Total bets cannot exceed the market's initial wager.

---

## Get My Bets

```http
POST /market/bets
```

Authentication required.

Returns bets belonging to the authenticated user along with their associated market information.

---

# Market Resolution

## Resolve Market

```http
POST /resolve
```

Authentication required.

Request:

```json
{
  "marketId": "MARKET_ID",
  "resolution": "yes"
}
```

Only the creator of a market can resolve it.

The resolution must be:

```text
yes
```

or

```text
no
```

A market cannot be resolved more than once.

---

# Payout Logic

The project uses a simplified binary payout model.

### Creator Wins

If:

```text
market.side === resolution
```

the creator receives:

```text
(total bets × 2) + unmatched creator wager
```

The creator's payout is then recorded as a wallet event.

### Bettors Win

If the resolution differs from the creator's chosen side:

```text
bettor payout = bet amount × 2
```

Each bettor receives their payout.

Any portion of the creator's original wager that was not matched by bets is refunded.

---

# Authentication Flow

```text
              ┌───────────────┐
              │     Signup    │
              └───────┬───────┘
                      │
                      ▼
              ┌───────────────┐
              │ Password hash │
              │    bcrypt     │
              └───────┬───────┘
                      │
                      ▼
                 MongoDB User
                      │
                      │
                      ▼
              ┌───────────────┐
              │     Signin    │
              └───────┬───────┘
                      │
                      ▼
              ┌───────────────┐
              │ Verify bcrypt │
              └───────┬───────┘
                      │
                      ▼
                 Generate JWT
                      │
                      ▼
              Authorization Header
                      │
                      ▼
              authMiddleware
                      │
                      ▼
                Protected API
```

The authentication middleware extracts the Bearer token from the `Authorization` header, verifies it with `JWT_SECRET`, and attaches the authenticated user's ID to the request.

---

# Validation

Request bodies are validated with **Zod** before business logic executes.

For example, market creation validates:

```ts
{
  title: string,
  initialWager: positive integer,
  side: "yes" | "no",
  expiry: Date
}
```

Bet creation validates:

```ts
{
  marketId: string,
  amount: positive integer
}
```

---

# Getting Started

## Prerequisites

Make sure you have:

- [Bun](https://bun.sh/) installed
- MongoDB instance
- MongoDB connection string

---

## 1. Clone the repository

```bash
git clone https://github.com/ratnesh2507/mini-kalshi.git

cd mini-kalshi
```

---

## 2. Install dependencies

```bash
bun install
```

The repository uses Bun and includes a `bun.lock` lockfile.

---

## 3. Configure environment variables

Create a `.env` file in the project root:

```env
DATABASE_URL=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
PORT=3000
```

`DATABASE_URL` is required for the MongoDB connection, while `JWT_SECRET` is required for signing and verifying authentication tokens.

---

## 4. Start the development server

```bash
bun run dev
```

The project's development script uses `tsx watch` to run the TypeScript entry point.

The API will be available at:

```text
http://localhost:3000
```

---

# Example API Flow

A typical user flow looks like this:

```text
1. Sign up
       │
       ▼
2. Sign in
       │
       ▼
3. Receive JWT
       │
       ▼
4. Add funds
       │
       ▼
5. Create / browse markets
       │
       ▼
6. Place a bet
       │
       ▼
7. Market creator resolves market
       │
       ▼
8. Winners receive payout
       │
       ▼
9. Check wallet transactions
```

---

# Design Highlights

### JWT Authentication

The backend uses stateless JWT authentication rather than server-side sessions.

### Password Security

Passwords are hashed using bcrypt before being stored in MongoDB.

### Input Validation

Zod schemas keep request validation separate from controllers and reject invalid inputs before processing.

### Wallet Ledger

Instead of only maintaining a balance, wallet changes are accompanied by `WalletEvent` records such as bets, payouts, refunds, and deposits.

### Ownership Rules

Only the market creator can resolve their market, while creators are prevented from betting against their own markets.

---

# Important Note

This is a **simplified educational prediction-market backend** inspired by the core mechanics of platforms such as Kalshi.

It is not an official Kalshi implementation and does not connect to Kalshi's production trading infrastructure.

The project uses an internal wallet and simplified payout mechanism for learning purposes.

---

# Future Improvements

Potential improvements for a production-oriented version include:

- Atomic MongoDB transactions for balance updates
- Prevent race conditions during simultaneous bets
- Market status management
- Automatic market expiry
- Scheduled market resolution
- Pagination for markets and bets
- Market filtering and search
- More detailed transaction history
- Role-based authorization
- Refresh tokens
- Rate limiting
- Centralized error handling
- API documentation with Swagger/OpenAPI
- Automated tests
- Docker support
- Frontend client

---

## License

This project is intended for educational and development purposes.
