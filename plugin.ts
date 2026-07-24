import type { TokenRingPlugin } from "@tokenring-ai/app";
import { WebSearchService } from "@tokenring-ai/websearch";
import { z } from "zod";
import packageJSON from "./package.json" with { type: "json" };
import SerperWebSearchProvider from "./SerperWebSearchProvider.ts";
import { SerperWebSearchProviderOptionsSchema } from "./schema.ts";

const packageConfigSchema = z.object({
  serper: SerperWebSearchProviderOptionsSchema.exactOptional(),
});

export default {
  name: packageJSON.name,
  displayName: "Serper Search",
  version: packageJSON.version,
  description: packageJSON.description,
  install(app, config) {
    if (process.env.SERPER_API_KEY) {
      config.serper ??= {
        apiKey: process.env.SERPER_API_KEY,
      };
    }

    const { serper } = config;
    if (serper) {
      app.waitForService(WebSearchService, webSearchService => {
        webSearchService.registerProvider("serper", new SerperWebSearchProvider(serper));
      });
    }
  },
  reconfigure(app, config) {
    const { serper } = config;
    if (serper) {
      app.getService(WebSearchService)?.registerProvider("serper", new SerperWebSearchProvider(serper));
    }
    // Removing the config entirely leaves the existing provider registered until restart.
  },
  configSchema: packageConfigSchema,
} satisfies TokenRingPlugin<typeof packageConfigSchema>;
