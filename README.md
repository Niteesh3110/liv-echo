# LivEcho

The LivEcho web application improves the social lives of users by allowing them to post content, communicate with other users, and like and comment on other posts.

### Features

- Allow the users to post, edit, and remove posts and more to other users whether public or private
- Feed page with current popular posts
- Search feature for posts and users with search filters
- Friends managent to share private private posts
- Notifications
- Private messaging between friends and private group chats
- Text and Image moderation (using OpenAI Moderation)

## Deployment

The backend Express API has been deployed on Render and the frontend Vite + React app has been deployed on Versal.

### Access Deployment

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Click%20Here-green?style=for-the-badge&logo=vercel)](https://liv-echo.vercel.app/)

- Render Dashbaord: https://dashboard.render.com/
- Versal Dashbaord: https://vercel.com/livechos-projects/liv-echo

_Access the Render and Versal dashboards by logging in through Google using the livechofficial@gmail.com account._

_The Express API is deployed on Render's free tier, which will spin down deployments that have been inactive for 15mins. As a result, it may take up to 50s, after the deployed React + Vite app is accessed, for the deployed backend server to start up._

### Branches

- Master (main): https://github.com/sivaanand13/liv-echo

## Getting Started

The app has five components: the React + Vite front-end, the Express API, the MongoDB Atlas cluster, the OpenSearch server, and the Redis Cloud service.

The instructions below will describe how to set up the front and backend environment, which also involves setting the .env file for each.

### Prerequisites

The following variables will need to be set in a .env file in the /backend folder.

- PORT
- FRONTEND_URI
- MONGO_URI
- CLOUDINARY_CLOUD_NAME
- CLOUDINARY_API_KEY
- CLOUDINARY_API_SECRET
- FIREBASE_TYPE
- FIREBASE_PROJECT_ID
- FIREBASE_PRIVATE_KEY_ID
- FIREBASE_PRIVATE_KEY
- FIREBASE_CLIENT_EMAIL
- FIREBASE_CLIENT_ID
- FIREBASE_AUTH_URI
- FIREBASE_TOKEN_URI
- FIREBASE_AUTH_PROVIDER_X509_CERT_URL
- FIREBASE_CLIENT_X509_CERT_URL
- FIREBASE_UNIVERSE_DOMAIN
- OPENAI_API_KEY
- ELASTICSEARCH_CLOUD_ID
- ELASTIC_USERNAME
- ELASTIC_PASSWORD
- REDIS_USERNAME
- REDIS_PASSWORD
- REDIS_HOST
- ADMIN_ID
- ADMIN_UID

The following variables will need to be set in a .env file in the /frontend folder.

- VITE_FIREBASE_KEY
- VITE_FIREBASE_DOMAIN
- VITE_FIREBASE_PROJECT_ID
- VITE_FIREBASE_STORAGE_BUCKET
- VITE_FIREBASE_SENDER_ID
- VITE_FIREBASE_APP_ID
- VITE_BACKEND_URI
- VITE_ADMIN_ID
- VITE_ADMIN_UID

### Installation

To install the dependencies for the backend and to run it, perform:

```
$ cd backend
$ npm install
$ npm start
```

To install the dependencies for the frontend and to run it, perform:

```
$ cd frontend
$ npm install
$ npm start
```

## Seed Data

Since the app uses MoongoDB Atlas, there is no need for a seed file. The Atlas Database has already been populated with seed data.
