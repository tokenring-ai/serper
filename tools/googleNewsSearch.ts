import ChatService from "@token-ring/chat/ChatService";
import type {Registry} from "@token-ring/registry";
import {TokenRingToolDefinition} from "@token-ring/registry/ToolRegistry";
import {z} from "zod";
import SerperService from "../SerperService.ts";

// Exported tool name following "packageName/toolName" convention
export const name = "serper/googleNewsSearch";

export async function execute(
  {
    query,
    gl,
    hl,
    location,
    num,
    page,
    extraParams = {},
  }: {
    query?: string;
    gl?: string;
    hl?: string;
    location?: string;
    num?: number;
    page?: number;
    extraParams?: Record<string, string | number | boolean>;
  },
  registry: Registry,
): Promise<{ results?: any }> {
  const chat = registry.requireFirstServiceByType(ChatService);
  const serper = registry.requireFirstServiceByType(SerperService);

  if (!query) {
    const msg = "query is required";
    // Throw error instead of returning; include tool name in message
    throw new Error(`[${name}] ${msg}`);
  }

  try {
    chat.infoLine(`[${name}] Searching news: ${query}`);
    const results = await serper.googleNews(query, {gl, hl, location, num, page, extraParams});
    return {results};
  } catch (e: any) {
    const message = e?.message || String(e);
    // Throw error with tool name prefix
    throw new Error(`[${name}] Error: ${message}`);
  }
}

export const description = "Google News structured search via Serper.dev. Returns structured JSON.";

export const inputSchema = z.object({
  query: z.string().min(1).describe("News search query"),
  gl: z.string().optional().describe("Country code, e.g. 'us'"),
  hl: z.string().optional().describe("Language code, e.g. 'en'"),
  location: z.string().optional().describe("Free-form location string"),
  num: z.number().int().positive().optional().describe("Number of results"),
  page: z.number().int().positive().optional().describe("Page number (1-based)"),
  extraParams: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).optional().describe("Additional request params"),
});
