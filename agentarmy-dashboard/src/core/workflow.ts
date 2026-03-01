import { Task } from './types';
import { callLLM, callMultiModel, LLMMessage } from './llmAdapter';
import { scoreText } from './score';

// Agent and workflow engine
export type AgentInput = { text?: string; tasks?: Task[]; context?: any };
export type AgentOutput = { text?: string; tasks?: Task[]; success?: boolean };

export type Agent = {
  name: string;
  capabilities: string[];
  run: (input: AgentInput) => Promise<AgentOutput>;
};

/**
 * Rewrite text for clarity using LLM.
 */
export async function aiRewrite(text: string): Promise<string> {
  const messages: LLMMessage[] = [
    {
      role: "system",
      content:
        "You are a careful rewriting assistant. Improve clarity, conciseness, and readability. Respond only with the rewritten text.",
    },
    {
      role: "user",
      content: `Rewrite this more clearly and concisely:\n\n${text}`,
    },
  ];
  const result = await callLLM(messages);
  return result.content.trim();
}

/**
 * Summarize text into bullet points.
 */
export async function aiSummarize(text: string): Promise<string> {
  const messages: LLMMessage[] = [
    {
      role: "system",
      content:
        "You summarize text into concise bullet points. Respond only with bullet points.",
    },
    {
      role: "user",
      content: `Summarize this into 3-5 bullet points:\n\n${text}`,
    },
  ];
  const result = await callLLM(messages);
  return result.content.trim();
}

/**
 * Break a goal into actionable steps.
 */
export async function aiPlan(goal: string): Promise<Task[]> {
  const messages: LLMMessage[] = [
    {
      role: "system",
      content:
        "You break goals into numbered steps. Respond only with a numbered list of steps, 5-10 items max.",
    },
    {
      role: "user",
      content: `Break this goal into numbered steps:\n\n${goal}`,
    },
  ];
  const result = await callLLM(messages);

  // Parse numbered list into tasks
  const lines = result.content.split('\n').filter(Boolean);
  const tasks: Task[] = lines
    .map((line, i) =>
      line
        .replace(/^\d+\.\s*/, '')
        .trim()
    )
    .filter(Boolean)
    .map((title, i) => ({
      id: `tsk-${Date.now()}-${i}`,
      title: title.slice(0, 120),
      createdAt: new Date().toISOString(),
    } as Task));

  return tasks;
}

/**
 * Multi-model consensus: call multiple LLM providers and score by physics-inspired metric.
 * Each model's output becomes a "resonance sample" scored by the ZPE equation.
 */
export async function aiConsensus(
  messages: LLMMessage[],
  sliders?: { z: number; p: number; e: number },
  models?: string[]
): Promise<string> {
  const slidersVal = sliders || { z: 0.5, p: 0.5, e: 0.5 };
  const modelsVal = models || ["openai"];
  try {
    // Call all models in parallel
    const results = await callMultiModel(messages, modelsVal);

    if (results.length === 1) {
      return results[0].content.trim();
    }

    // Score each result by ZPE (physics-inspired coherence metric)
    const scored = results.map((result) => ({
      content: result.content.trim(),
      model: result.model || "unknown",
      score: scoreText(result.content, slidersVal),
    }));

    // Sort by score, pick the highest (consensus)
    scored.sort((a, b) => (b.score || 0) - (a.score || 0));
    console.log(
      "Consensus scoring:",
      scored.map((s) => ({ model: s.model, score: s.score }))
    );

    return scored[0].content;
  } catch (err) {
    console.error("Consensus error:", err);
    // Fallback to single call
    const result = await callLLM(messages);
    return result.content.trim();
  }
}

/**
 * Rewrite with multi-model consensus scoring.
 */
export async function aiRewriteConsensus(
  text: string,
  sliders?: { z: number; p: number; e: number }
): Promise<string> {
  const slidersVal = sliders || { z: 0.5, p: 0.5, e: 0.5 };
  const messages: LLMMessage[] = [
    {
      role: "system",
      content:
        "You are a careful rewriting assistant. Improve clarity, conciseness, and readability. Respond only with the rewritten text.",
    },
    {
      role: "user",
      content: `Rewrite this more clearly:\n\n${text}`,
    },
  ];
  return aiConsensus(messages, slidersVal, ["openai"]);
}

/**
 * Plan with multi-model consensus.
 */
export async function aiPlanConsensus(
  goal: string,
  sliders?: { z: number; p: number; e: number }
): Promise<Task[]> {
  const slidersVal = sliders || { z: 0.5, p: 0.5, e: 0.5 };
  const messages: LLMMessage[] = [
    {
      role: "system",
      content:
        "You break goals into numbered steps. Respond only with a numbered list of steps, 5-10 items max.",
    },
    {
      role: "user",
      content: `Break this goal into numbered steps:\n\n${goal}`,
    },
  ];

  const consensusText = await aiConsensus(messages, slidersVal, ["openai"]);
  const lines = consensusText.split('\n').filter(Boolean);
  const tasks: Task[] = lines
    .map((line) =>
      line
        .replace(/^\d+\.\s*/, '')
        .trim()
    )
    .filter(Boolean)
    .map((title, i) => ({
      id: `tsk-${Date.now()}-${i}`,
      title: title.slice(0, 120),
      createdAt: new Date().toISOString(),
    } as Task));

  return tasks;
}

export async function runWorkflow(
  agents: Agent[],
  steps: { agentName: string; input: AgentInput }[]
): Promise<AgentOutput[]> {
  const outputs: AgentOutput[] = [];
  for (const step of steps) {
    const agent = agents.find((a) => a.name === step.agentName);
    if (!agent) {
      outputs.push({ text: `Agent ${step.agentName} not found`, success: false });
      continue;
    }
    const out = await agent.run(step.input);
    outputs.push(out);
  }
  return outputs;
}
