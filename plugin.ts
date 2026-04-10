import type {TokenRingPlugin} from "@tokenring-ai/app";
import {WebSearchService} from "@tokenring-ai/websearch";
import {z} from "zod";
import packageJSON from "./package.json" with {type: "json"};
import {SerperWebSearchProviderOptionsSchema} from "./schema.ts";
import SerperWebSearchProvider from "./SerperWebSearchProvider.ts";

const packageConfigSchema = z.object({
  serper: SerperWebSearchProviderOptionsSchema.optional(),
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

    const {serper} = config;
    if (serper) {
      app.waitForService(WebSearchService, (webSearchService) => {
        webSearchService.registerProvider(
          "serper",
          new SerperWebSearchProvider(serper),
        );
      });
    }
  },
  config: packageConfigSchema,
} satisfies TokenRingPlugin<typeof packageConfigSchema>;
