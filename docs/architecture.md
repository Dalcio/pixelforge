# FluxImage Architecture

## Overview

FluxImage is a production-ready, real-time image processing system built with a **monorepo architecture** following strict **Single Responsibility Principle (SRP)** throughout every layer.

## Architecture Diagram

```
┌─────────────┐
│   Web App   │ (React + Vite)
│  (Firestore │
│  Realtime)  │
└──────┬──────┘
       │
       │ HTTP
       ↓
┌─────────────┐
│   API       │ (Express)
│  Service    │
└──────┬──────┘
       │
       │ BullMQ
       ↓
┌─────────────┐      ┌──────────────┐
│   Redis     │◄────►│   Worker     │
│   Queue     │      │   Service    │
└─────────────┘      └──────┬───────┘
                            │
                            ↓
                     ┌──────────────┐
                     │  Firebase    │
                     │  (Firestore  │
                     │  + Storage)  │
                     └──────────────┘
```

## Core Principles

### 1. Single Responsibility Principle (SRP)

Every module, file, function, and component has **one clear responsibility**:

- **Controllers**: Handle HTTP request/response only
- **Services**: Contain business logic only
- **Validators**: Schema validation only
- **Tasks**: Single-step operations only
- **Hooks**: Logic extraction only
- **Components**: UI presentation only

### 2. Separation of Concerns

```
API Layer
├── Controllers → HTTP interface
├── Services → Business logic
├── Validators → Input validation
├── Lib → External integrations
└── Middlewares → Cross-cutting concerns

Worker Layer
├── Processors → Job orchestration
├── Tasks → Atomic operations
├── Queue → Queue management
└── Lib → External integrations

Web Layer
├── Components → UI presentation
├── Hooks → State & logic
├── Lib → External clients
└── Pages → Route composition
```

### 3. Monorepo Benefits

- **Shared packages**: Types, utils, config reused across apps
- **Atomic changes**: Update shared code once, affects all apps
- **Unified tooling**: Single build system, linting, testing
- **Workspace protocol**: pnpm efficiently manages dependencies

## Data Flow

### Job Creation Flow

```
1. User submits URL (Web)
2. API validates URL reachability
3. API creates Firestore document
4. API enqueues job to Redis (BullMQ)
5. API returns job ID to user
6. Web subscribes to Firestore for real-time updates
```

### Job Processing Flow

```
1. Worker picks job from queue
2. Update status to "processing"
3. Download image from URL
4. Validate image format
5. Process with Sharp (resize, optimize)
6. Upload to Firebase Storage
7. Update Firestore with output URL
8. Mark job as "completed"
9. Web receives real-time update via Firestore
```

## Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **API** | Express + TypeScript | REST endpoints |
| **Worker** | BullMQ + Redis | Job processing queue |
| **Web** | React + Vite | Real-time UI |
| **Database** | Firestore | Real-time job state |
| **Storage** | Firebase Storage | Processed images |
| **Queue** | Redis | Job queue persistence |
| **Image Processing** | Sharp | Fast image manipulation |
| **Monorepo** | pnpm workspaces | Dependency management |

## Scalability Features

1. **Horizontal Scaling**: Add more worker instances
2. **Concurrency Control**: 5 concurrent jobs per worker
3. **Retry Logic**: 3 retries with exponential backoff
4. **Real-time Updates**: No polling, Firestore push updates
5. **Queue Persistence**: Redis ensures jobs survive crashes

## Error Handling

- **API**: Centralized error handler middleware
- **Worker**: Automatic retries + failure state tracking
- **Validation**: Schema validation before processing
- **URL Checking**: HEAD request to verify reachability

## Security Considerations

- Environment variables for all secrets
- Firebase admin SDK for backend only
- CORS configuration for web access
- Input validation on all endpoints
- No client-side secrets exposure
