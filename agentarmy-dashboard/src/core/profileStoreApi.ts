export type ProfileKind = "social" | "ssh" | "comms";

export type StoredProfile = {
  kind: ProfileKind;
  name: string;
  data: Record<string, unknown>;
  created_by?: string;
  updated_at?: string;
  created_at?: string;
};

function authHeaders(): Record<string, string> {
  const token = localStorage.getItem("agent-token");
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

export async function listProfiles(kind: ProfileKind): Promise<StoredProfile[]> {
  const backendUrl = process.env.REACT_APP_BACKEND_URL || "http://localhost:4000";
  const res = await fetch(`${backendUrl}/profiles/${kind}`, {
    method: "GET",
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error(`list profiles failed: ${res.status}`);
  const data = await res.json();
  return Array.isArray(data?.profiles) ? data.profiles : [];
}

export async function saveProfile(
  kind: ProfileKind,
  name: string,
  data: Record<string, unknown>
): Promise<void> {
  const backendUrl = process.env.REACT_APP_BACKEND_URL || "http://localhost:4000";
  const res = await fetch(`${backendUrl}/profiles/${kind}`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ name, data }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`save profile failed: ${res.status} ${text}`);
  }
}
