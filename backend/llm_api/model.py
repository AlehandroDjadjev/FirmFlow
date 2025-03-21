#!/usr/bin/env python3

"""
Example script demonstrating:
1) Chunking data
2) Generating embeddings with OpenAI
3) Storing embeddings in Pinecone
4) Retrieving chunks for a user query
5) Calling GPT to answer
6) Simple CLI for demonstration

Usage:
  python script.py chunk-and-store <path_to_file>
  python script.py query
"""

import os
import sys
import pinecone
from openai import OpenAI  # We'll use the new openai>=1.0.0 style
from typing import List, Tuple
from dotenv import load_dotenv
from pinecone import Pinecone

# ------------------- Configuration Section ------------------- #
# If you store these in environment variables, we read them; otherwise fill in directly here.

load_dotenv()

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
PINECONE_API_KEY = os.getenv("PINECONE_API_KEY")
PINECONE_ENV = os.getenv("PINECONE_ENV")  # e.g. 'us-east-1-aws' or 'us-east1-gcp'

INDEX_NAME = os.getenv("PINECONE_INDEX_NAME")

# Embedding and Chat Models
EMBEDDING_MODEL = os.getenv("PINECONE_EMBEDDING_MODEL") # Good for general embeddings
GPT_MODEL = os.getenv("GPT_MODEL")            # or "gpt-4"
NAMESPACE = os.getenv("NAMESPACE")
# Create OpenAI client
DIMENSION = 1536
TOP_K = 3

openai_client = OpenAI(api_key=OPENAI_API_KEY)
pc = Pinecone(api_key=PINECONE_API_KEY)
index = pc.Index(INDEX_NAME)

# ------------------- 1. Document Chunking ------------------- #
def chunk_text(text: str, chunk_size=1000, overlap=100) -> List[str]:
    chunks = []
    start = 0
    text_length = len(text)

    while start < text_length:
        end = start + chunk_size
        chunk_end = min(text_length, end + overlap)
        chunk = text[start:chunk_end].strip()
        chunks.append(chunk)
        start += chunk_size

    return chunks

# ------------------- 2. Generate Embeddings ------------------- #
def get_embedding(text: str) -> List[float]:
    resp = openai_client.embeddings.create(
        model=EMBEDDING_MODEL,
        input=[text]
    )
    return resp.data[0].embedding

# ------------------- 3. Upsert Embeddings into Pinecone ------------------- #
def upsert_chunks(chunks: List[str], metadata_prefix="Document"):
    vectors = []

    for i, chunk in enumerate(chunks):
        emb = get_embedding(chunk)
        vector_id = f"{metadata_prefix}-{i}"
        meta = {"text": chunk, "source": metadata_prefix}
        vectors.append({"id": vector_id, "values": emb, "metadata": meta})

    index.upsert(vectors=vectors, namespace=NAMESPACE)
    print(f"[INFO] Upserted {len(chunks)} chunks from '{metadata_prefix}'.")

# ------------------- 4. Retrieve Relevant Chunks ------------------- #
def query_pinecone(query_text: str, top_k=TOP_K) -> List[Tuple[str, float]]:
    query_emb = get_embedding(query_text)
    result = index.query(
        vector=query_emb,
        top_k=top_k,
        include_metadata=True,
        namespace=NAMESPACE
    )

    matches = [(match.metadata["text"], match.score) for match in result.matches]
    return matches

# ------------------- 5. Call GPT with Retrieved Context ------------------- #
def get_gpt_answer(query: str, retrieved_chunks: List[Tuple[str, float]]) -> str:
    context_str = "".join([f"\n--- Chunk {i+1} (score: {score:.2f}) ---\n{chunk}\n"
                           for i, (chunk, score) in enumerate(retrieved_chunks)])

    system_content = (
        "You are an AI assistant for Bulgarian law documents. Use the provided context to answer the user's question. "
        "If the answer isn't found, say so or provide the best reasoning."
        f"\nCONTEXT: {context_str}"
    )

    messages = [
        {"role": "system", "content": system_content},
        {"role": "user", "content": query}
    ]

    resp = openai_client.chat.completions.create(
        model=GPT_MODEL,
        messages=messages,
        temperature=0.1
    )
    return resp.choices[0].message.content

# ------------------- 6. Simple CLI Integration ------------------- #
def main():
    if len(sys.argv) < 2:
        print("Usage:")
        print("  python script.py chunk-and-store <path_to_file>")
        print("  python script.py query")
        sys.exit(1)

    command = sys.argv[1]

    if command == "chunk-and-store":
        if len(sys.argv) < 3:
            print("Provide a file path.")
            sys.exit(1)
        file_path = sys.argv[2]

        with open(file_path, "r", encoding="utf-8") as f:
            text_data = f.read()

        chunks = chunk_text(text_data)
        prefix = os.path.basename(file_path).replace(".txt", "")
        upsert_chunks(chunks, metadata_prefix=prefix)

    elif command == "query":
        print("Interactive query mode. Type 'exit' to quit.")
        while True:
            user_query = input("\nQuestion: ")
            if user_query.lower().strip() == "exit":
                break

            retrieved = query_pinecone(user_query)
            answer = get_gpt_answer(user_query, retrieved)
            print("\n[AI Answer]:", answer, "\n")

    else:
        print(f"Unknown command: {command}")

if __name__ == "__main__":
    main()
