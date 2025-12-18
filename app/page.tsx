"use client";

import { useMemo, useState } from "react";

type Msg = { role: "user" | "app"; text: string };

const CANON = {
  appDefinition:
    "Way of the Feather is a plain-language clarity app. You ask a real-life question, it asks a few focused follow-ups, then it helps you see a balanced next step (without telling you what to do).",
  overlay: {
    Sesh: "Knowns: what’s solid and specific (facts, events, signals).",
    Shef: "Missing/Unclear: what’s needed before we can answer cleanly.",
    Seef: "Emerging pattern: a testable insight, not a final claim.",
    Hrp: "Resolution: a Ma’at-calibrated view (truth, fair-share, right-size).",
    Shms: "Action: the smallest real move (under 15 minutes).",
  },
  terms: {
    "Ma’at":
      "Ordering intelligence: truth, fair-share, and right-size in real life. You can often feel alignment as steadier body signals and cleaner consequences.",
    Netjer:
      "The unchanging background-awareness. Not a person. Not your mind. (We don’t claim personal identity as Netjer.)",
    Ka: "The witness-channel: how experience registers without spin. Trainable. (After-body continuation is unknown.)",
    Khat: "The physical body. It senses, runs hormones/emotions, and ends at physical death.",
    Isfet:
      "Drift/distortion/incoherence. An alarm signal, not moral failure. Common signals: lurch, grind, static, numb, compulsion, rage spiral, avoidance fog.",
    Ra: "Manifest action/appearance: the visible deed, the daily cycle of doing.",
    Amen: "Hidden potential: the unmanifest seed.",
  },
  guardrails:
    "Beta note: This app doesn’t give commands, doesn’t pretend certainty, and will say “I don’t know” when it can’t answer honestly.",
};

function looksLikeDefinitionQuestion(q: string) {
  const s = q.trim().toLowerCase();
  return (
    s.startsWith("what is") ||
    s.startsWith("whats") ||
    s.startsWith("what’s") ||
    s.startsWith("define") ||
    s.startsWith("explain") ||
    s.startsWith("how does") ||
    s.includes("what is this app") ||
    s.includes("what is feather app") ||
    s.includes("what is the feather app")
  );
}

function findGlossaryHit(q: string) {
  const s = q.toLowerCase();
  const keys = Object.keys(CANON.terms);
  // try exact-ish hits first
  for (const k of keys) {
    const kk = k.toLowerCase();
    if (s.includes(kk)) return k;
  }
  // overlay terms
  const overlayKeys = Object.keys(CANON.overlay);
  for (const k of overlayKeys) {
    if (s.includes(k.toLowerCase())) return k;
  }
  return null;
}

function answerDefinition(q: string) {
  const hit = findGlossaryHit(q);

  // App definition
  if (
    q.toLowerCase().includes("feather app") ||
    q.toLowerCase().includes("this app") ||
    q.toLowerCase().includes("way of the feather")
  ) {
    return CANON.appDefinition; // one short paragraph (your choice A)
  }

  // Overlay terms
  if (hit && (hit in CANON.overlay)) {
    return `${hit}: ${(CANON.overlay as any)[hit]}`;
  }

  // Canon terms
  if (hit && (hit in CANON.terms)) {
    return `${hit}: ${(CANON.terms as any)[hit]}`;
  }

  // Generic definition reply
  return CANON.appDefinition;
}

function pickClarifierLife(q: string) {
  const s = q.toLowerCase();

  // Life domains (very light routing)
  if (s.includes("relationship") || s.includes("partner") || s.includes("friend")) {
    return "Name one specific recent moment that shows the problem (time + place).";
  }
  if (s.includes("work") || s.includes("job") || s.includes("boss") || s.includes("project")) {
    return "What is the next real work moment coming up (task/meeting/message) and when is it?";
  }
  if (s.includes("money") || s.includes("rent") || s.includes("debt") || s.includes("bills")) {
    return "What exact money choice is on the table this week (pay / save / ask / cut), and by when?";
  }
  if (s.includes("health") || s.includes("pain") || s.includes("sleep") || s.includes("anxiety")) {
    return "What changed recently (sleep/food/stress/schedule), and what do you feel in the body right now?";
  }

  // Default life clarifier
  return "What is one specific recent moment when this showed up (time + place)?";
}

function isLikelyLifeSituation(q: string) {
  // If it’s not a definition-style question, treat as life situation for now
  return !looksLikeDefinitionQuestion(q);
}

export default function Home() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: "app",
      text:
        "Welcome. Ask a real-life question, or ask “what is…” about a Feather term. " +
        "I won’t tell you what to do — I’ll help you see a balanced next step.",
    },
  ]);

  const canSend = useMemo(() => input.trim().length > 0, [input]);

  function send() {
    const q = input.trim();
    if (!q) return;

    // always record the user message
    setMessages((m) => [...m, { role: "user", text: q }]);

    // Definition / FAQ mode
    if (looksLikeDefinitionQuestion(q)) {
      const a = answerDefinition(q);
      setMessages((m) => [
        ...m,
        { role: "user", text: q },
        { role: "app", text: a + "\n\n" + CANON.guardrails },
      ]);
      setInput("");
      return;
    }

    // Life situation mode (clarify first)
    if (isLikelyLifeSituation(q)) {
      const clarifier = pickClarifierLife(q);
      setMessages((m) => [
        ...m,
        { role: "user", text: q },
        {
          role: "app",
          text:
            "Thanks. First I need one detail so we don’t guess.\n\n" +
            clarifier +
            "\n\nAlso: where do you feel it most right now — chest or belly/solar plexus?\n\n" +
            CANON.guardrails,
        },
      ]);
      setInput("");
      return;
    }
  }

  return (
    <main
      style={{
        padding: 20,
        maxWidth: 720,
        margin: "0 auto",
        fontFamily: "system-ui, -apple-system, Segoe UI, Roboto",
      }}
    >
      <h1 style={{ marginBottom: 6 }}>Way of the Feather</h1>
      <p style={{ marginTop: 0, color: "#444" }}>
        Plain language. Real life. No orders. Options in balance.
      </p>

      <div
        style={{
          border: "1px solid #ddd",
          borderRadius: 12,
          padding: 12,
          minHeight: 260,
          background: "#fafafa",
        }}
      >
        {messages.map((msg, i) => (
          <div
            key={i}
            style={{
              marginBottom: 10,
              display: "flex",
              justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
            }}
          >
            <div
              style={{
                whiteSpace: "pre-wrap",
                padding: "10px 12px",
                borderRadius: 12,
                maxWidth: "86%",
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
          placeholder='Try: "What is the Feather app?" or "I keep avoiding my project."'
          rows={3}
          style={{
            flex: 1,
            padding: 10,
            fontSize: 16,
            borderRadius: 12,
            border: "1px solid #ccc",
          }}
        />
        <button
          onClick={send}
          disabled={!canSend}
          style={{
            width: 110,
            borderRadius: 12,
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
        Tip: Ask “what is Ma’at?” or “what is Sesh?” to see the built-in glossary.
      </div>
    </main>
  );
}
