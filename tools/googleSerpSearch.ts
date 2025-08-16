import ChatService from "@token-ring/chat/ChatService";
import { z } from "zod";
import type { Registry } from "@token-ring/registry";
import SerperService from "../SerperService.ts";

export async function execute(
  { query, gl, hl, location, num, page, autocorrect, extraParams = {} }: { query?: string; gl?: string; hl?: string; location?: string; num?: number; page?: number; autocorrect?: boolean; extraParams?: Record<string, string | number | boolean> },
  registry: Registry,
): Promise<{ results?: any; error?: string }> {
  const chat = registry.requireFirstServiceByType(ChatService);
  const serper = registry.requireFirstServiceByType(SerperService);

  if (!query) {
    const msg = "query is required";
    chat.errorLine(`[googleSerpSearch] ${msg}`);
    return { error: msg };
  }

  try {
    chat.infoLine(`[googleSerpSearch] Searching: ${query}`);
    const results = await serper.googleSearch(query, { gl, hl, location, num, page, autocorrect, extraParams });
    return { results };
  } catch (e: any) {
    const message = e?.message || String(e);
    chat.errorLine(`[googleSerpSearch] Error: ${message}`);
    return { error: message };
  }
}

export const description = "Google SERP structured search via Serper.dev. Returns structured JSON.";

export const parameters = z.object({
  query: z.string().min(1).describe("Search query"),
  gl: z.string().optional().describe("Country code, e.g. 'us'"),
  hl: z.string().optional().describe("Language code, e.g. 'en'"),
  location: z.string().optional().describe("Free-form location string"),
  num: z.number().int().positive().optional().describe("Number of results"),
  page: z.number().int().positive().optional().describe("Page number (1-based)"),
  autocorrect: z.boolean().optional().describe("Enable autocorrect"),
  extraParams: z.record(z.union([z.string(), z.number(), z.boolean()])).optional().describe("Additional request params")
});
