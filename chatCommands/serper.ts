import {HumanInterfaceService} from "@token-ring/chat";
import ChatService from "@token-ring/chat/ChatService";
import {FileSystemService} from "@token-ring/filesystem";
import type {Registry} from "@token-ring/registry";
import SerperService from "../SerperService.ts";

export const description = "/serper [serp|news] - Quick Serper.dev searches";

// noinspection JSUnusedGlobalSymbols
export function help(): Array<string> {
  return [
    "/serper [action] <query> [options] - Quick Serper.dev searches",
    "  Actions:",
    "    serp <query>  - Perform Google search",
    "    news <query>  - Perform Google news search",
    "",
    "  Options:",
    "    --gl <code>        - Country code (e.g., us, uk, de)",
    "    --hl <code>        - Language code (e.g., en, es, fr)",
    "    --location <name>  - Location name",
    "    --num <n>          - Number of results (default varies)",
    "    --page <n>         - Page number for pagination",
    "    --save <path>      - Save raw JSON response to file",
    "    --autocorrect      - Enable autocorrect (serp only)",
    "",
    "  Examples:",
    "    /serper serp typescript best practices",
    "    /serper news artificial intelligence --num 10",
    "    /serper serp react hooks --gl us --hl en",
    "    /serper serp node.js --save search-results.json",
  ];
}

function parseArgs(args: string[]): { flags: Record<string, string | number | boolean>; rest: string[] } {
  const flags: Record<string, string | number | boolean> = {};
  const rest: string[] = [];
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === "--gl" || a === "--hl" || a === "--location" || a === "--save") {
      flags[a.slice(2)] = args[i + 1];
      i++;
    } else if (a === "--num" || a === "--page") {
      flags[a.slice(2)] = Number(args[i + 1]);
      i++;
    } else if (a === "--autocorrect") {
      flags["autocorrect"] = true;
    } else if (a.startsWith("--")) {
      // unknown flag, skip next maybe
      flags[a.slice(2)] = true;
    } else {
      rest.push(a);
    }
  }
  return {flags, rest};
}

export async function execute(remainder: string, registry: Registry): Promise<void> {
  const chat = registry.requireFirstServiceByType(ChatService);
  registry.requireFirstServiceByType(HumanInterfaceService); // ensure interactive
  const serper = registry.requireFirstServiceByType(SerperService);

  const [sub, ...rest] = remainder.trim().split(/\s+/);
  if (!sub) {
    help().forEach((l) => chat.systemLine(l));
    return;
  }

  const {flags, rest: queryParts} = parseArgs(rest);
  const query = queryParts.join(" ");

  if (sub === "serp") {
    if (!query) {
      chat.errorLine("Usage: /serper serp <query> [flags]");
      return;
    }
    const res = await serper.googleSearch(query, {
      gl: flags.gl as string | undefined,
      hl: flags.hl as string | undefined,
      location: flags.location as string | undefined,
      num: flags.num as number | undefined,
      page: flags.page as number | undefined,
      autocorrect: !!flags.autocorrect,
    });

    const organic = Array.isArray(res?.organic) ? res.organic.slice(0, 5) : [];
    if (organic.length) {
      chat.systemLine("Top results:");
      for (const item of organic) {
        chat.systemLine(`- ${item.title ?? "(no title)"} ${item.link ?? ""}`);
      }
    } else {
      chat.systemLine("No organic results.");
    }
    if (res?.knowledgeGraph) chat.systemLine("knowledgeGraph present");
    if (res?.peopleAlsoAsk) chat.systemLine("peopleAlsoAsk present");

    if (flags.save) {
      const fsService = registry.requireFirstServiceByType(FileSystemService);
      const path = String(flags.save);
      await fsService.writeFile(path, JSON.stringify(res, null, 2));
      chat.systemLine(`Saved raw JSON to ${path}`);
    }
  } else if (sub === "news") {
    if (!query) {
      chat.errorLine("Usage: /serper news <query> [flags]");
      return;
    }
    const res = await serper.googleNews(query, {
      gl: flags.gl as string | undefined,
      hl: flags.hl as string | undefined,
      location: flags.location as string | undefined,
      num: flags.num as number | undefined,
      page: flags.page as number | undefined,
    });

    const news = Array.isArray(res?.news) ? res.news.slice(0, 5) : [];
    if (news.length) {
      chat.systemLine("Top news:");
      for (const item of news) {
        chat.systemLine(`- ${item.title ?? "(no title)"} [${item.source ?? ""}] ${item.link ?? ""}`);
      }
    } else {
      chat.systemLine("No news items.");
    }

    if (flags.save) {
      const fsService = registry.requireFirstServiceByType(FileSystemService);
      const path = String(flags.save);
      await fsService.writeFile(path, JSON.stringify(res, null, 2));
      chat.systemLine(`Saved raw JSON to ${path}`);
    }
  } else {
    chat.systemLine("Unknown subcommand. Use: serp, news");
  }
}
