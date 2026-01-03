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
- **Retry Logic**: Built-in retry mechanism with exponential backoff
- **Type Safety**: Full TypeScript support with Zod schema validation
- **Comprehensive Error Handling**: Detailed error messages with hints for common issues

## Installation

```bash
bun install @tokenring-ai/serper
```

## Chat Commands

This package does not include chat commands. To perform searches from the chat interface, use the websearch service provided by `@tokenring-ai/websearch`.

## Plugin Configuration

This package provides a Token Ring plugin that automatically registers the Serper provider with the websearch service.

### Configuration Schema

```typescript
interface SerperPluginConfig {
  websearch?: {
    providers: {
      [name: string]: {
        type: 'serper';
        apiKey: string;
        defaults?: {
          gl?: string;        // Country code (e.g., 'us', 'uk')
          hl?: string;        // Language code (e.g., 'en', 'fr')
          location?: string;  // Geographic location (e.g., 'Austin,Texas,United States')
          num?: number;       // Number of results per page (1-100, default 10)
          page?: number;      // Starting page number (default 1)
        };
      };
    };
  };
}
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

## Tools

This package does not include tools. Tools for web search are provided by the `@tokenring-ai/websearch` package.

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

**Example:**
```typescript
const results = await provider.searchWeb('Token Ring AI framework');
console.log(results.organic); // Array of organic search results
console.log(results.knowledgeGraph); // Knowledge graph if available
```

##### searchNews

```typescript
async searchNews(query: string, options?: WebSearchProviderOptions): Promise<NewsSearchResult>
```

Performs a Google News search and returns recent news articles.

**Example:**
```typescript
const news = await provider.searchNews('AI technology news');
console.log(news.news); // Array of news articles
```

##### fetchPage

```typescript
async fetchPage(url: string, options?: WebPageOptions): Promise<WebPageResult>
```

Fetches and extracts content from a web page using Serper's scraping service.

**Example:**
```typescript
const page = await provider.fetchPage('https://example.com', {
  timeout: 5000
});
console.log(page.markdown); // Extracted markdown content
console.log(page.metadata); // Page metadata (title, description, OpenGraph)
```

## Providers

This package does not define providers. The `SerperWebSearchProvider` is a provider implementation that registers with the websearch service.

## RPC Endpoints

This package does not define RPC endpoints.

## State Management

This package does not implement state management.

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
```

## API Reference

### WebSearchResult

| Field | Type | Description |
|-------|------|-------------|
| `organic` | `OrganicResult[]` | Array of search results with title, link, snippet, and position |
| `knowledgeGraph` | `KnowledgeGraph \| undefined` | Entity information with title, type, description, and attributes |
| `peopleAlsoAsk` | `PeopleAlsoAsk[] \| undefined` | Related questions with answers and links |
| `relatedSearches` | `RelatedSearch[] \| undefined` | Related search queries |

### NewsSearchResult

| Field | Type | Description |
|-------|------|-------------|
| `news` | `NewsItem[]` | Array of news articles with title, link, snippet, date, source, and position |

### WebPageResult

| Field | Type | Description |
|-------|------|-------------|
| `markdown` | `string` | Clean markdown-formatted content of the page |
| `metadata` | `Record<string, any>` | Page metadata including title, description, OpenGraph properties |

## Error Handling

The package provides comprehensive error handling with helpful hints:

```typescript
try {
  const results = await provider.searchWeb('query');
} catch (error) {
  if (error.status === 401) {
    console.log('Invalid API key - check SERPER_API_KEY');
  } else if (error.status === 429) {
    console.log('Rate limit exceeded - reduce request frequency');
  } else {
    console.log('Search failed:', error.message);
  }
}
```

## Development

### Testing

```bash
bun run test
bun run test:coverage
```

### Package Structure

```
pkg/serper/
├── SerperWebSearchProvider.ts    # Core implementation
├── plugin.ts                     # Token Ring plugin integration
├── index.ts                      # Package exports
├── package.json                  # Package configuration
├── design/                       # Example files and documentation
│   ├── google_search_request_example.js
│   ├── google_news_request_example.js
│   ├── fetch_page_request_example.js
│   ├── google_search_result_example.json
│   ├── google_news_response_example.json
│   ├── fetch_page_response_example.json
│   └── implementation.md
└── vitest.config.ts              # Test configuration
```

### Contribution Guidelines

- Follow established coding patterns
- Add unit tests for new functionality
- Update documentation for new features
- Ensure all changes work with TokenRing agent framework

## License

MIT License - see [LICENSE](./LICENSE) file for details.
