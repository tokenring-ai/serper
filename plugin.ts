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
  install(_app) {
    // Provider is built and registered in reconfigure once secrets/config are applied.
  },
  reconfigure(app, config) {
    const provider = buildProvider(app, config);
    app.waitForService(WebSearchService, webSearchService => {
      if (provider) {
        webSearchService.registerProvider("serper", provider);
      } else {
        webSearchService.unregisterProvider("serper");
      }
    });
  },
  configSchema: packageConfigSchema,
} satisfies TokenRingPlugin<typeof packageConfigSchema>;
