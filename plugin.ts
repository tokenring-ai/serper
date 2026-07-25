import type TokenRingApp from "@tokenring-ai/app";
import type { TokenRingPlugin } from "@tokenring-ai/app";
import { resolveSecret } from "@tokenring-ai/secrets";
import { WebSearchService } from "@tokenring-ai/websearch";
import { z } from "zod";
import packageJSON from "./package.json" with { type: "json" };
import SerperWebSearchProvider from "./SerperWebSearchProvider.ts";
import { SerperWebSearchProviderOptionsSchema } from "./schema.ts";

const packageConfigSchema = z.object({
  serper: SerperWebSearchProviderOptionsSchema.prefault({}),
});

/** Builds the provider, or returns undefined when the API key resolves to no value. */
function buildProvider(app: TokenRingApp, config: z.output<typeof packageConfigSchema>): SerperWebSearchProvider | undefined {
  const { serper } = config;

  const apiKey = resolveSecret(app, serper.apiKey);
  if (!apiKey) return undefined;

  return new SerperWebSearchProvider({ ...serper, apiKey });
}

export default {
  name: packageJSON.name,
  displayName: "Serper Search",
  version: packageJSON.version,
  description: packageJSON.description,
  install(app, config) {
    const provider = buildProvider(app, config);
    if (provider) {
      app.waitForService(WebSearchService, webSearchService => {
        webSearchService.registerProvider("serper", provider);
      });
    }
  },
  reconfigure(app, config) {
    const provider = buildProvider(app, config);
    if (provider) {
      app.getService(WebSearchService)?.registerProvider("serper", provider);
    }
    // Removing the config entirely leaves the existing provider registered until restart.
  },
  configSchema: packageConfigSchema,
} satisfies TokenRingPlugin<typeof packageConfigSchema>;
