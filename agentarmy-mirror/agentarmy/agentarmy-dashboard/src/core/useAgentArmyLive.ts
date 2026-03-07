// React hook for AgentArmy OS WebSocket live updates
import { useEffect, useRef, useState } from 'react';

export function useAgentArmyLive() {
  const [data, setData] = useState<any>(null);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const ws = new WebSocket(
      process.env.REACT_APP_AGENTARMY_WS || 'ws://localhost:8000/ws'
    );
    wsRef.current = ws;
    ws.onmessage = (event) => {
      setData(JSON.parse(event.data));
    };
    ws.onerror = (e) => {
      // Optionally handle errors
    };
    return () => {
      ws.close();
    };
  }, []);

  return data;
}
