/**
 * Define the configurable parameters for the agent.
 */
import { Annotation } from "@langchain/langgraph";
import { SYSTEM_PROMPT_TEMPLATE } from "./prompts.js";
import { RunnableConfig } from "@langchain/core/runnables";

export const ConfigurationSchema = Annotation.Root({
  /**
   * The system prompt to be used by the agent.
   */
  systemPromptTemplate: Annotation<string>,

  /**
   * The name of the language model to be used by the agent.
   */
  model: Annotation<string>,
});

/**
 * Populate and return a ConfigurationSchema.State using values from the given RunnableConfig, applying defaults for any missing fields.
 *
 * @param config - RunnableConfig that may contain a `configurable` object with overrides for `systemPromptTemplate` and `model`.
 * @returns Configuration state where `systemPromptTemplate` defaults to `SYSTEM_PROMPT_TEMPLATE` and `model` defaults to `"gemini-2.5-flash"` if not provided.
 */
export function ensureConfiguration(
  config: RunnableConfig,
): typeof ConfigurationSchema.State {
  /**
   * Ensure the defaults are populated.
   */
  const configurable = config.configurable ?? {};
  return {
    systemPromptTemplate:
      configurable.systemPromptTemplate ?? SYSTEM_PROMPT_TEMPLATE,
    model: configurable.model ?? "gemini-2.5-flash",
  };
}
