# Serper Package Documentation

## Overview

The `@tokenring-ai/serper` package provides an integration with the Serper.dev API for performing Google web searches and news searches within the Token Ring AI framework. It extends the `WebSearchProvider` from `@tokenring-ai/websearch` to enable seamless web search capabilities, including organic search results, knowledge graphs, related searches, and news articles. This package handles API requests to Serper.dev, which acts as a proxy for Google Search and News, parsing responses into structured formats. It supports features like location-based searches (via `gl` and `location`), language settings (`hl`), pagination, and autocorrection.

The primary purpose is to allow Token Ring agents or applications to query the web for real-time information without directly interfacing with Google, reducing complexity and potential blocking issues. It includes retry logic via `doFetchWithRetry` from `@tokenring-ai/utility` and error handling for common API issues like rate limits or invalid keys.

## Installation/Setup

This package is designed as part of the Token Ring monorepo. To use it:

1. Ensure you have Node.js (v18+) and npm/yarn installed.
2. Install dependencies in the root project:
   ```
   npm install
   ```
   or
   ```
   yarn install
   ```
3. Obtain a Serper.dev API key from [serper.dev](https://serper.dev) and set it as an environment variable `SERPER_API_KEY` or pass it directly to the provider.
4. Import and instantiate the provider in your code (see Usage Examples).

No separate build step is required for development; it uses ES modules (`type: "module"`). For testing, run `npm test` (uses Vitest).

## Package Structure

The package is located in `pkg/serper/` and contains:

- `index.ts`: Entry point exporting the main `SerperWebSearchResource` (default export from `SerperWebSearchProvider.ts`) and package metadata from `package.json`.
- `SerperWebSearchProvider.ts`: Core implementation extending `WebSearchProvider`, handling search requests, news queries, and page fetching.
- `package.json`: Defines package metadata, dependencies, and exports.
- `README.md`: This documentation file.
- `LICENSE`: MIT license.
- `design/`: Directory with example files:
  - `google_search_request_example.js`: Sample search request payload.
  - `google_news_request_example.js`: Sample news request payload.
  - `implementation.md`: Notes on implementation details.
  - `google_search_result_example.json`: Example search response.
  - `google_news_response_example.json`: Example news response.

No additional subdirectories or configs beyond these.

## Core Components

### SerperWebSearchProvider Class

This is the main class, extending `WebSearchProvider` from `@tokenring-ai/websearch`. It manages interactions with the Serper.dev API.

- **Constructor**: Initializes with `SerperWebSearchProviderOptions`.
  - Parameters:
    - `config.apiKey`: Required string (Serper.dev API key).
    - `config.defaults?`: Optional `SerperDefaults` for global settings like `gl` (country code), `hl` (language), `location`, `num` (results per page), `page`.
  - Throws an error if `apiKey` is missing.

- **searchWeb(query: string, options?: WebSearchProviderOptions): Promise<WebSearchResult>**
  - Performs a Google web search.
  - Maps `options` (e.g., `countryCode` to `gl`, `language` to `hl`) to Serper parameters.
  - Returns `{ results: WebSearchResult[] }` where results are derived from `SerperSearchResponse` (organic results, knowledge graph, etc.).
  - Internally calls `googleSearch` which builds a `SerperSearchRequest` and POSTs to `https://google.serper.dev/search`.

- **searchNews(query: string, options?: WebSearchProviderOptions): Promise<WebSearchResult>**
  - Performs a Google News search.
  - Similar mapping as `searchWeb`.
  - Returns `{ results: WebSearchResult[] }` based on `SerperNewsResponse` (news articles with title, link, snippet, date, source).
  - Internally calls `googleNews` POSTing to `https://google.serper.dev/news`.

- **fetchPage(url: string, options?: WebPageOptions): Promise<WebPageResult>**
  - Fetches the HTML content of a webpage using native `fetch` with optional timeout and AbortController.
  - Returns `{ html: string }`.
  - Throws errors for fetch failures.

- **Private Methods**:
  - `buildPayload(query: string, opts?: Record<string, unknown>): Record<string, unknown>`: Constructs the API request body, merging defaults, options, and cleaning undefined/null values. Requires `q` (query); throws 400 error if missing.
  - `googleSearch` and `googleNews`: Handle API calls with `doFetchWithRetry`, including headers (`X-API-KEY`, `Content-Type: application/json`).
  - `parseJsonOrThrow(res: Response, context: string): Promise<T>`: Parses JSON response; throws enhanced errors with status, hints (e.g., for 401/429), and details.

Key interactions: Public methods delegate to private API callers, which use shared payload building and parsing. Results conform to `WebSearchProvider` interfaces for compatibility with Token Ring's websearch module. Error handling includes retries (via utility) and context-specific messages.

### Types

The package defines TypeScript types for requests/responses:
- `SerperSearchRequest`/`SerperNewsRequest`: Input payloads (e.g., `q`, `gl`, `num`, `type`).
- `SerperSearchResponse`/`SerperNewsResponse`: Output structures (e.g., `organic: SerperOrganicResult[]`, `news: SerperNewsResult[]`).
- Sub-types like `SerperOrganicResult` (title, link, snippet, position), `SerperKnowledgeGraph`, `SerperNewsResult`.
- Options: `SerperWebSearchProviderOptions`, `SerperSearchOptions` (extends defaults with `autocorrect`, `extraParams`).

These ensure type safety and match Serper.dev's API schema.

## Usage Examples

### Basic Web Search

```typescript
import SerperWebSearchProvider from '@tokenring-ai/serper';

const provider = new SerperWebSearchProvider({
  apiKey: process.env.SERPER_API_KEY!,
  defaults: { gl: 'us', hl: 'en', num: 10 }
});

const results = await provider.searchWeb('Token Ring AI');
console.log(results.results); // Array of WebSearchResult objects
```

### News Search with Options

```typescript
const newsResults = await provider.searchNews('Latest AI news', {
  countryCode: 'us',
  num: 5,
  page: 1
});
console.log(newsResults.results); // News articles
```

### Fetch a Webpage

```typescript
const page = await provider.fetchPage('https://example.com', { timeout: 5000 });
console.log(page.html); // Raw HTML string
```

Integrate with Token Ring agents by registering the provider in agent configurations for tool usage.

## Configuration Options

- **API Key**: Required; set via `config.apiKey` or environment variable (checked in error hints).
- **Defaults (`SerperDefaults`)**: Optional global overrides for `gl` (e.g., 'us', 'uk'), `hl` (e.g., 'en', 'fr'), `location` (e.g., 'Austin,Texas,United States'), `num` (1-100, default 10), `page` (starting from 1).
- **Per-Request Options**:
  - Inherit from `WebSearchProviderOptions`: `countryCode`, `language`, `location`, `num`, `page`.
  - `SerperSearchOptions`/`SerperNewsOptions`: Add `autocorrect` (boolean), `type` ('search'/'news'), `extraParams` (Record for custom Serper params).
- Environment: Use `SERPER_API_KEY` for security.

No additional configs; all via constructor/options.

## API Reference

- **Class: `SerperWebSearchProvider`**
  - `constructor(config: SerperWebSearchProviderOptions)`
  - `searchWeb(query: string, options?: WebSearchProviderOptions): Promise<WebSearchResult>`
  - `searchNews(query: string, options?: WebSearchProviderOptions): Promise<WebSearchResult>`
  - `fetchPage(url: string, options?: WebPageOptions): Promise<WebPageResult>`

- **Exported from index.ts**: `SerperWebSearchResource` (alias for the class), `packageInfo: TokenRingPackage`.

- **Types**: As detailed in Core Components (e.g., `SerperSearchResponse`).

Public APIs are minimal, focusing on the three main methods for compatibility with `WebSearchProvider`.

## Dependencies

- `@tokenring-ai/ai-client@0.1.0`
- `@tokenring-ai/agent@0.1.0`
- `@tokenring-ai/websearch@0.1.0`
- `zod@^4.0.17` (for schema validation, though not directly used in core code)

Dev dependencies: `vitest@^3.2.4`, `@vitest/coverage-v8@^3.2.4`.

## Contributing/Notes

- **Testing**: Run `npm test` for unit tests (coverage via V8). Focus on API integration tests.
- **Building**: Uses ES modules; no build step needed. For production, bundle via your app's build tool.
- **Limitations**: Relies on Serper.dev quotas (check credits in news responses). Rate limits (429 errors) suggest exponential backoff via retries. Binary fetches not supported; text/HTML only. No image/video search. Examples in `design/` provide raw API payloads/responses for reference.
- **License**: MIT (see LICENSE).
- Contributions: Fork, PR with tests. Ensure type safety and error handling.

This documentation is based on code analysis of version 0.1.0.