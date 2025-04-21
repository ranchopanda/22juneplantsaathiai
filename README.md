# Anand Krishi - Plant Disease Detection

A comprehensive plant disease detection application that uses Gemini AI to provide accurate analysis and recommendations.

## Features

- Plant disease detection using Gemini AI
- Soil analysis
- Yield prediction
- Weather information
- Crop information

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/anand-krishi.git
cd anand-krishi
```

2. Install dependencies
```bash
npm install
# or
yarn install
```

3. Set up environment variables
Create a `.env` file in the root directory with the following variables:

```
# Gemini AI API Key
# Get a valid API key from: https://ai.google.dev/tutorials/web_quickstart
VITE_GEMINI_API_KEY=your_gemini_api_key_here
```

### Running the Application

```bash
npm run dev
# or
yarn dev
```

The application will be available at http://localhost:8080

## API Keys Setup

### Gemini AI API Key

1. Go to [Google AI Studio](https://ai.google.dev/tutorials/web_quickstart)
2. Create an account or sign in
3. Create a new API key
4. Copy the API key and paste it in your `.env` file

## Troubleshooting

### API Key Issues

If you're seeing API key errors, make sure:
1. You have a valid Gemini API key in your `.env` file
2. The API key is correctly formatted
3. You have sufficient credits/quota for the Gemini API service

### Geolocation Issues

If you're having issues with geolocation:
1. Make sure your browser has permission to access your location
2. Check if your device's location services are enabled
3. Try using a different browser

## License

This project is licensed under the MIT License - see the LICENSE file for details.
