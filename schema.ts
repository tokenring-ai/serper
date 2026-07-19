import type { ConfigFieldMeta } from "@tokenring-ai/app/config/metadata";
import { z } from "zod";
import { SerperDefaultsSchema } from "./SerperWebSearchProvider.ts";

export const SerperWebSearchProviderOptionsSchema = z.object({
  apiKey: z
    .string()
    .meta({ sensitive: true, description: "Serper.dev API key (defaults to the SERPER_API_KEY environment variable)" } satisfies ConfigFieldMeta),
  defaults: SerperDefaultsSchema.exactOptional().meta({
    label: "Search Defaults",
    advanced: true,
    description: "Default parameters applied to every Serper search",
  } satisfies ConfigFieldMeta),
});
export type SerperWebSearchProviderOptions = z.infer<typeof SerperWebSearchProviderOptionsSchema>;
