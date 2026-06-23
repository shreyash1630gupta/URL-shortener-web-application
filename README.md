# URL Shortener Web Application

A small full-stack URL shortener project made with:
- Node.js
- Express.js
- MongoDB
- JavaScript
- HTML/CSS

## Features
- Paste a URL and shorten it
- Store shortened links in MongoDB
- Redirect from short link to original link
- Copy short link to clipboard
- View link history
- Responsive UI for mobile and desktop

## Folder structure
```text
url-shortener-project/
├── server.js
├── models/Url.js
├── public/
│   ├── index.html
│   ├── style.css
│   └── script.js
├── package.json
├── package-lock.json
└── .env
```

## Requirements
- Node.js installed
- MongoDB running locally, or MongoDB Atlas connection string

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file in the root folder and add:
```env
PORT=5000
BASE_URL=http://localhost:5000
MONGO_URI=mongodb://127.0.0.1:27017/url_shortener
```

3. Start MongoDB:
- Local MongoDB: make sure the service is running
- Atlas: replace `MONGO_URI` with your Atlas connection string

4. Run the project:
```bash
npm start
```

5. Open in browser:
```text
http://localhost:5000
```

## How it works
- Frontend sends the long URL to `/api/shorten`
- Backend validates the URL
- A random short code is generated
- The URL is stored in MongoDB
- Opening `http://localhost:5000/<shortCode>` redirects to the original URL
- `/api/history` returns the latest links

