# My Schedule App

## Product Description
My Schedule App is a lightweight personal task tracker focused on daily planning. Users sign in with Google, create tasks for a given day, and track work intervals with a simple start/pause flow. The UI is optimized for desktop and mobile with a clean, readable layout.

## Technical Description
This project serves a static frontend and a minimal .NET API from the same origin. The backend proxies all Hygraph GraphQL requests (token never reaches the browser) and uses Google OAuth for authentication with an HttpOnly cookie. The frontend calls `/api/*` endpoints and renders tasks with client-side JavaScript.

## Tech Stack and Versions
Frontend:
- HTML5
- CSS3 (custom styles, Google Fonts: Space Grotesk, JetBrains Mono)
- Vanilla JavaScript (ES6+)

Backend:
- .NET 8.0 (SDK/Runtime)
- ASP.NET Core 8 (Minimal API)
- Microsoft.AspNetCore.Authentication.Google 8.0.7
- Hygraph GraphQL API (server-side proxy)

Infrastructure:
- Docker (optional, for Render deploy)
- Render (deployment target)

## Local Development
Prerequisites:
- .NET SDK 8.x

Set environment variables (recommended) or edit `server/appsettings.json` locally.

Environment variables:
- `Hygraph__Url`
- `Hygraph__Token`
- `Google__ClientId`
- `Google__ClientSecret`

`server/appsettings.json` structure:
```json
{
  "Hygraph": {
    "Url": "https://sa-east-1.cdn.hygraph.com/content/<project-id>/master",
    "Token": "your-hygraph-token"
  },
  "Google": {
    "ClientId": "your-google-client-id",
    "ClientSecret": "your-google-client-secret"
  },
  "Kestrel": {
    "Endpoints": {
      "Http": {
        "Url": "http://0.0.0.0:5000"
      }
    }
  }
}
```

Run the API (also serves the frontend):
```bash
dotnet run --project server
```

Open:
- `http://localhost:5000`

Google OAuth redirect URI for local dev:
- `http://localhost:5000/signin-google`
