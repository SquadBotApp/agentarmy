type Handler = (payload?: any) => void;

const listeners: Record<string, Handler[]> = {};

export const eventBus = {
  on(event: string, h: Handler) {
    listeners[event] = listeners[event] || [];
    listeners[event].push(h);
    return () => { listeners[event] = listeners[event].filter(x=>x!==h); };
  },
  emit(event: string, payload?: any) {
    (listeners[event] || []).forEach(h => { try { h(payload); } catch {} });
  }
};
