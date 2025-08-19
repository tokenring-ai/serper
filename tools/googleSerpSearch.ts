import ChatService from "@token-ring/chat/ChatService";
import type {Registry} from "@token-ring/registry";
import {z} from "zod";
import SerperService from "../SerperService.ts";

// Export the tool name in the required format
export const name = "serper/googleSerpSearch";

export async function execute(
  {
    query,
    gl,
    hl,
    location,
    num,
    page,
    autocorrect,
  }: {
    query?: string;
    gl?: string;
    hl?: string;
    location?: string;
    num?: number;
    page?: number;
    autocorrect?: boolean;
  },
  registry: Registry,
): Promise<{ results?: any }> {
  const chat = registry.requireFirstServiceByType(ChatService);
  const serper = registry.requireFirstServiceByType(SerperService);

  // Validate required parameters and throw errors as specified
  if (!query) {
    throw new Error(`[${name}] query is required`);
  }

  try {
    // Informational message follows the required format
    chat.infoLine(`[googleSerpSearch] Searching: ${query}`);
    const results = await serper.googleSearch(query, {
      gl,
      hl,
      location,
      num,
      page,
      autocorrect,
    });
    return {results};
  } catch (e: any) {
    const message = e?.message || String(e);
    // Throw errors instead of returning them
    throw new Error(`[${name}] ${message}`);
  }
}

export const description = "Google SERP structured search via Serper.dev. Returns structured JSON.";

export const inputSchema = z.object({
  query: z.string().min(1).describe("Search query"),
  gl: z.string().optional().describe("Country code, e.g. 'us'"),
  hl: z.string().optional().describe("Language code, e.g. 'en'"),
  location: z.string().optional().describe("Free-form location string"),
  num: z.number().int().positive().optional().describe("Number of results"),
  page: z.number().int().positive().optional().describe("Page number (1-based)"),
  autocorrect: z.boolean().optional().describe("Enable autocorrect"),
});
