Serper integration design
- The package will be in pkg/serper
- A Serper service should be created in pkg/serper/SerperService.ts
- The chat command exposed to the user will be called /serper, and should be placed in pkg/serper/chatCommands/serper.ts (or .js)
- Tools should be placed in pkg/serper/tools/{googleSerpSearch, googleNewsSearch}.ts (or .js)
- Reference API docs/examples are in:
  - pkg/serper/design/google_search_request_example.js
  - pkg/serper/design/google_news_request_example.js
  - pkg/serper/design/google_search_result_example.json
  - pkg/serper/design/google_news_response_example.json

Basic functionality and workflow
- This package gives an AI agent and the user the ability to query Serper’s Google endpoints for:
  - Structured Google Search (SERP) results
  - Structured Google News results
- It should expose:
  - A /serper chat command to run quick searches/news queries from the CLI
  - Tool calls for agents to fetch search/news data

Technical details
- SerperService should:
  - Accept config with:
    - apiKey: string (required)
    - defaults (optional): { gl?: string; hl?: string; location?: string; num?: number; page?: number }
      - gl: country code (e.g., "us")
      - hl: language code (e.g., "en")
      - location: free-form location string (e.g., "United States")
      - num: number of results (SERP supports typical ranges like 10, 20, etc.)
      - page: page number (1-based)
  - Provide methods:
    - async googleSearch(query: string, opts?: { gl?: string; hl?: string; location?: string; num?: number; page?: number; autocorrect?: boolean; type?: 'search'; extraParams?: Record<string, string|number|boolean> }): Promise<any>
      - Endpoint: POST https://google.serper.dev/search
      - Headers: { 'X-API-KEY': apiKey, 'Content-Type': 'application/json' }
      - Body includes at minimum: { q: query }
      - Merge defaults, opts, and extraParams to the POST JSON (e.g., gl, hl, location, num, page, autocorrect)
    - async googleNews(query: string, opts?: { gl?: string; hl?: string; location?: string; num?: number; page?: number; type?: 'news'; extraParams?: Record<string, string|number|boolean> }): Promise<any>
      - Endpoint: POST https://google.serper.dev/news
      - Headers: { 'X-API-KEY': apiKey, 'Content-Type': 'application/json' }
      - Body includes at minimum: { q: query }
      - Merge defaults, opts, and extraParams to the POST JSON (e.g., gl, hl, location, num, page)
  - Handle request building and error responses uniformly:
    - Validate required inputs (apiKey, query)
    - On HTTP errors, throw standardized error objects: { message, status, hint, details? }
  - Respect rate limits and support retries/backoff on 429/5xx with jitter
  - Provide an injectable HTTP client (e.g., fetch/axios) to simplify testing and mocking

- Tools should wrap these methods and be context-aware:
  - googleSerpSearch(query, options) -> returns structured results as JSON
    - Returns fields per Serper search response: searchParameters, knowledgeGraph?, organic[], peopleAlsoAsk?, relatedSearches?, etc.
  - googleNewsSearch(query, options) -> returns structured results as JSON
    - Returns fields per Serper news response: searchParameters, news[], credits?, etc.
  - Standardize tool results to a stable shape where possible while preserving original Serper payloads.

- Error handling:
  - Standardized error objects with:
    - message: string
    - status?: number
    - hint?: string (e.g., "Check SERPER_API_KEY" or "Reduce request rate")
    - details?: any (raw response snippet)
  - Input validation for required fields (apiKey, query)

Chat command: /serper
- Sub-commands:
  - /serper serp <query> [--gl <code>] [--hl <code>] [--location <string>] [--num <n>] [--page <n>]
  - /serper news <query> [--gl <code>] [--hl <code>] [--location <string>] [--num <n>] [--page <n>]
- The command should:
  - Parse args, call SerperService, and display summarized results
  - For serp: print top N organic results (title + link), and mention if knowledgeGraph/peopleAlsoAsk are present
  - For news: print top N news items (title + source + link)
  - Offer --save <path> to write raw JSON to disk via filesystem service

Implementation in TokenRing Writer app
- Package registration (similar to other packages like scraperapi, ghost-io/template):
  - Import the package and service in src/tr-writer.ts:
    ```ts
    import * as SerperPackage from "@token-ring/serper";
    import { SerperService } from "@token-ring/serper";
    ```
  - Add the package to the registry alongside others:
    ```ts
    await registry.addPackages(
      // ...existing packages
      SerperPackage,
    );
    ```
  - Extend the WriterConfig to optionally include serper config:
    ```ts
    interface WriterConfig {
      // ...existing
      serper?: {
        apiKey: string;
        gl?: string;         // e.g. "us"
        hl?: string;         // e.g. "en"
        location?: string;   // e.g. "United States"
        num?: number;        // default results count
        page?: number;       // default page (1-based)
      };
    }
    ```
  - Conditionally add the service when apiKey is present (mirrors other service patterns):
    ```ts
    const serperConfig = config.serper;
    if (serperConfig && serperConfig.apiKey) {
      await registry.services.addServices(new SerperService(serperConfig));
    } else if (serperConfig) {
      console.warn("Serper configuration detected but missing apiKey. Skipping SerperService initialization.");
    }
    ```
  - Enable tools by default, unless user overrides defaults.tools:
    ```ts
    const defaultTools = Object.keys({
      // ...existing tools
      ...SerperPackage.tools,
    });
    ```

Configuration in .tokenring/writer-config.{js,cjs,mjs}
- Minimal example:
  ```js
  export default {
    defaults: {
      persona: 'writer',
      tools: [
        // enable selected tools explicitly or leave undefined to auto-enable
        'googleSerpSearch',
        'googleNewsSearch',
      ],
    },
    personas: {},
    models: {},
    templates: {},
    serper: {
      apiKey: process.env.SERPER_API_KEY,
      gl: 'us',
      hl: 'en',
      location: 'United States',
      num: 10,
      page: 1,
    },
  }
  ```
- Environment variable:
  - SERPER_API_KEY should be set in your shell or .env file used to launch tr-writer

Usage examples
- Google search (SERP):
  ```text
  /serper serp "apple inc" --gl us --hl en --location "United States" --num 10 --page 1
  ```
- Google News:
  ```text
  /serper news "Space" --gl us --hl en --location "United States" --num 10 --page 1
  ```

Developer notes
- Refer to request/response examples in pkg/serper/design/* for expected shapes
- Rate limiting & retries:
  - Implement exponential backoff on 429 and 5xx with jitter
  - Respect Serper usage limits from your account
- Testing:
  - Provide unit tests with mocked HTTP responses (mock fetch/axios)
  - Integration tests gated by SERPER_API_KEY being present (skip otherwise)
- Ethics & compliance:
  - Honor Google results usage policies and Serper TOS
  - Avoid abusive query frequencies; cache results where possible
