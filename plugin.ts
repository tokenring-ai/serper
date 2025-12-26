import {TokenRingPlugin} from "@tokenring-ai/app";
import {WebSearchConfigSchema, WebSearchService} from "@tokenring-ai/websearch";
import {z} from "zod";
import packageJSON from './package.json' with {type: 'json'};
import SerperWebSearchProvider, {SerperWebSearchProviderOptionsSchema} from "./SerperWebSearchProvider.js";

const packageConfigSchema = z.object({
  websearch: WebSearchConfigSchema.optional()
});

export default {
  name: packageJSON.name,
  version: packageJSON.version,
  description: packageJSON.description,
  install(app, config) {
    if (config.websearch) {
      app.waitForService(WebSearchService, cdnService => {
        for (const name in config.websearch!.providers) {
          const provider = config.websearch!.providers[name];
          if (provider.type === "serper") {
            cdnService.registerProvider(name, new SerperWebSearchProvider(SerperWebSearchProviderOptionsSchema.parse(provider)));
          }
        }
      });
    }
  },
  config: packageConfigSchema
} satisfies TokenRingPlugin<typeof packageConfigSchema>;
