export type LLMRole = "system" | "user" | "assistant";

export type LLMMessage = {
  role: LLMRole;
  content: string;
};

export type LLMResponse = {
  content: string;
  model?: string;
};

/**
 * Call the backend LLM endpoint.
 * The backend handles auth, model selection, and secrets.
 */
export async function callLLM(messages: LLMMessage[], model?: string): Promise<LLMResponse> {
  const backendUrl = process.env.REACT_APP_BACKEND_URL || "http://localhost:4000";
  const res = await fetch(`${backendUrl}/llm`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-user-role": "user", // Can be overridden by app context
    },
    body: JSON.stringify({ messages, model }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`LLM call failed: ${res.status} ${err}`);
  }

  const data = await res.json();
  return { content: data.content, model: data.model };
}

/**
 * Multi-model consensus: call multiple models and return all results.
 * Useful for physics-inspired scoring and ensemble methods.
 */
export async function callMultiModel(
  messages: LLMMessage[],
  models: string[] = ["openai", "fallback"]
): Promise<LLMResponse[]> {
  const promises = models.map((model) =>
    callLLM(messages, model).catch((err) => ({
      content: `[Error: ${err.message}]`,
      model,
    }))
  );
  return Promise.all(promises);
}
