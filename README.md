# @tokenring-ai/serper

## Overview

Serper.dev integration package for the Token Ring AI framework, providing Google Search and News capabilities through the Serper API proxy. This package extends the `@tokenring-ai/websearch` module to enable seamless integration with Token Ring agents and applications for real-time web searches, news articles, and web page content extraction.

## Features

- **Google Search Integration**: Perform organic web searches with knowledge graphs, related searches, and "people also ask" results
- **Google News Search**: Access real-time news articles with source, date, and snippet information
- **Web Page Fetching**: Extract markdown content and metadata from web pages using Serper's scraping service
- **Location-Based Search**: Support for geographic targeting through `gl` and `location` parameters
- **Language Support**: Multi-language search capabilities through `hl` parameter
- **Plugin Architecture**: Automatic registration with Token Ring applications
- **Retry Logic**: Built-in retry mechanism with exponential backoff via `doFetchWithRetry`
- **Type Safety**: Full TypeScript support with Zod schema validation
- **Comprehensive Error Handling**: Detailed error messages with hints for common issues

## Installation

```bash
bun install @tokenring-ai/serper
```

## Chat Commands

This package does not include chat commands. Searches should be performed through the websearch service provided by `@tokenring-ai/websearch`.

## Plugin Configuration

This package provides a Token Ring plugin that automatically registers the Serper provider with the websearch service.

### Configuration Schema

```typescript
import {z} from 'zod';

export const SerperPluginConfigSchema = z.object({
  websearch: z.object({
    providers: z.record(z.object({
      type: z.literal('serper'),
      apiKey: z.string(),
      defaults: SerperDefaultsSchema.optional(),
    })),
  }).optional(),
});

export const SerperDefaultsSchema = z.object({
  gl: z.string().optional(),
  hl: z.string().optional(),
  location: z.string().optional(),
  num: z.number().optional(),
  page: z.number().optional(),
});

export const SerperWebSearchProviderOptionsSchema = z.object({
  apiKey: z.string(),
  defaults: SerperDefaultsSchema.optional(),
});
```

### Configuration Example

```typescript
import TokenRingApp from '@tokenring-ai/app';

const app = new TokenRingApp({
  websearch: {
    providers: {
      serper: {
        type: 'serper',
        apiKey: process.env.SERPER_API_KEY!,
        defaults: {
          gl: 'us',
          hl: 'en',
          num: 10
        }
      }
    }
  }
});
```

## Services

### SerperWebSearchProvider

The main provider class that extends `WebSearchProvider` from `@tokenring-ai/websearch`.

#### Constructor

```typescript
constructor(config: SerperWebSearchProviderOptions)
```

**Parameters:**
- `apiKey` (required): Your Serper.dev API key
- `defaults` (optional): Default search parameters

#### Methods

##### searchWeb

```typescript
async searchWeb(query: string, options?: WebSearchProviderOptions): Promise<WebSearchResult>
```

Performs a Google web search and returns organic results, knowledge graphs, and related searches.

**Parameters:**
- `query` (required): Search query string
- `options` (optional): Search options including `countryCode`, `language`, `location`, `num`, `page`

**Returns:** `Promise<WebSearchResult>` containing organic results, knowledge graph, people also ask questions, and related searches

**Example:**

```typescript
const results = await provider.searchWeb('Token Ring AI framework');
console.log(results.organic); // Array of organic search results
console.log(results.knowledgeGraph); // Knowledge graph if available
console.log(results.peopleAlsoAsk); // Array of related questions if available
console.log(results.relatedSearches); // Array of related search queries if available
```

##### searchNews

```typescript
async searchNews(query: string, options?: WebSearchProviderOptions): Promise<NewsSearchResult>
```

Performs a Google News search and returns recent news articles.

**Parameters:**
- `query` (required): News search query string
- `options` (optional): Search options including `countryCode`, `language`, `location`, `num`, `page`

**Returns:** `Promise<NewsSearchResult>` containing array of news articles

**Note:** The news search includes a hardcoded date filter for the last hour (`tbs: "qdr:h"`). Future versions may make this parameter configurable.

**Example:**

```typescript
const news = await provider.searchNews('artificial intelligence breakthroughs', {
  countryCode: 'us',
  num: 5,
  page: 1
});

news.news.forEach(article => {
  console.log(`Title: ${article.title}`);
  console.log(`Source: ${article.source}`);
  console.log(`Date: ${article.date}`);
  console.log(`Snippet: ${article.snippet}`);
  console.log(`Link: ${article.link}`);
});
```

##### fetchPage

```typescript
async fetchPage(url: string, options?: WebPageOptions): Promise<WebPageResult>
```

Fetches and extracts content from a web page using Serper's scraping service.

**Parameters:**
- `url` (required): URL of the webpage to fetch
- `options` (optional): Fetch options including `timeout` (in milliseconds)

**Endpoint:** `POST https://scrape.serper.dev`

**Returns:** `Promise<WebPageResult>` containing markdown content and metadata

**Example:**

```typescript
const page = await provider.fetchPage('https://example.com', {
  timeout: 10000
});

console.log(page.markdown); // Extracted markdown content
console.log(page.metadata); // Page metadata including title, description, OpenGraph properties
```

## Providers

This package does not define providers. The `SerperWebSearchProvider` is a provider implementation that registers with the websearch service.

## RPC Endpoints

This package does not define RPC endpoints.

## State Management

This package does not implement state management.

## Type Definitions

### SerperSearchRequest

Request payload structure for Google search

```typescript
{
  q: string;
  gl?: string;
  hl?: string;
  location?: string;
  num?: number;
  page?: number;
  autocorrect?: boolean;
  type?: "search";
}
```

### SerperNewsRequest

Request payload structure for Google News search

```typescript
{
  q: string;
  gl?: string;
  location?: string;
  num?: number;
  page?: number;
  type?: "news";
}
```

### SerperSearchResponse

Response structure for Google search

```typescript
{
  searchParameters: SerperSearchParameters;
  knowledgeGraph?: SerperKnowledgeGraph;
  organic: SerperOrganicResult[];
  peopleAlsoAsk?: SerperPeopleAlsoAsk[];
  relatedSearches?: SerperRelatedSearch[];
}
```

### SerperKnowledgeGraph

```typescript
{
  title: string;
  type: string;
  website?: string;
  imageUrl?: string;
  description?: string;
  descriptionSource?: string;
  descriptionLink?: string;
  attributes?: Record<string, string>;
}
```

### SerperSitelink

```typescript
{
  title: string;
  link: string;
}
```

### SerperOrganicResult

```typescript
{
  title: string;
  link: string;
  snippet: string;
  date?: string;
  position: number;
  attributes?: Record<string, string>;
  sitelinks?: SerperSitelink[];
}
```

### SerperPeopleAlsoAsk

```typescript
{
  question: string;
  snippet: string;
  title: string;
  link: string;
}
```

### SerperRelatedSearch

```typescript
{
  query: string;
}
```

### SerperNewsResult

```typescript
{
  title: string;
  link: string;
  snippet: string;
  date: string;
  source: string;
  position: number;
}
```

### SerperPageResponse

Response structure for page fetch

```typescript
{
  text: string;
  markdown: string;
  metadata: {
    title?: string;
    description?: string;
    "og:title"?: string;
    "og:description"?: string;
    "og:url"?: string;
    "og:image"?: string;
    "og:type"?: string;
    "og:site_name"?: string;
    [key: string]: any;
  };
  credits?: number;
}
```

### SerperNewsResponse

Response structure for news search

```typescript
{
  searchParameters: SerperSearchParameters;
  news: SerperNewsResult[];
  credits?: number;
}
```

## Usage Examples

### Basic Web Search

```typescript
import SerperWebSearchProvider from '@tokenring-ai/serper';

const provider = new SerperWebSearchProvider({
  apiKey: process.env.SERPER_API_KEY!,
  defaults: {
    gl: 'us',
    hl: 'en',
    num: 10
  }
});

// Perform a web search
const results = await provider.searchWeb('Token Ring AI framework');
console.log('Organic results:', results.organic.length);

// Access different result types
if (results.knowledgeGraph) {
  console.log('Knowledge Graph:', results.knowledgeGraph.title);
}

if (results.peopleAlsoAsk) {
  console.log('People also ask:', results.peopleAlsoAsk.length);
}

if (results.relatedSearches) {
  console.log('Related searches:', results.relatedSearches.map(r => r.query));
}
```

### News Search

```typescript
// Search for recent news
const news = await provider.searchNews('artificial intelligence breakthroughs', {
  countryCode: 'us',
  num: 5,
  page: 1
});

news.news.forEach(article => {
  console.log(`Title: ${article.title}`);
  console.log(`Source: ${article.source}`);
  console.log(`Date: ${article.date}`);
  console.log(`Snippet: ${article.snippet}`);
  console.log(`Link: ${article.link}`);
});
```

### Web Page Fetching

```typescript
// Fetch and extract content from a webpage
const page = await provider.fetchPage('https://tokenring.ai', {
  timeout: 10000
});

console.log('Page title:', page.metadata.title);
console.log('Description:', page.metadata.description);
console.log('Markdown content:', page.markdown.substring(0, 200) + '...');
```

### Integration with Token Ring Agents

```typescript
import TokenRingApp from '@tokenring-ai/app';

const app = new TokenRingApp({
  websearch: {
    providers: {
      serper: {
        type: 'serper',
        apiKey: process.env.SERPER_API_KEY!,
        defaults: {
          gl: 'us',
          hl: 'en'
        }
      }
    }
  }
});

// Access the provider through the websearch service
const websearchService = app.requireService(WebSearchService);
const results = await websearchService.search('your query', 'serper');
```

## Error Handling

The package provides comprehensive error handling with helpful hints:

```typescript
try {
  const results = await provider.searchWeb('query');
} catch (error) {
  if (error instanceof Error) {
    if (error.status === 401) {
      console.log('Invalid API key - check SERPER_API_KEY');
    } else if (error.status === 429) {
      console.log('Rate limit exceeded - reduce request frequency');
    } else {
      console.log('Search failed:', error.message);
      if (error.hint) {
        console.log('Hint:', error.hint);
      }
      if (error.details) {
        console.log('Details:', error.details.slice(0, 500));
      }
    }
  }
}
```

### Error Object Structure

Error responses include:
- `status`: HTTP status code (400, 401, 429, etc.)
- `message`: Human-readable error message
- `hint`: Suggestion for resolving the error (optional)
- `details`: Raw response snippet (optional)

Common error responses:
- **401**: Invalid API key - check SERPER_API_KEY
- **429**: Rate limit exceeded - reduce request frequency
- **400**: Invalid request parameters (missing required fields)

## Development

### Testing

```bash
bun run test
bun run test:coverage
```

### Project Structure

```
pkg/serper/
├── SerperWebSearchProvider.ts    # Core provider implementation
├── plugin.ts                     # Token Ring plugin registration
├── index.ts                      # Package exports
├── package.json                  # Package metadata
├── LICENSE                       # MIT License
├── vitest.config.ts              # Test configuration
└── design/                       # Design documentation and examples
    ├── google_search_request_example.js
    ├── google_news_request_example.js
    ├── fetch_page_request_example.js
    ├── google_search_result_example.json
    ├── google_news_response_example.json
    ├── fetch_page_response_example.json
    └── implementation.md
```

### Dependencies

- `@tokenring-ai/app`: Application framework for plugin integration
- `@tokenring-ai/agent`: Agent framework
- `@tokenring-ai/websearch`: Web search provider base class
- `@tokenring-ai/utility`: Utility functions (pick, doFetchWithRetry)
- `zod`: Runtime type validation

## API Documentation

### SerperWebSearchProvider

Extends: `WebSearchProvider` from `@tokenring-ai/websearch`

**Core Methods:**

- `searchWeb(query: string, options?: WebSearchProviderOptions): Promise<WebSearchResult>`
- `searchNews(query: string, options?: WebSearchProviderOptions): Promise<NewsSearchResult>`
- `fetchPage(url: string, options?: WebPageOptions): Promise<WebPageResult>`

**Private Methods:**

- `googleSearch(query: string, opts?: SerperSearchOptions): Promise<SerperSearchResponse>`
- `googleNews(query: string, opts?: SerperNewsOptions): Promise<SerperNewsResponse>`
- `buildPayload(query: string, opts?: Record<string, unknown>): Record<string, unknown>`
- `parseJsonOrThrow<T>(res: Response, context: string): Promise<T>`

## License

MIT License - see [LICENSE](./LICENSE) file for details.
