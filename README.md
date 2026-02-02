# Travel Planner

A React/Node.js travel planner application with a beautiful, modern UI.

## Features

- Day selector with visual indicators
- Daily plan display
- Quick reference buttons for lodging, activities, and food research
- Hardcoded data (ready for database integration)

## Setup

1. Install all dependencies:
```bash
npm run install-all
```

2. Start both server and client in development mode:
```bash
npm run dev
```

Or start them separately:

```bash
# Terminal 1 - Backend
npm run server

# Terminal 2 - Frontend
npm run client
```

## Project Structure

```
travel-planner/
├── server/          # Node.js/Express backend
│   ├── index.js     # Server entry point
│   └── package.json
├── client/          # React frontend
│   ├── src/
│   │   ├── App.js   # Main component
│   │   ├── App.css  # Styles
│   │   └── index.js # React entry point
│   └── package.json
└── package.json     # Root package.json with scripts
```

## API Endpoints

- `GET /api/trip` - Get all trip data
- `GET /api/trip/day/:date` - Get plan for specific day

## Future Enhancements

- Database integration (MongoDB/PostgreSQL)
- User authentication
- Trip creation and management
- Real-time updates
- Image uploads
