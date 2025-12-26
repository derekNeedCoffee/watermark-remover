# Watermark Remover

AI-powered watermark and overlay removal app for iOS.

## Project Structure

```
watermark-remover/
├── backend/          # Node.js Express backend
│   └── src/
│       ├── index.js      # Server entry
│       ├── db.js         # SQLite database
│       ├── config.js     # Configuration
│       ├── routes/       # API routes
│       └── services/     # Business logic
└── mobile/           # Expo React Native app
    ├── app/          # Expo Router pages
    └── src/
        ├── components/
        ├── constants/
        ├── hooks/
        └── services/
```

## Backend Setup

### Prerequisites
- Node.js 18+

### Installation

```bash
cd backend

# Install dependencies
npm install

# Copy environment file and configure
cp .env.example .env
# Edit .env with your API credentials

# Run the server (development)
npm run dev

# Run the server (production)
npm start
```

### Environment Variables

```
PORT=8000
DATABASE_PATH=./watermark.db
DOUBAO_API_KEY=your_doubao_api_key
DOUBAO_MODEL_ENDPOINT=ep-xxx
APPLE_SHARED_SECRET=your_apple_shared_secret
```

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/v1/entitlements?installId=xxx` | Get user entitlements |
| POST | `/v1/edit` | Edit image (remove watermark) |
| POST | `/v1/iap/verify` | Verify IAP receipt |
| GET | `/health` | Health check |

## Mobile Setup

### Prerequisites
- Node.js 18+
- Expo CLI
- Xcode (for iOS development)

### Installation

```bash
cd mobile

# Install dependencies
npm install

# Start development server
npm start

# Run on iOS simulator
npm run ios
```

### Environment Variables

Create `.env` file in the mobile directory:

```
EXPO_PUBLIC_API_URL=http://localhost:8000
```

### Building for Production

```bash
# Install EAS CLI
npm install -g eas-cli

# Configure EAS
eas build:configure

# Build for iOS
eas build --platform ios
```

## Features

- **BBox Selection**: Draw a rectangle around the area to remove
- **AI Processing**: Uses Doubao image editing model
- **One-time IAP**: Unlock Pro with a single purchase
- **Free Trial**: 1 free use before purchase required

## Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   iOS App       │────▶│   FastAPI       │────▶│   Doubao API    │
│   (Expo)        │     │   Backend       │     │   (Image Edit)  │
└─────────────────┘     └────────┬────────┘     └─────────────────┘
                                 │
                                 ▼
                        ┌─────────────────┐
                        │   PostgreSQL    │
                        │   (Aliyun RDS)  │
                        └─────────────────┘
```

## License

MIT

