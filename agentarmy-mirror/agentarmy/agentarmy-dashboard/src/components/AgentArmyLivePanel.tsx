import React from "react";

import { useAgentArmyLive } from "../core/useAgentArmyLive";
import styles from "./AgentArmyLivePanel.module.css";

export function AgentArmyLivePanel() {
  const data = useAgentArmyLive();
  if (!data) return <div>Connecting to AgentArmy OS...</div>;

  return (
    <div className={styles["agentarmy-live-panel"]}>
      <h4>Live AgentArmy OS State</h4>
      <div>
        <strong>Agents:</strong>
        <ul>
          {data.agents?.map((a: any, i: number) => (
            <li key={i}>
              {a.name || a.type} <span className={styles["log-ts"]}>({a.type})</span>
            </li>
          ))}
        </ul>
      </div>
      <div>
        <strong>Subsystems:</strong>
        <ul>
          {data.subsystems &&
            Object.entries(data.subsystems).map(([k, v]) => <li key={k}>{`${k}: ${v}`}</li>)}
        </ul>
      </div>
      <div>
        <strong>Event Log:</strong>
        <ul>
          {data.event_log?.map((e: any, i: number) => (
            <li key={i}>
              {e.event} <span className={styles["log-ts"]}>{e.ts}</span>
            </li>
          ))}
        </ul>
      </div>
      <div>
        <strong>Defensive Log:</strong>
        <ul>
          {data.defensive_log?.map((e: any, i: number) => (
            <li key={i}>
              {e.action} <span className={styles["log-ts"]}>{e.ts}</span>
            </li>
          ))}
        </ul>
      </div>
      <div>
        <strong>Economic Log:</strong>
        <ul>
          {data.economic_log?.map((e: any, i: number) => (
            <li key={i}>
              Reward: {e.reward}, Penalty: {e.penalty}{" "}
              <span className={styles["log-ts"]}>{e.ts}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
