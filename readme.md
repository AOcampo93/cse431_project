## CSE341 Project - Appointments API

A general-purpose appointment scheduling system built with Node.js and Express, designed to manage users, services, providers, and bookings.
This flexible backend can be easily adapted to multiple industries — such as beauty salons, gyms, clinics, consulting firms, repair shops, and more.
Its modular structure allows developers to extend or customize it for any business that requires an efficient appointment or reservation system.

# Features

The API provides a complete scheduling backend with the following capabilities:

- **CRUD operations for core resources**: Users (clients, providers and admins), Services, Providers and Appointments.
- **MongoDB integration via Mongoose**: Uses Mongoose models (`/models`) to define schemas, enforce data types, required fields, enumerations and unique constraints (e.g. unique emails). Mongoose automatically adds `createdAt` and `updatedAt` timestamps.
- **Validation layer**: Each request is validated against the appropriate model. Required fields are enforced (`name`, `durationMin`, `clientId`, etc.), emails must match a basic pattern, enumerated fields restrict values (roles, appointment status) and numbers have minimum values. Invalid ObjectIds are rejected early by the `validateObjectId` middleware.
- **Global error handling**: A centralized error handler in `/middleware/error.js` captures validation errors, duplicate key errors (e.g. unique indexes), cast errors and other exceptions, returning consistent JSON responses with appropriate HTTP status codes (400 for bad requests, 404 for not found, 409 for duplicates and 500 for unexpected errors).
- **Reusable middleware**: The `/middleware` folder contains common middlewares such as `validateObjectId.js` to validate `:id` parameters on routes and ensure they are valid MongoDB ObjectIds.
- **RESTful architecture built with Express.js**: Clearly separated controllers (`/controllers`) handle business logic, routes (`/routes`) define endpoints, models encapsulate data schema and the server (`server.js`) wires everything together.
- **Full Swagger API documentation**: The API is documented via a Swagger specification served at `/api-docs` with dynamic host and scheme detection for local or Render environments.
- **Ready for OAuth (Google) and local authentication**: The structure supports future integration of authentication providers.
- **Compatible with Render deployment**: Includes CORS configuration and trust proxy settings for HTTPS on Render.
- **Modular and extensible**: The codebase is organized into clear directories (controllers, models, routes, middleware, db) making it easy to extend or customize for different business domains.

## Validation and Error Handling

The application enforces validation rules at two levels:

1. **Model-level validation** (Mongoose schemas)
   - **Users**: `authProvider` must be `google` or `credentials`; `email` is required, unique and must match a basic email regex; `role` is one of `admin`, `provider`, `client`; `name` is required.
   - **Services**: `name`, `durationMin` (minimum 1 minute) and `price` (minimum 0) are required; `isActive` defaults to `true`.
   - **Providers**: `name` and `email` are required; `email` must match an email regex and is unique; `specialties` is an array of strings; `isActive` defaults to `true`.
   - **Appointments**: `clientId`, `providerId`, `serviceId`, `startAt` and `endAt` are required ObjectIds/dates; `status` is one of `scheduled`, `confirmed`, `completed`, `cancelled` (defaults to `scheduled`). The `endAt` is automatically computed from the service’s `durationMin` if not provided.

2. **Route-level validation**
   - The `validateObjectId` middleware verifies that any `:id` parameter in the URL is a valid MongoDB ObjectId before it reaches the controller. If the ID is invalid, the request returns a 400 Bad Request.
   - Controllers perform additional checks, such as validating date formats (`startAt`, `endAt`), verifying allowed status values and computing derived fields (e.g. calculating `endAt` based on the selected service’s duration).

### Error Handling

Errors are handled uniformly across the application:

- **400 Bad Request** for validation failures (missing required fields, invalid values, invalid ObjectIds).
- **404 Not Found** when resources cannot be located by ID.
- **409 Conflict** when attempting to create or update a document with a duplicate key (e.g. unique email).
- **500 Internal Server Error** for unexpected errors.

The global error handler in `/middleware/error.js` inspects thrown errors and determines the appropriate status code and message. Controllers call `next(err)` to delegate error handling, keeping the business logic concise.

## Project Structure

```
├── controllers       # Business logic for each resource (users, services, providers, appointments)
├── db               # Database connection using Mongoose
├── middleware       # Reusable middlewares (ObjectId validation, error handling)
├── models           # Mongoose schemas for each collection
├── routes           # Express routers mapping endpoints to controllers
├── server.js        # Application entry point; sets up middleware, routes and Swagger UI
├── swagger.json     # Swagger/OpenAPI definition for the API
└── readme.md        # Project overview and documentation
```

Each controller exposes asynchronous functions (e.g. `getAll`, `getSingle`, `create`, `update`, `delete`) that correspond to HTTP endpoints defined in the routes. The modular structure facilitates future enhancements and testing.

