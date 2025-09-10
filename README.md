# @tokenring-ai/serper

Serper.dev integration for the Token Ring ecosystem. This package provides:

- SerperService for calling Serper.dev Google Search and Google News endpoints
- Chat command /serper to run quick searches from the CLI
- Two agent tools (googleSerpSearch and googleNewsSearch) that return structured JSON for use by AI workflows

## Features

- Google Search (SERP) via POST https://google.serper.dev/search
- Google News via POST https://google.serper.dev/news
- Optional defaults (gl, hl, location, num, page) with per-call overrides
- Basic rate-limit handling with retries and jitter on 429/5xx
- Helpful error objects with status and hints

## Installation and registration

This package is already wired into the Token Ring Writer app in this repository. If you are integrating manually,
register the package and service with the Registry:

```ts
import * as SerperPackage from "@tokenring-ai/serper";
import {SerperService} from "@tokenring-ai/serper";

await registry.addPackages(
  // ... other packages
  SerperPackage,
);

await registry.services.addServices(
  new SerperService({apiKey: process.env.SERPER_API_KEY!})
);
```

The Writer app (src/tr-writer.ts) conditionally registers SerperService if a serper configuration with apiKey is present
in your .tokenring/writer-config file.

## Configuration

SerperService requires an API key from serper.dev.

Environment variable:

- SERPER_API_KEY: your Serper.dev API key

Example .tokenring/writer-config.mjs:

```js
export default {
 defaults: {
  persona: 'writer',
  // optionally list tools to enable explicitly; otherwise defaults are enabled
  tools: [
   'googleSerpSearch',
   'googleNewsSearch',
  ],
 },
 personas: {},
 models: {},
 templates: {},
 serper: {
  apiKey: process.env.SERPER_API_KEY,
  // Optional request defaults
  gl: 'us',       // Country
  hl: 'en',       // Language
  location: 'United States',
  num: 10,
  page: 1,        // 1-based
 },
}
```

Type definitions (simplified):

```ts
export type SerperDefaults = {
  gl?: string;
  hl?: string;
  location?: string;
  num?: number;
  page?: number; // 1-based
};

export type SerperConfig = {
  apiKey: string;
  defaults?: SerperDefaults;
  fetchImpl?: typeof fetch; // injectable HTTP client for tests
};

export type SerperSearchOptions = SerperDefaults & {
  autocorrect?: boolean;
  type?: 'search';
  extraParams?: Record<string, string | number | boolean>;
};

export type SerperNewsOptions = SerperDefaults & {
  type?: 'news';
  extraParams?: Record<string, string | number | boolean>;
};
```

## API

SerperService methods:

```ts
const serper = new SerperService({apiKey: process.env.SERPER_API_KEY!});

// Google Search
const search = await serper.googleSearch('react hooks', {
  gl: 'us', hl: 'en', location: 'United States', num: 10, page: 1,
  autocorrect: true,
  // Pass through any additional params supported by Serper
  extraParams: {someFlag: true},
});

// Google News
const news = await serper.googleNews('artificial intelligence', {
  gl: 'us', hl: 'en', location: 'United States', num: 10, page: 1,
});
```

Errors on non-2xx responses include a status and hint when available (e.g., 401 => "Check SERPER_API_KEY", 429 => "
Reduce request rate").

## CLI command

Once registered, you can use the /serper chat command in the Writer app REPL:

- /serper
  serp <query> [--gl <code>] [--hl <code>] [--location <string>] [--num <n>] [--page <n>] [--autocorrect] [--save <path>]
- /serper news <query> [--gl <code>] [--hl <code>] [--location <string>] [--num <n>] [--page <n>] [--save <path>]

Examples:

- /serper serp typescript best practices
- /serper news artificial intelligence --num 10
- /serper serp react hooks --gl us --hl en
- /serper serp node.js --save search-results.json

The --save flag writes the raw JSON response to a file via the filesystem service.

## Tools (for agents)

These tools are exported under @tokenring-ai/serper/tools and are auto-registered when the package is added to the
registry:

- googleSerpSearch
- Parameters: { query: string, gl?: string, hl?: string, location?: string, num?: number, page?: number, autocorrect?:
  boolean, extraParams?: Record<string, string|number|boolean> }
- Returns: { results?: any, error?: string }
- googleNewsSearch
- Parameters: { query: string, gl?: string, hl?: string, location?: string, num?: number, page?: number, extraParams?:
  Record<string, string|number|boolean> }
- Returns: { results?: any, error?: string }

The results are the structured JSON bodies returned by Serper.

## Notes

- Respect Serper.dev and Google usage policies. Avoid abusive querying.
- Retries with exponential backoff and jitter are applied on HTTP 429 and 5xx.
- See pkg/serper/design/* for example requests and responses.
