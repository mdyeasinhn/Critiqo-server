# Product Review Portal Backend

A comprehensive platform for users to create accounts, share product reviews with ratings, categorize reviews, and interact with posts through voting and commenting. The application includes premium content with payment integration and admin moderation.

## Features

- **User Authentication**: Registration, login, and JWT-based session management
- **Review Management**: Create, edit, and delete product reviews with ratings
- **Categories**: Organize reviews into different product categories
- **Premium Content**: Sell premium reviews with payment processing
- **Interactive Features**: Upvoting/downvoting, commenting, and replying to comments
- **Admin Moderation**: Review approval workflow and content moderation
- **Image Uploads**: Cloudinary integration for image storage
- **Search & Filter**: Find reviews by keywords, categories, ratings, and more

## Technology Stack

### Backend
- **Node.js & Express.js**: API framework
- **PostgreSQL**: Database
- **Prisma**: ORM for database operations
- **JWT**: Authentication
- **Cloudinary**: Image storage
- **Multer**: File upload handling
- **Joi**: Request validation

## Project Setup

### Prerequisites
- Node.js (v14+)
- PostgreSQL
- Cloudinary account

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/mdyeasinhn/Critiqo-server.git
   cd Critiqo-server
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory with the following variables:
   ```
   # Database
   DATABASE_URL="postgresql://username:password@localhost:5432/product_review_portal"

   # JWT
   JWT_SECRET="your-super-secret-jwt-key"
   JWT_EXPIRES_IN="30d"

   # Cloudinary
   CLOUDINARY_CLOUD_NAME="your-cloud-name"
   CLOUDINARY_API_KEY="your-api-key"
   CLOUDINARY_API_SECRET="your-api-secret"

   # Server
   PORT=5000
   NODE_ENV=development
   ```

4. Set up the database:
   ```bash
   npx prisma generate
   npx prisma migrate dev --name init
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

## Database Schema

The application uses the following data models:

- **User**: User accounts with authentication details
- **Category**: Product categories for organizing reviews
- **Review**: Product reviews with ratings and optional premium content
- **Comment**: Comments on reviews with support for threaded replies
- **Vote**: Upvotes and downvotes on reviews
- **Payment**: Payment records for premium content purchases

## API Documentation

A Postman collection is included in the repository for testing the API endpoints:

- Import `product-review-portal-postman-collection.json` into Postman
- Set the `base_url` variable to your API server (default: `http://localhost:5000`)
- After login, set the `token` variable with the received JWT token

### Authentication

- `POST /api/user/create-guest`: Register a new user
- `POST /api/auth/login`: Login and receive JWT token
- `GET /api/auth/me`: Get current user profile

### Reviews

- `GET /api/reviews`: Get all published reviews
- `GET /api/reviews/:id`: Get a review by ID
- `POST /api/reviews`: Create a new review
- `PUT /api/reviews/:id`: Update a review
- `DELETE /api/reviews/:id`: Delete a review
- `GET /api/reviews/my-reviews`: Get current user's reviews

### Categories

- `GET /api/categories`: Get all categories
- `GET /api/categories/:id`: Get a category by ID
- `POST /api/categories`: Create a new category (admin only)
- `PUT /api/categories/:id`: Update a category (admin only)
- `DELETE /api/categories/:id`: Delete a category (admin only)

### Comments

- `GET /api/reviews/:reviewId/comments`: Get comments for a review
- `POST /api/reviews/:reviewId/comments`: Create a comment on a review
- `PUT /api/comments/:id`: Update a comment
- `DELETE /api/comments/:id`: Delete a comment

### Votes

- `GET /api/reviews/:reviewId/votes/stats`: Get vote statistics
- `GET /api/reviews/:reviewId/votes/me`: Get current user's vote
- `POST /api/reviews/:reviewId/votes`: Create or update a vote
- `DELETE /api/reviews/:reviewId/votes`: Remove a vote

### Payments

- `POST /api/payments/create-intent`: Create a payment intent
- `POST /api/payments/confirm/:paymentId`: Confirm a payment
- `GET /api/payments/history`: Get payment history
- `GET /api/payments/check/:reviewId`: Check purchase status

### Admin

- `GET /api/admin/pending-reviews`: Get reviews pending moderation
- `PUT /api/admin/reviews/:id/moderate`: Moderate a review
- `GET /api/admin/payment-analytics`: Get payment analytics

## Development

### Folder Structure

```
product-review-portal/
├── prisma/                 # Database schema and migrations
├── src/
│   ├── config/            # Configuration files
│   ├── controllers/       # Route controllers
│   ├── middlewares/       # Express middlewares
│   ├── models/            # Prisma client exports
│   ├── routes/            # API routes
│   ├── services/          # Business logic
│   ├── utils/             # Utility functions
│   └── app.js             # Express app setup
├── .env                    # Environment variables
├── package.json            # Dependencies and scripts
└── README.md               # Project documentation
```

## License

MIT⌢倠剟癥敩彷慢正湥≤ഠ�