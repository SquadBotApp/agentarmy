import React from "react";

type EventItem = { text: string; ts: string };

type Props = {
  events: EventItem[];
  note: string;
  setNote: (s: string) => void;
  addNote: () => void;
  pastEvents: EventItem[][];
  futureEvents: EventItem[][];
  setPastEvents: React.Dispatch<React.SetStateAction<EventItem[][]>>;
  setFutureEvents: React.Dispatch<React.SetStateAction<EventItem[][]>>;
  setEvents: React.Dispatch<React.SetStateAction<EventItem[]>>;
};

export function EventsCard({ events, note, setNote, addNote, pastEvents, futureEvents, setPastEvents, setFutureEvents, setEvents }: Props) {
  return (
    <div className="card events">
      <h2>Activity</h2>
      <div className="add-note">
        <input
          className="input"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Add quick note"
        />
        <button className="btn" onClick={addNote}>
          Add
        </button>
        <button className="btn" onClick={() => {
          const last = pastEvents[pastEvents.length - 1];
          if (!last) return;
          setFutureEvents((f) => [events, ...f]);
          setPastEvents((p) => p.slice(0, -1));
          setEvents(last);
        }} disabled={pastEvents.length===0}>Undo</button>
        <button className="btn" onClick={() => {
          const next = futureEvents[0];
          if (!next) return;
          setPastEvents((p) => [...p, events]);
          setFutureEvents((f) => f.slice(1));
          setEvents(next);
        }} disabled={futureEvents.length===0}>Redo</button>
      </div>
      <ul className="events-list">
        {events.map((ev, i) => (
          <li key={`${ev.text}-${i}`}><strong>{new Date(ev.ts).toLocaleTimeString()}</strong> — {ev.text}</li>
        ))}
      </ul>
    </div>
  );
}
