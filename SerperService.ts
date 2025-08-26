import {Service} from "@token-ring/registry";
import {doFetchWithRetry} from "@token-ring/utility/doFetchWithRetry";

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
};

export type SerperSearchOptions = SerperDefaults & {
  autocorrect?: boolean;
  type?: "search";
  extraParams?: Record<string, string | number | boolean>;
};

export type SerperNewsOptions = SerperDefaults & {
  type?: "news";
  extraParams?: Record<string, string | number | boolean>;
};

export default class SerperService extends Service {
  name = "Serper";
  description = "Service for querying Serper.dev Google Search and News endpoints";

  private config: SerperConfig;

  constructor(config: SerperConfig) {
    super();
    if (!config?.apiKey) throw new Error("SerperService requires apiKey");
    this.config = config;
  }

  async googleSearch(query: string, opts: SerperSearchOptions = {}): Promise<any> {
    const body = this.buildPayload(query, {...opts, type: "search", ...(opts.extraParams || {})});
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

  async googleNews(query: string, opts: SerperNewsOptions = {}): Promise<any> {
    const body = this.buildPayload(query, {...opts, type: "news", ...(opts.extraParams || {})});
    const res = await doFetchWithRetry("https://google.serper.dev/search", {
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

  private async parseJsonOrThrow(res: Response, context: string): Promise<any> {
    let details: any = undefined;
    const text = await res.text().catch(() => "");
    try {
      const json = text ? JSON.parse(text) : undefined;
      if (!res.ok) {
        throw Object.assign(new Error(`${context} failed (${res.status})`), {
          status: res.status,
          hint: res.status === 401 ? "Check SERPER_API_KEY" : res.status === 429 ? "Reduce request rate" : undefined,
          details: json ?? text?.slice(0, 500),
        });
      }
      return json;
    } catch (e: any) {
      if (res.ok) {
        // not JSON? return raw text
        return text;
      }
      if (!e.status) {
        // Wrap non-standard error
        throw Object.assign(new Error(`${context} failed (${res.status})`), {
          status: res.status,
          hint: res.status === 401 ? "Check SERPER_API_KEY" : res.status === 429 ? "Reduce request rate" : undefined,
          details: details ?? text?.slice(0, 500),
        });
      }
      throw e;
    }
  }
}
