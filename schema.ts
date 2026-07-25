import type { ConfigFieldMeta } from "@tokenring-ai/app/config/metadata";
import { fromEnv, secret, type WithResolvedSecrets } from "@tokenring-ai/secrets/secret";
import { z } from "zod";
import { SerperDefaultsSchema } from "./SerperWebSearchProvider.ts";

export const SerperWebSearchProviderOptionsSchema = z.object({
  apiKey: secret({ description: "Serper.dev API key" } satisfies ConfigFieldMeta).default(fromEnv("SERPER_API_KEY")),
  defaults: SerperDefaultsSchema.exactOptional().meta({
    label: "Search Defaults",
    advanced: true,
    description: "Default parameters applied to every Serper search",
  } satisfies ConfigFieldMeta),
});
export type SerperWebSearchProviderOptions = z.infer<typeof SerperWebSearchProviderOptionsSchema>;

/** Options as handed to the provider, with the API key secret already resolved. */
export type ResolvedSerperWebSearchProviderOptions = WithResolvedSecrets<SerperWebSearchProviderOptions, "apiKey">;
