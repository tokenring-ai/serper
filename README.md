# @tokenring-ai/serper

## Overview

Serper.dev integration package for the Token Ring AI framework, providing Google Search and News capabilities through the Serper API. This package extends the `@tokenring-ai/websearch` module to enable seamless integration with Token Ring agents and applications for real-time web searches, news articles, and web page content extraction.

### Key Features

- **Google Search Integration**: Perform organic web searches with knowledge graphs, related searches, and "people also ask" results
- **Google News Search**: Access real-time news articles with source, date, and snippet information
- **Web Page Fetching**: Extract markdown content and metadata from web pages using Serper's scraping service
- **Location-Based Search**: Support for geographic targeting through `gl` and `location` parameters
- **Language Support**: Multi-language search capabilities through `hl` parameter
- **Plugin Architecture**: Automatic registration with Token Ring applications via websearch service
- **Retry Logic**: Built-in retry mechanism with exponential backoff via `doFetchWithRetry`
- **Type Safety**: Full TypeScript support with Zod schema validation
- **Comprehensive Error Handling**: Detailed error messages with hints for common issues

### Integration Points

- `@tokenring-ai/websearch`: Extends `WebSearchProvider` base class
- `@tokenring-ai/app`: Token Ring plugin for automatic service registration
- `@tokenring-ai/agent`: Available for agent tool integration
- `@tokenring-ai/utility`: HTTP utilities and object manipulation helpers

## Installation

```bash
bun install @tokenring-ai/serper
```

## Chat Commands

This package does not include chat commands. Searches should be performed through the websearch service provided by `@tokenring-ai/websearch`.

## Core Components

### SerperWebSearchProvider

The main provider class that extends `WebSearchProvider` from `@tokenring-ai/websearch`.

#### Constructor

```typescript
constructor(config: SerperWebSearchProviderOptions)
```

**Parameters:**
- `apiKey` (required): Your Serper.dev API key
- `defaults` (optional): Default search parameters

**Throws:** Error if `apiKey` is not provided

#### Public Methods

##### searchWeb

```typescript
async searchWeb(query: string, options?: WebSearchProviderOptions): Promise<WebSearchResult>
```

Performs a Google web search and returns organic results, knowledge graphs, and related searches.

**Parameters:**
- `query` (required): Search query string
- `options` (optional): Search options
  - `countryCode`: Geographic region code (e.g., 'us', 'uk')
  - `language`: Language code (e.g., 'en', 'de')
  - `location`: Specific location for localized results
  - `num`: Number of results to return
  - `page`: Page number for pagination

**Returns:** `Promise<WebSearchResult>` containing:
- `organic`: Array of organic search results
- `knowledgeGraph`: Knowledge graph information if available
- `peopleAlsoAsk`: Array of related questions if available
- `relatedSearches`: Array of related search queries if available

**Example:**

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
- `options` (optional): Search options
  - `countryCode`: Geographic region code
  - `language`: Language code
  - `location`: Specific location for localized results
  - `num`: Number of results to return
  - `page`: Page number for pagination

**Returns:** `Promise<NewsSearchResult>` containing:
- `news`: Array of news articles with title, link, snippet, date, source, and position

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
- `options` (optional): Fetch options
  - `timeout`: Request timeout in milliseconds

**Endpoint:** `POST https://scrape.serper.dev`

**Returns:** `Promise<WebPageResult>` containing:
- `markdown`: Extracted markdown content
- `metadata`: Page metadata including title, description, OpenGraph properties

**Example:**

```typescript
const page = await provider.fetchPage('https://example.com', {
  timeout: 10000
});

console.log(page.markdown); // Extracted markdown content
console.log(page.metadata); // Page metadata including title, description, OpenGraph properties
```

#### Private Methods

##### googleSearch

```typescript
private async googleSearch(query: string, opts?: SerperSearchOptions): Promise<SerperSearchResponse>
```

Internal method for performing Google searches via the Serper API.

**Endpoint:** `POST https://google.serper.dev/search`

##### googleNews

```typescript
private async googleNews(query: string, opts?: SerperNewsOptions): Promise<SerperNewsResponse>
```

Internal method for performing Google News searches via the Serper API.

**Endpoint:** `POST https://google.serper.dev/news`

**Note:** Uses hardcoded `tbs: "qdr:h"` for last hour results.

##### buildPayload

```typescript
private buildPayload(query: string, opts?: Record<string, unknown>): Record<string, unknown>
```

Builds the request payload by merging query, defaults, and options.

**Parameters:**
- `query`: Search query string (required)
- `opts`: Additional search options

**Returns:** Request payload object with undefined/null values removed

**Throws:** Error if query is empty

##### parseJsonOrThrow

```typescript
private async parseJsonOrThrow<T>(res: Response, context: string): Promise<T>
```

Parses JSON response or throws an error with detailed information.

**Parameters:**
- `res`: Response object
- `context`: Context string for error messages

**Returns:** Parsed JSON object

**Throws:** Error with status, hint, and details properties if response is not OK

## Services

### WebSearchProvider Integration

The `SerperWebSearchProvider` implements the `WebSearchProvider` interface and integrates with the `WebSearchService` from `@tokenring-ai/websearch`.

**Service Registration:**

When using the plugin, the provider is automatically registered with the websearch service:

```typescript
import TokenRingApp from '@tokenring-ai/app';
import { WebSearchService } from '@tokenring-ai/websearch';

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

// Access the provider through the websearch service
const websearchService = app.requireService(WebSearchService);
const results = await websearchService.search('your query', 'serper');
```

## Provider Documentation

### SerperWebSearchProvider

This package provides a web search provider implementation for the Serper API.

#### Provider Interface

The provider implements the following interface methods from `WebSearchProvider`:

- `searchWeb(query: string, options?: WebSearchProviderOptions): Promise<WebSearchResult>`
- `searchNews(query: string, options?: WebSearchProviderOptions): Promise<NewsSearchResult>`
- `fetchPage(url: string, options?: WebPageOptions): Promise<WebPageResult>`

#### Provider Configuration

```typescript
type SerperWebSearchProviderOptions = {
  apiKey: string;
  defaults?: {
    gl?: string;
    hl?: string;
    location?: string;
    num?: number;
    page?: number;
  };
};
```

#### Registration Patterns

**Plugin-based Registration:**

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
```

**Programmatic Registration:**

```typescript
import { WebSearchService } from '@tokenring-ai/websearch';
import SerperWebSearchProvider from '@tokenring-ai/serper';

const provider = new SerperWebSearchProvider({
  apiKey: process.env.SERPER_API_KEY!,
  defaults: {
    gl: 'us',
    hl: 'en'
  }
});

// Register with websearch service
websearchService.registerProvider('serper', provider);
```

## RPC Endpoints

This package does not define RPC endpoints.

## Configuration

### Configuration Schema

```typescript
import { z } from 'zod';

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

export const packageConfigSchema = z.object({
  websearch: z.object({
    providers: z.record(z.object({
      type: z.literal('serper'),
      apiKey: z.string(),
      defaults: SerperDefaultsSchema.optional(),
    })).optional(),
  }).optional(),
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

### Configuration Options

| Option | Type | Required | Description |
|--------|------|----------|-------------|
| `apiKey` | string | Yes | Serper.dev API key |
| `defaults.gl` | string | No | Geographic region code |
| `defaults.hl` | string | No | Language code |
| `defaults.location` | string | No | Specific location |
| `defaults.num` | number | No | Number of results |
| `defaults.page` | number | No | Page number |

## Integration

### Plugin Registration

This package integrates with Token Ring applications through the plugin system. When installed, it automatically registers the Serper provider with the websearch service.

### Plugin Installation

```typescript
import TokenRingApp from '@tokenring-ai/app';
import serperPlugin from '@tokenring-ai/serper/plugin';

const app = new TokenRingApp();

await app.installPlugin(serperPlugin, {
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
```

### Agent Integration

The provider can be used as a tool for agents:

```typescript
import { Agent } from '@tokenring-ai/agent';
import SerperWebSearchProvider from '@tokenring-ai/serper';

const provider = new SerperWebSearchProvider({
  apiKey: process.env.SERPER_API_KEY!
});

const agent = new Agent({
  name: 'Researcher',
  tools: [
    {
      name: 'searchWeb',
      description: 'Search the web using Google',
      handler: async (query: string) => {
        return await provider.searchWeb(query);
      }
    },
    {
      name: 'searchNews',
      description: 'Search for news articles',
      handler: async (query: string) => {
        return await provider.searchNews(query);
      }
    }
  ]
});
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
import { WebSearchService } from '@tokenring-ai/websearch';

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

## Best Practices

1. **API Key Security**: Store your Serper API key in environment variables and never commit it to version control
2. **Rate Limiting**: Implement appropriate delays between requests to avoid rate limiting
3. **Caching**: Consider caching repeated search queries to reduce API usage
4. **Error Handling**: Always handle potential errors from search operations
5. **Configuration Defaults**: Set reasonable default values for search parameters to ensure consistent behavior
6. **Timeout Management**: Configure appropriate timeouts for page fetching operations
7. **Query Validation**: Validate search queries before sending to the API
8. **Result Processing**: Handle cases where results may be empty or incomplete

## Testing

### Unit Testing

This package uses vitest for unit testing. Run tests with:

```bash
bun run test
```

### Coverage

Generate test coverage reports with:

```bash
bun run test:coverage
```

### Test Configuration

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html']
    }
  }
});
```

## State Management

This package does not implement state management. The provider is stateless and does not persist any data between requests.

## Type Definitions

### Request Types

#### SerperSearchRequest

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

#### SerperNewsRequest

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

#### SerperSearchParameters

Search parameters in response

```typescript
{
  q: string;
  gl?: string;
  hl?: string;
  autocorrect?: boolean;
  page?: number;
  type?: string;
}
```

### Response Types

#### SerperSearchResponse

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

#### SerperNewsResponse

Response structure for news search

```typescript
{
  searchParameters: SerperSearchParameters;
  news: SerperNewsResult[];
  credits?: number;
}
```

#### SerperPageResponse

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

### Result Types

#### SerperKnowledgeGraph

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

#### SerperSitelink

```typescript
{
  title: string;
  link: string;
}
```

#### SerperOrganicResult

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

#### SerperPeopleAlsoAsk

```typescript
{
  question: string;
  snippet: string;
  title: string;
  link: string;
}
```

#### SerperRelatedSearch

```typescript
{
  query: string;
}
```

#### SerperNewsResult

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
    ├── fetch_page_response_example.json
    ├── google_news_response_example.json
    ├── google_search_result_example.json
    └── implementation.md
```

### Build and Development

```bash
# Install dependencies
bun install

# Run tests
bun run test

# Run tests in watch mode
bun run test:watch

# Generate coverage report
bun run test:coverage

# Type check
bun run build
```

## Dependencies

### Production Dependencies

| Package | Version | Description |
|---------|---------|-------------|
| `@tokenring-ai/app` | 0.2.0 | Application framework for plugin integration |
| `@tokenring-ai/agent` | 0.2.0 | Agent framework |
| `@tokenring-ai/websearch` | 0.2.0 | Web search provider base class |
| `@tokenring-ai/utility` | 0.2.0 | Utility functions (pick, doFetchWithRetry) |
| `zod` | ^4.3.6 | Runtime type validation |

### Development Dependencies

| Package | Version | Description |
|---------|---------|-------------|
| `vitest` | ^4.0.18 | Testing framework |
| `@vitest/coverage-v8` | ^4.0.18 | Coverage tooling |
| `typescript` | ^5.9.3 | TypeScript compiler |

## Related Components

- `@tokenring-ai/websearch`: Web search provider interface and service
- `@tokenring-ai/app`: Token Ring application framework
- `@tokenring-ai/agent`: Agent orchestration system
- `@tokenring-ai/utility`: Shared utilities and helpers

## License

MIT License - see [LICENSE](./LICENSE) file for details.
