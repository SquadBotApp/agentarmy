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
export async function callLLM(messages: LLMMessage[], model: string = 'anthropic'): Promise<LLMResponse> {
  const backendUrl = process.env.REACT_APP_BACKEND_URL || "http://localhost:4000";
  // try to include token from localStorage
  const token = localStorage.getItem('agent-token');
  const headers: Record<string,string> = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${backendUrl}/llm`, {
    method: "POST",
    headers,
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
  models: string[] = ["anthropic", "openai"]
): Promise<LLMResponse[]> {
  const promises = models.map((model) =>
    callLLM(messages, model).catch((err) => ({
      content: `[Error: ${err.message}]`,
      model,
    }))
  );
  return Promise.all(promises);
}
