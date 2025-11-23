import TokenRingApp from "@tokenring-ai/app";
import {TokenRingPlugin} from "@tokenring-ai/app";
import {WebSearchConfigSchema, WebSearchService} from "@tokenring-ai/websearch";
import packageJSON from './package.json' with {type: 'json'};
import SerperWebSearchProvider, {SerperWebSearchProviderOptionsSchema} from "./SerperWebSearchProvider.js";

export default {
  name: packageJSON.name,
  version: packageJSON.version,
  description: packageJSON.description,
  install(app: TokenRingApp) {
    const websearchConfig = app.getConfigSlice("websearch", WebSearchConfigSchema);

    if (websearchConfig) {
      app.waitForService(WebSearchService, cdnService => {
        for (const name in websearchConfig.providers) {
          const provider = websearchConfig.providers[name];
          if (provider.type === "serper") {
            cdnService.registerProvider(name, new SerperWebSearchProvider(SerperWebSearchProviderOptionsSchema.parse(provider)));
          }
        }
      });
    }
  },
} as TokenRingPlugin;

export {default as SerperWebSearchProvider} from "./SerperWebSearchProvider.ts";