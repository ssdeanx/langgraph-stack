/**
 * This "graph" simply exposes an endpoint for a user to upload docs to be indexed.
 */

import { RunnableConfig } from "@langchain/core/runnables";
import { StateGraph, END, START } from "@langchain/langgraph";
import fs from "fs/promises";

import { IndexStateAnnotation } from "./state.js";
import { makeRetriever } from "../shared/retrieval.js";
import {
  ensureIndexConfiguration,
  IndexConfigurationAnnotation,
} from "./configuration.js";
import { reduceDocs } from "../shared/state.js";

/**
 * Indexes documents from the given state (or from a configured file) into the retrieval index.
 *
 * If `state.docs` is empty, this function reads JSON from the configured `docsFile`, converts it to
 * the internal document format, and uses a retriever (created via `makeRetriever`) to add the documents.
 *
 * @param state - The current index state; `state.docs` is expected to be an array of documents. If empty, documents are loaded from the configured `docsFile`.
 * @returns An update object instructing the state graph to delete the `docs` field (`{ docs: "delete" }`).
 * @throws Error if `config` is not provided.
 */
async function indexDocs(
  state: typeof IndexStateAnnotation.State,
  config?: RunnableConfig,
): Promise<typeof IndexStateAnnotation.Update> {
  if (!config) {
    throw new Error("Configuration required to run index_docs.");
  }

  const configuration = ensureIndexConfiguration(config);
  let {docs} = state;

  if (!docs.length) {
    const fileContent = await fs.readFile(configuration.docsFile, "utf-8");
    const serializedDocs = JSON.parse(fileContent);
    docs = reduceDocs([], serializedDocs);
  }

  const retriever = await makeRetriever(config);
  await retriever.addDocuments(docs);

  return { docs: "delete" };
}

// Define the graph
const builder = new StateGraph(
  IndexStateAnnotation,
  IndexConfigurationAnnotation,
)
  .addNode("indexDocs", indexDocs)
  .addEdge(START, "indexDocs")
  .addEdge("indexDocs", END);

// Compile into a graph object that you can invoke and deploy.
export const graph = builder.compile().withConfig({ runName: "IndexGraph" });
