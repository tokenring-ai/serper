import {doFetchWithRetry} from "@tokenring-ai/utility/http/doFetchWithRetry";
import pick from "@tokenring-ai/utility/object/pick";
import WebSearchProvider, {
  NewsSearchResult,
  type WebPageOptions,
  type WebPageResult,
  type WebSearchProviderOptions,
  WebSearchResult,
} from "@tokenring-ai/websearch/WebSearchProvider";
import {z} from "zod";

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


export type SerperWebSearchProviderOptions = z.infer<typeof SerperWebSearchProviderOptionsSchema>;


export type SerperSearchRequest = {
  q: string;
  gl?: string;
  hl?: string;
  location?: string;
  num?: number;
  page?: number;
  autocorrect?: boolean;
  type?: "search";
};

export type SerperNewsRequest = {
  q: string;
  gl?: string;
  location?: string;
  num?: number;
  page?: number;
  type?: "news";
};

export type SerperSearchParameters = {
  q: string;
  gl?: string;
  hl?: string;
  autocorrect?: boolean;
  page?: number;
  type?: string;
};

export type SerperKnowledgeGraph = {
  title: string;
  type: string;
  website?: string;
  imageUrl?: string;
  description?: string;
  descriptionSource?: string;
  descriptionLink?: string;
  attributes?: Record<string, string>;
};

export type SerperSitelink = {
  title: string;
  link: string;
};

export type SerperOrganicResult = {
  title: string;
  link: string;
  snippet: string;
  date?: string;
  position: number;
  attributes?: Record<string, string>;
  sitelinks?: SerperSitelink[];
};

export type SerperPeopleAlsoAsk = {
  question: string;
  snippet: string;
  title: string;
  link: string;
};

export type SerperRelatedSearch = {
  query: string;
};

export type SerperSearchResponse = {
  searchParameters: SerperSearchParameters;
  knowledgeGraph?: SerperKnowledgeGraph;
  organic: SerperOrganicResult[];
  peopleAlsoAsk?: SerperPeopleAlsoAsk[];
  relatedSearches?: SerperRelatedSearch[];
};

export type SerperNewsResult = {
  title: string;
  link: string;
  snippet: string;
  date: string;
  source: string;
  position: number;
};

export type SerperNewsResponse = {
  searchParameters: SerperSearchParameters;
  news: SerperNewsResult[];
  credits?: number;
};

export type SerperPageResponse = {
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
};
export type SerperSearchOptions = z.infer<typeof SerperDefaultsSchema> & {
  autocorrect?: boolean;
  type?: "search";
  extraParams?: Record<string, string | number | boolean>;
};

export type SerperNewsOptions = z.infer<typeof SerperDefaultsSchema> & {
  type?: "news";
  extraParams?: Record<string, string | number | boolean>;
};

export default class SerperWebSearchProvider extends WebSearchProvider {
  constructor(private config: SerperWebSearchProviderOptions) {
    super();
    if (!config?.apiKey) throw new Error("SerperWebSearchProvider requires apiKey");
  }

  async searchWeb(query: string, options?: WebSearchProviderOptions): Promise<WebSearchResult> {
    return pick(
      await this.googleSearch(query, {
        gl: options?.countryCode,
        hl: options?.language,
        location: options?.location,
        num: options?.num,
        page: options?.page,
      }),
      ["knowledgeGraph","organic", "peopleAlsoAsk", "relatedSearches"]
    );
  }

  async searchNews(query: string, options?: WebSearchProviderOptions): Promise<NewsSearchResult> {
    return pick(
      await this.googleNews(query, {
        gl: options?.countryCode,
        hl: options?.language,
        location: options?.location,
        num: options?.num,
        page: options?.page,
      }),
      ["news"]
    );
  }
  async fetchPage(url: string, options?: WebPageOptions): Promise<WebPageResult> {
    try {
      const controller = new AbortController();
      const timeoutId = options?.timeout ? setTimeout(() => controller.abort(), options.timeout) : null;

      const response = await fetch("https://scrape.serper.dev", {
        method: "POST",
        headers: {
          "X-API-KEY": this.config.apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url,
          includeMarkdown: true
        }),
        signal: controller.signal
      });

      if (timeoutId) clearTimeout(timeoutId);

      if (!response.ok) {
        const text = await response.text().catch(() => "");
        throw new Error(`Serper page fetch failed (${response.status}): ${text?.slice(0, 500)}`);
      }

      const result = await response.json() as SerperPageResponse;

      return pick(result, ["markdown", "metadata"]);
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error(`Failed to fetch page: Request timeout`);
      }
      throw new Error(`Failed to fetch page: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async googleSearch(query: string, opts: SerperSearchOptions = {}): Promise<SerperSearchResponse> {
    const body = this.buildPayload(query, {
      ...opts,
      type: "search", ...(opts.extraParams || {})
    }) as SerperSearchRequest;
    const res = await doFetchWithRetry("https://google.serper.dev/search", {
      method: "POST",
      headers: {
        "X-API-KEY": this.config.apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    return await this.parseJsonOrThrow(res, "Serper search");
  }

  private async googleNews(query: string, opts: SerperNewsOptions = {}): Promise<SerperNewsResponse> {
    const body = this.buildPayload(query, {
      ...opts,
      tbs: "qdr:h",  // TODO: Make the date range selectable
      type: "news",
      ...(opts.extraParams || {})
    }) as SerperNewsRequest;
    const res = await doFetchWithRetry("https://google.serper.dev/news", {
      method: "POST",
      headers: {
        "X-API-KEY": this.config.apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    return await this.parseJsonOrThrow(res, "Serper news");
  }

  private buildPayload(query: string, opts?: Record<string, unknown>): Record<string, unknown> {
    if (!query) throw Object.assign(new Error("query is required"), {status: 400});
    const base: Record<string, unknown> = {q: query};
    const d: Record<string, unknown> = {...(this.config.defaults ?? {})};
    const merged: Record<string, unknown> = {...base, ...d, ...(opts || {})};

    // Remove undefined/null values
    for (const k of Object.keys(merged)) {
      const v = merged[k as keyof typeof merged];
      if (v === undefined || v === null) delete merged[k as keyof typeof merged];
    }
    return merged;
  }

  private async parseJsonOrThrow<T = any>(res: Response, context: string): Promise<T> {
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw Object.assign(new Error(`${context} failed (${res.status})`), {
        status: res.status,
        hint: res.status === 401 ? "Check SERPER_API_KEY" : res.status === 429 ? "Reduce request rate" : undefined,
        details: text?.slice(0, 500),
      });
    }
    return await res.json();
  }
}