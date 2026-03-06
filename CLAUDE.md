# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A React library (`@fullstory/react-library`) that provides components and hooks for integrating FullStory tracking in React applications using react-router.

## Build & Development Commands

- **Build**: `npm run build` - Bundles with tsup (CJS + ESM + type declarations)
- **Test**: `npm test` - Run all Vitest tests
- **Test (watch)**: `npm run test:watch` - Run Vitest in watch mode
- **Typecheck**: `npm run typecheck` - Run tsc with --noEmit
- **Clean**: `npm run clean` - Remove dist directory
- **Publish**: `npm run pub` - Build and publish to npm

### Build Output

- CJS: `dist/index.js`
- ESM: `dist/index.mjs`
- Type declarations: `dist/index.d.ts` (CJS) and `dist/index.d.mts` (ESM)
- Uses tsup with sourcemaps enabled

## Architecture

### Core Components

**FullStoryProvider** (`src/components/FullStoryProvider/FullStoryProvider.tsx`)
- Context provider that wraps react-router Routes
- Monitors location changes via `useLocation()` hook
- Automatically captures page properties based on capture rules
- Exports `useFSNavigate` hook for programmatic navigation with custom tracking

### Capture Rule System

The library implements a flexible capture rule system with 5 strategies:

- **"all"**: Captures from meta tags, schemas, and URL (default)
- **"meta"**: Extracts properties from `<meta>` tags; uses `document.title` as page name
- **"schema"**: Parses JSON-LD schemas from `<script type="application/ld+json">` tags
- **"url"**: Extracts properties from URL search params; derives page name from pathname
- **"none"**: Disables automatic capture

Rules can be set globally via `defaultCaptureRules` prop or per-route via `pageCaptureRules` object.

### Property Extraction Utilities (`src/utils/helpers.ts`)

- `getPageName()`: Determines page name based on capture rules (meta title or formatted pathname)
- `getPageProperties()`: Aggregates properties from multiple sources based on rules
- `flattenSchema()`: Recursively flattens JSON-LD schema into flat key-value pairs
- `getMetaProperties()`: Extracts all meta tag content attributes
- `getSchemaProperties()`: Parses and flattens all JSON-LD schemas on page
- `getUrlProperties()`: Converts URL search params to properties object

### FullStory Integration (`src/utils/fullstory.ts`)

- `setPage()`: Wrapper around `FullStory("setProperties", {type: "page", ...})`
- Called automatically on route changes and via `useFSNavigate`

### Navigation Flow

1. User navigates via react-router or calls `useFSNavigate(to, pageName?, properties?)`
2. `useEffect` detects location change
3. `setProperties()` extracts page name and properties based on capture rules
4. Custom `pageName` and `properties` from `useFSNavigate` take precedence
5. `setPage()` sends aggregated data to FullStory
6. Refs reset to defaults after tracking

## Dependencies

- **Peer Dependencies**: `react` (v18/v19), `react-router` (v6+), `@fullstory/browser` (v2+)
- **Build Tools**: TypeScript, tsup
- **Test Tools**: Vitest, happy-dom, @testing-library/react

## Testing

- Uses Vitest with happy-dom environment
- Tests located alongside components (e.g., `FullStoryProvider.test.tsx`)
- Run single test file: `npm test -- FullStoryProvider.test.tsx`
