/**
 * Define the configurable parameters for the agent.
 */

import { Annotation } from "@langchain/langgraph";
import { RunnableConfig } from "@langchain/core/runnables";

/**
 * typeof ConfigurationAnnotation.State class for indexing and retrieval operations.
 *
 * This annotation defines the parameters needed for configuring the indexing and
 * retrieval processes, including user identification, embedding model selection,
 * retriever provider choice, and search parameters.
 */
export const BaseConfigurationAnnotation = Annotation.Root({
  /**
   * Name of the embedding model to use. Must be a valid embedding model name.
   */
  embeddingModel: Annotation<string>,

  /**
   * The vector store provider to use for retrieval.
   * Options are 'elastic', 'elastic-local', 'pinecone', or 'mongodb'.
   */
  retrieverProvider: Annotation<
    "elastic" | "elastic-local" | "pinecone" | "mongodb"
  >,

  /**
   * Additional keyword arguments to pass to the search function of the retriever.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  searchKwargs: Annotation<Record<string, any>>,
});

/**
 * Build a BaseConfigurationAnnotation.State from a RunnableConfig, applying defaults for missing fields.
 *
 * Returns an object compatible with BaseConfigurationAnnotation.State where:
 * - `embeddingModel` defaults to `"gemini/gemini-embedding-001"`,
 * - `retrieverProvider` defaults to `"elastic-local"`,
 * - `searchKwargs` defaults to an empty object.
 *
 * This function does not mutate the input `config`; it reads `config.configurable` (if present)
 * and fills in any missing fields with the defaults above.
 *
 * @param config - The RunnableConfig containing an optional `configurable` object to source values from.
 * @returns A fully populated BaseConfigurationAnnotation.State object.
 */
export function ensureBaseConfiguration(
  config: RunnableConfig,
): typeof BaseConfigurationAnnotation.State {
  const configurable = (config?.configurable || {}) as Partial<
    typeof BaseConfigurationAnnotation.State
  >;
  return {
    embeddingModel:
      configurable.embeddingModel || "gemini/gemini-embedding-001",
    retrieverProvider: configurable.retrieverProvider || "elastic-local",
    searchKwargs: configurable.searchKwargs || {},
  };
}
