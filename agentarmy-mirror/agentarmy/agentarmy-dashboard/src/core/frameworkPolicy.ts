export type OrchestrationFramework =
  | "native"
  | "langgraph"
  | "crewai"
  | "smolagents"
  | "autogen"
  | "frabric";

export const FRAMEWORK_STORAGE_KEY = "agentarmy_framework";
export const FRAMEWORK_OPTIONS: ReadonlyArray<OrchestrationFramework> = [
  "frabric",
  "native",
  "langgraph",
  "crewai",
  "smolagents",
  "autogen",
];

function normalizeFramework(value: unknown): OrchestrationFramework {
  const candidate = String(value || "").trim().toLowerCase();
  if (candidate === "fabric") return "frabric";
  if (FRAMEWORK_OPTIONS.includes(candidate as OrchestrationFramework)) {
    return candidate as OrchestrationFramework;
  }
  return "frabric";
}

export function getGlobalFramework(): OrchestrationFramework {
  try {
    return normalizeFramework(localStorage.getItem(FRAMEWORK_STORAGE_KEY));
  } catch {
    return "frabric";
  }
}

export function setGlobalFramework(framework: string): OrchestrationFramework {
  const normalized = normalizeFramework(framework);
  try {
    localStorage.setItem(FRAMEWORK_STORAGE_KEY, normalized);
  } catch {
    // Ignore storage write issues in restricted environments.
  }
  return normalized;
}
