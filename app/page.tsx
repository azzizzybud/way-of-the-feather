"use client";

import { useMemo, useState } from "react";

type Msg = { role: "user" | "app"; text: string };

function pickClarifier(q: string) {
  const s = q.toLowerCase();

  if (s.includes("relationship") || s.includes("partner") || s.includes("friend")) {
    return "What is one specific moment that shows the problem (today or yesterday)?";
  }
  if (s.includes("work") || s.includes("job") || s.includes("boss") || s.includes("project")) {
    return "What is the next real situation coming up (meeting, task, message) and when is it?";
  }
  if (s.includes("money") || s.includes("rent") || s.includes("debt") || s.includes("bills")) {
    return "What is the exact money decision you’re facing this week (pay / save / ask / cut)?";
  }
  if (s.includes("health") || s.includes("pain") || s.includes("doctor") || s.includes("sleep")) {
    return "What changed recently (sleep, food, stress, schedule) and what does your body feel right now?";
  }
  return "What is one specific recent moment when this happened (time + place)?";
}

export default function Home() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: "app",
      text:
        "Welcome. Ask one real-life question. I won’t tell you what to do. I’ll help you find a balanced next step.",
    },
  ]);

  const canSend = useMemo(() => input.trim().length > 0, [input]);

  function send() {
    const q = input.trim();
    if (!q) return;

    const clarifier = pickClarifier(q);

    setMessages((m) => [
      ...m,
      { role: "user", text: q },
      {
        role: "app",
        text:
          "Thanks. First I need one detail so we don’t guess.\n\n" +
          clarifier +
          "\n\nAlso: where do you feel it most right now — chest or belly/solar plexus?",
      },
    ]);

    setInput("");
  }

  return (
    <main style={{ padding: 20, maxWidth: 700, margin: "0 auto", fontFamily: "system-ui, -apple-system, Segoe UI, Roboto" }}>
      <h1 style={{ marginBottom: 6 }}>Way of the Feather</h1>
      <p style={{ marginTop: 0, color: "#444" }}>
        Plain language. Real life. No orders. Options in balance.
      </p>

      <div style={{ border: "1px solid #ddd", borderRadius: 10, padding: 12, minHeight: 260, background: "#fafafa" }}>
        {messages.map((msg, i) => (
          <div key={i} style={{ marginBottom: 10, display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start" }}>
            <div
              style={{
                whiteSpace: "pre-wrap",
                padding: "10px 12px",
                borderRadius: 12,
                maxWidth: "85%",
                background: msg.role === "user" ? "#111" : "#fff",
                color: msg.role === "user" ? "#fff" : "#111",
                border: msg.role === "user" ? "1px solid #111" : "1px solid #e6e6e6",
              }}
            >
              {msg.text}
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your question here…"
          rows={3}
          style={{
            flex: 1,
            padding: 10,
            fontSize: 16,
            borderRadius: 10,
            border: "1px solid #ccc",
          }}
        />
        <button
          onClick={send}
          disabled={!canSend}
          style={{
            width: 110,
            borderRadius: 10,
            border: "none",
            background: canSend ? "#111" : "#999",
            color: "white",
            fontSize: 16,
            cursor: canSend ? "pointer" : "not-allowed",
          }}
        >
          Send
        </button>
      </div>

      <div style={{ marginTop: 10, fontSize: 12, color: "#666" }}>
        Note: This is a beta. It won’t give commands or pretend certainty.
      </div>
    </main>
  );
}
