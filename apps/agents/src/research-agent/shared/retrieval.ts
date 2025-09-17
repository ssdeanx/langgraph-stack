import { Client } from "@elastic/elasticsearch";
import { ElasticVectorSearch } from "@langchain/community/vectorstores/elasticsearch";
import { RunnableConfig } from "@langchain/core/runnables";
import { VectorStoreRetriever } from "@langchain/core/vectorstores";
import { MongoDBAtlasVectorSearch } from "@langchain/mongodb";
import { PineconeStore } from "@langchain/pinecone";
import { MongoClient } from "mongodb";
import { ensureBaseConfiguration } from "./configuration.js";
import { Pinecone as PineconeClient } from "@pinecone-database/pinecone";
import { Embeddings } from "@langchain/core/embeddings";
import { CohereEmbeddings } from "@langchain/cohere";
import { OpenAIEmbeddings } from "@langchain/openai";
import { GeminiEmbeddings } from "@langchain/google-genai";

/**
 * Creates an Elasticsearch-backed VectorStore retriever using the provided embeddings.
 *
 * Uses ELASTICSEARCH_URL to connect to Elasticsearch and selects authentication based on
 * configuration.retrieverProvider:
 * - "elastic-local": requires ELASTICSEARCH_USER and ELASTICSEARCH_PASSWORD (basic auth).
 * - otherwise: requires ELASTICSEARCH_API_KEY (API key auth).
 *
 * The retriever is built from an ElasticVectorSearch against index "langchain_index" and
 * returned with an applied filter from configuration.searchKwargs (or an empty filter if unset).
 *
 * @param configuration - Normalized base configuration; its `retrieverProvider` and `searchKwargs` fields control auth selection and retriever filtering.
 * @param embeddingModel - Embeddings implementation used to create the Elastic vector store.
 * @returns A VectorStoreRetriever configured for the Elasticsearch index.
 * @throws If ELASTICSEARCH_URL is missing or the required authentication environment variables are not defined.
 */
async function makeElasticRetriever(
  configuration: ReturnType<typeof ensureBaseConfiguration>,
  embeddingModel: Embeddings,
): Promise<VectorStoreRetriever> {
  const elasticUrl = process.env.ELASTICSEARCH_URL;
  if (!elasticUrl) {
    throw new Error("ELASTICSEARCH_URL environment variable is not defined");
  }

  let auth: { username: string; password: string } | { apiKey: string };
  if (configuration.retrieverProvider === "elastic-local") {
    const username = process.env.ELASTICSEARCH_USER;
    const password = process.env.ELASTICSEARCH_PASSWORD;
    if (!username || !password) {
      throw new Error(
        "ELASTICSEARCH_USER or ELASTICSEARCH_PASSWORD environment variable is not defined",
      );
    }
    auth = { username, password };
  } else {
    const apiKey = process.env.ELASTICSEARCH_API_KEY;
    if (!apiKey) {
      throw new Error(
        "ELASTICSEARCH_API_KEY environment variable is not defined",
      );
    }
    auth = { apiKey };
  }

  const client = new Client({
    node: elasticUrl,
    auth,
  });

  const vectorStore = new ElasticVectorSearch(embeddingModel, {
    client,
    indexName: "langchain_index",
  });
  return vectorStore.asRetriever({ filter: configuration.searchKwargs || {} });
}

async function makePineconeRetriever(
  configuration: ReturnType<typeof ensureBaseConfiguration>,
  embeddingModel: Embeddings,
): Promise<VectorStoreRetriever> {
  const indexName = process.env.PINECONE_INDEX_NAME;
  if (!indexName) {
    throw new Error("PINECONE_INDEX_NAME environment variable is not defined");
  }
  const pinecone = new PineconeClient();
  const pineconeIndex = pinecone.Index(indexName!);
  const vectorStore = await PineconeStore.fromExistingIndex(embeddingModel, {
    pineconeIndex,
  });

  return vectorStore.asRetriever({ filter: configuration.searchKwargs || {} });
}

async function makeMongoDBRetriever(
  configuration: ReturnType<typeof ensureBaseConfiguration>,
  embeddingModel: Embeddings,
): Promise<VectorStoreRetriever> {
  if (!process.env.MONGODB_URI) {
    throw new Error("MONGODB_URI environment variable is not defined");
  }
  const client = new MongoClient(process.env.MONGODB_URI);
  const namespace = `langgraph_retrieval_agent.default`;
  const [dbName, collectionName] = namespace.split(".");
  const collection = client.db(dbName).collection(collectionName);
  const vectorStore = new MongoDBAtlasVectorSearch(embeddingModel, {
    collection: collection,
    textKey: "text",
    embeddingKey: "embedding",
    indexName: "vector_index",
  });
  return vectorStore.asRetriever({ filter: configuration.searchKwargs || {} });
}

/**
 * Create an Embeddings instance for the given model identifier.
 *
 * Parses `modelName` of the form `<provider>/<model>` to select and instantiate
 * the corresponding embeddings provider. If `modelName` contains no `/`, the
 * provider defaults to `gemini` and the entire string is used as the model name.
 *
 * Supported providers:
 * - `gemini` → returns `GeminiEmbeddings({ model })`
 * - `openai` → returns `OpenAIEmbeddings({ model })`
 * - `cohere` → returns `CohereEmbeddings({ model })`
 *
 * @param modelName - A provider-qualified model string (`provider/model`) or a bare model name (defaults provider to `gemini`).
 * @returns An Embeddings instance for the requested provider and model.
 * @throws Error if the provider parsed from `modelName` is not supported.
 */
function makeTextEmbeddings(modelName: string): Embeddings {
  /**
   * Connect to the configured text encoder.
   */
  const index = modelName.indexOf("/");
  let provider, model;
  if (index === -1) {
    model = modelName;
    provider = "gemini"; // Assume gemini if no provider included
  } else {
    provider = modelName.slice(0, index);
    model = modelName.slice(index + 1);
  }
  switch (provider) {
    case "gemini":
      return new GeminiEmbeddings({ model });
    case "openai":
      return new OpenAIEmbeddings({ model });
    case "cohere":
      return new CohereEmbeddings({ model });
    default:
      throw new Error(`Unsupported embedding provider: ${provider}`);
  }
}

export async function makeRetriever(
  config: RunnableConfig,
): Promise<VectorStoreRetriever> {
  const configuration = ensureBaseConfiguration(config);
  const embeddingModel = makeTextEmbeddings(configuration.embeddingModel);

  switch (configuration.retrieverProvider) {
    case "elastic":
    case "elastic-local":
      return makeElasticRetriever(configuration, embeddingModel);
    case "pinecone":
      return makePineconeRetriever(configuration, embeddingModel);
    case "mongodb":
      return makeMongoDBRetriever(configuration, embeddingModel);
    default:
      throw new Error(
        `Unrecognized retrieverProvider in configuration: ${configuration.retrieverProvider}`,
      );
  }
}
