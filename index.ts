import {AgentTeam, TokenRingPackage} from "@tokenring-ai/agent";
import {WebSearchConfigSchema, WebSearchService} from "@tokenring-ai/websearch";
import packageJSON from './package.json' with {type: 'json'};
import SerperWebSearchProvider, {SerperWebSearchProviderOptionsSchema} from "./SerperWebSearchProvider.js";

export default {
  name: packageJSON.name,
  version: packageJSON.version,
  description: packageJSON.description,
  install(agentTeam: AgentTeam) {
    const websearchConfig = agentTeam.getConfigSlice("websearch", WebSearchConfigSchema);

    if (websearchConfig) {
      agentTeam.services.waitForItemByType(WebSearchService).then(cdnService => {
        for (const name in websearchConfig.providers) {
          const provider = websearchConfig.providers[name];
          if (provider.type === "serper") {
            cdnService.registerProvider(name, new SerperWebSearchProvider(SerperWebSearchProviderOptionsSchema.parse(provider)));
          }
        }
      });
    }
  },
} as TokenRingPackage;

export {default as SerperWebSearchProvider} from "./SerperWebSearchProvider.ts";