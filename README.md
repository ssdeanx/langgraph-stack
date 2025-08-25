# LangGraph Stack Project Overview

This project is a monorepo built using TurboRepo, designed to develop and deploy advanced AI applications leveraging the LangChain and LangGraph frameworks. It comprises a web-based user interface (`apps/web`) for interacting with various AI agents (`apps/agents`).

## Project Structure

The project is organized as a monorepo with the following key directories:

*   **`apps/`**: Contains individual applications within the monorepo.
    *   **`apps/web/`**: A Next.js application serving as a chat UI.
    *   **`apps/agents/`**: Houses multiple LangGraph-based AI agent implementations.
*   **`langgraph.json`**: Global LangGraph configuration file.
*   **`package.json`**: Root project dependencies and scripts, managed by npm and TurboRepo.
*   **`turbo.json`**: TurboRepo configuration for optimizing builds and development.

## Applications

### 1. `apps/web/` (Agent Chat UI)

This is a Next.js (previously Vite + React) application that provides a chat interface for interacting with any LangGraph server that exposes a `messages` key.

**Key Features:**

*   **User Interface:** A modern chat interface for engaging with AI agents.
*   **Configurable Connection:** Users can specify the deployment URL of a LangGraph server, the Assistant/Graph ID, and optionally a LangSmith API key for authentication.
*   **Integration:** Designed to seamlessly connect with and control the AI agents running on the LangGraph server.

### 2. `apps/agents/` (LangGraph AI Agents)

This directory contains the core AI agent implementations, built using LangGraph. These agents are designed to be flexible and highly configurable, supporting various Large Language Models (LLMs) and vector store integrations.

**Key Technologies:**

*   **LangGraph:** Used for defining complex, stateful multi-actor workflows.
*   **Multiple LLM Providers:** Supports Anthropic (Claude), Cohere, Google GenAI, and OpenAI (GPT series) models.
*   **Vector Store Integrations:** Integrates with Elasticsearch, MongoDB Atlas, and Pinecone for knowledge retrieval and memory.
*   **Schema Validation:** Uses Zod for validating data structures and agent outputs.
*   **Environment Variables:** Utilizes `dotenv` for managing API keys and sensitive configurations.

**Agent Types Identified:**

The `src/` directory within `apps/agents/` reveals different types of agents:

*   **`memory-agent/`**: Likely focuses on agents with long-term memory capabilities.
*   **`react-agent/`**: Implements agents using the ReAct (Reasoning and Acting) pattern for tool use and planning.
*   **`research-agent/`**: A sophisticated RAG-based agent designed for multi-step information retrieval and research.
*   **`retrieval-agent/`**: Primarily focused on Retrieval Augmented Generation (RAG).

#### Detailed Look: `research-agent`

The `research-agent` is a comprehensive example of an advanced RAG agent template, featuring a two-part system:

*   **`index-graph/`**:
    *   **Purpose**: Indexes document objects into a configured vector store (Elasticsearch, MongoDB Atlas, or Pinecone).
    *   **Functionality**: Can ingest provided documents or use sample documents from `sample_docs.json`. It processes and stores these documents, making them available for retrieval.
*   **`retrieval-graph/`**:
    *   **Purpose**: Manages chat history, analyzes user queries, and generates responses based on fetched documents.
    *   **Workflow**:
        1.  **Query Analysis & Routing**: Classifies user queries (e.g., "LangChain" related, ambiguous, general).
        2.  **Research Plan Creation**: For "LangChain" related queries, it generates a detailed research plan (a series of steps).
        3.  **`researcher-graph/` (Subgraph)**: For each step in the research plan:
            *   Generates specific search queries.
            *   Retrieves relevant documents in parallel from the vector store.
        4.  **Response Generation**: Synthesizes information from retrieved documents and conversation context to formulate a coherent response.
    *   **Configurability**: Highly customizable with options to change retriever, embedding models, search parameters, prompts (router, research plan, response), and extend the graph itself.

## Development & Deployment

*   **`npm run dev`**: Uses `concurrently` and `turbo` to run both `web` and `agents` applications in development mode.
*   **`@langchain/langgraph-cli`**: Used to run the agent server (e.g., `npx @langchain/langgraph-cli dev --port 2024 --config ../../langgraph.json`).
*   **LangGraph Studio & LangSmith Integration**: The project is designed for integration with LangGraph Studio for visual debugging and LangSmith for tracing and observability.

This `langgraph-stack` project provides a robust foundation for building, extending, and deploying intelligent AI agents capable of complex interactions, knowledge retrieval, and multi-modal responses.
