import {z} from "zod";
import {SerperDefaultsSchema} from "./SerperWebSearchProvider.ts";

export const SerperWebSearchProviderOptionsSchema = z.object({
  apiKey: z.string(),
  defaults: SerperDefaultsSchema.optional(),
});
export type SerperWebSearchProviderOptions = z.infer<
  typeof SerperWebSearchProviderOptionsSchema
>;
