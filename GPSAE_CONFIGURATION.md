# GPSAE Configuration Guide

## Overview

GPSAE (Sistema de Gestión de Peticiones) is the external request tracking system integrated with the CCV Dashboard. This guide explains how to configure the GPSAE base URL for your environment.

## Configuration

### Environment Variables

The GPSAE base URL is configured via the `VITE_GPSAE_BASE_URL` environment variable.

#### Setup Instructions

1. **Copy the example file:**

   ```bash
   cp .env.example .env
   ```

2. **Edit the `.env` file and set your GPSAE URL:**
   ```env
   VITE_GPSAE_BASE_URL=https://your-gpsae-instance.com/peticion
   ```

### Environment-Specific Configuration

If you need different URLs for different environments:

#### Development

Edit `.env.development`:

```env
VITE_GPSAE_BASE_URL=https://gpsae-dev.example.com/peticion
```

#### Production

Edit `.env.production`:

```env
VITE_GPSAE_BASE_URL=https://gpsae.example.com/peticion
```

### Default Fallback

If `VITE_GPSAE_BASE_URL` is not configured, the system will use:

```
https://gpsae.ejemplo.es/peticion
```

## How It Works

### Data Source

- Request codes come from the CSV files (Peticiones padre, Peticiones hijas, Tiempo dedicado)
- The request code field contains the GPSAE request number (e.g., "1234", "5678")

### Link Generation

When a request code is displayed in the dashboard:

1. The `GpsaeRequestLink` component checks if the code is valid
2. If valid, it generates a URL using: `{VITE_GPSAE_BASE_URL}/{code}`
3. The link opens in a new tab with `target="_blank"` and `rel="noopener noreferrer"`

Example:

- Base URL: `https://gpsae.example.com/peticion`
- Request Code: `1234`
- Generated URL: `https://gpsae.example.com/peticion/1234`

## Usage in Components

### GpsaeRequestLink Component

The `GpsaeRequestLink` component is used throughout the dashboard to display request codes as clickable links.

```vue
<template>
  <GpsaeRequestLink :code="requestCode" />
</template>

<script setup lang="ts">
import GpsaeRequestLink from "@/components/GpsaeRequestLink.vue";

const requestCode = "1234";
</script>
```

### Programmatic URL Generation

You can also use the utility function directly:

```typescript
import { buildGpsaeRequestUrl } from "@/domain/gpsae";

const url = buildGpsaeRequestUrl("1234");
// Returns: https://gpsae.example.com/peticion/1234
```

## Testing

To test the GPSAE links locally:

1. Start the dev server:

   ```bash
   npm run dev
   ```

2. Load CSV data with request codes
3. Click on any request code link in the tables
4. It should open the GPSAE page in a new tab

## Security Considerations

- Links open with `target="_blank"` and `rel="noopener noreferrer"` to prevent XSS attacks
- The base URL should be a valid, trusted domain
- Never hardcode sensitive URLs in the code (always use environment variables)

## Files Related to GPSAE Configuration

- `.env` - Local environment configuration (gitignored)
- `.env.development` - Development environment configuration
- `.env.production` - Production environment configuration
- `.env.example` - Example configuration file
- `src/domain/gpsae.ts` - GPSAE URL builder and utilities
- `src/components/GpsaeRequestLink.vue` - Request link component
- `src/components/dashboard/tables/UnestimatedWithIncurredPanel.vue` - Uses GPSAE links

## Troubleshooting

### Links not appearing as clickable

- Check that the CSV contains valid request codes
- Verify that `VITE_GPSAE_BASE_URL` is set correctly
- Check browser console for any errors

### Wrong URL being generated

- Verify the base URL in your `.env` file
- Ensure the URL format is correct (should end with `/peticion` or similar)
- Check that request codes are properly formatted in the CSV

### Environment variable not being used

- Make sure the `.env` file is in the project root directory
- Restart the dev server after changing `.env`
- For production builds, ensure `.env.production` is used
