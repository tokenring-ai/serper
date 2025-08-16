import ChatService from "@token-ring/chat/ChatService";
import { z } from "zod";
import type { Registry } from "@token-ring/registry";
import SerperService from "../SerperService.ts";

export async function execute(
  { query, gl, hl, location, num, page, extraParams = {} }: { query?: string; gl?: string; hl?: string; location?: string; num?: number; page?: number; extraParams?: Record<string, string | number | boolean> },
  registry: Registry,
): Promise<{ results?: any } | { error: string }> {
  const toolName = "googleNewsSearch";
  const chat = registry.requireFirstServiceByType(ChatService);
  const serper = registry.requireFirstServiceByType(SerperService);

  if (!query) {
    const msg = "query is required";
    chat.errorLine(`[${toolName}] ${msg}`);
    return { error: msg };
  }

  try {
    chat.infoLine(`[${toolName}] Searching news: ${query}`);
    const results = await serper.googleNews(query, { gl, hl, location, num, page, extraParams });
    return { results };
  } catch (e: any) {
    const message = e?.message || String(e);
    chat.errorLine(`[${toolName}] Error: ${message}`);
    return { error: message };
  }
}

export const description = "Google News structured search via Serper.dev. Returns structured JSON.";

export const parameters = z.object({
  query: z.string().min(1).describe("News search query"),
  gl: z.string().optional().describe("Country code, e.g. 'us'"),
  hl: z.string().optional().describe("Language code, e.g. 'en'"),
  location: z.string().optional().describe("Free-form location string"),
  num: z.number().int().positive().optional().describe("Number of results"),
  page: z.number().int().positive().optional().describe("Page number (1-based)"),
  extraParams: z.record(z.union([z.string(), z.number(), z.boolean()])).optional().describe("Additional request params")
});
