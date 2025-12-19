"use client";

import { useMemo, useState } from "react";

type Role = "user" | "app";
type Msg = { role: Role; text: string };

type Flow = "none" | "definition" | "daily" | "relationship";

type BodyLoc = "chest" | "belly";
type BodyQual = "tight" | "open" | "numb" | "heat" | "neutral";

type DailyDisturbance = "thoughts" | "people" | "phone" | "pressure" | "body_fatigue" | "unclear";
type DailyTiming = "today" | "most_days";
type Goal = "ease" | "focus" | "calm" | "discipline" | "peace" | "fairness" | "respect" | "safety" | "clarity" | "unknown";

type Pattern = "triangle" | "boundary" | "fair_share" | "truth_distortion" | "proportion_overload" | "unclear";

type Step =
  | "none"
  | "def_done"
  // daily
  | "daily_timing"
  | "daily_disturbance"
  | "daily_body_loc"
  | "daily_body_qual"
  | "daily_goal"
  | "daily_resolve"
  // relationship
  | "rel_time"
  | "rel_role"
  | "rel_body_loc"
  | "rel_body_qual"
  | "rel_goal"
  | "rel_repeating"
  | "rel_resolve";

type Session = {
  flow: Flow;
  step: Step;
  originalQuestion: string;

  // shared
  bodyLoc?: BodyLoc;
  bodyQual?: BodyQual;
  goal?: Goal;

  // daily
  dailyTiming?: DailyTiming;
  dailyDisturbance?: DailyDisturbance;

  // relationship
  relTime?: "today_breakfast" | "today_lunch" | "today_dinner" | "today_phone" | "yesterday" | "this_week" | "other";
  relRole?: "involved" | "witness" | "asked_to_fix" | "unclear";
  relRepeating?: "one_time" | "repeating" | "unclear";

  // relationship classification
  relPattern?: Pattern;
};

const CANON = {
  appDefinition:
    "Way of the Feather is a plain-language clarity app. You ask a real-life question, it asks a few focused follow-ups, then it helps you see a balanced next step (without telling you what to do).",
  overlay: {
    Sesh: "Knowns: what’s solid and specific (facts, events, signals).",
    Shef: "Missing/Unclear: what’s needed before we can answer cleanly.",
    Seef: "Emerging pattern: a testable insight, not a final claim.",
    Hrp: "Resolution: a Ma’at-calibrated view (truth, fair-share, right-size).",
    Shms: "Action: the smallest move (under 15 minutes).",
  },
  terms: {
    "Ma’at":
      "Ordering intelligence: truth, fair-share, and right-size in real life. Alignment is often detectable by steadier body signals and cleaner consequences.",
    Isfet:
      "Drift/distortion/incoherence. An alarm signal, not moral failure. Common signals: lurch, grind, static, numb, compulsion, rage spiral, avoidance fog.",
    Netjer: "The unchanging background-awareness. Not a person. Not your mind.",
    Ka: "The witness-channel: how experience registers without spin. Trainable.",
    Khat: "The physical body. It senses and ends at physical death.",
  },
  guardrailsShort:
    "Beta note: I won’t give commands, I won’t fake certainty, and I’ll say “I don’t know” when information is missing.",
};

function normalize(s: string) {
  return s.trim().toLowerCase();
}

function looksLikeDefinitionQuestion(q: string) {
  const s = normalize(q);
  return (
    s.startsWith("what is") ||
    s.startsWith("whats") ||
    s.startsWith("what’s") ||
    s.startsWith("define") ||
    s.startsWith("explain") ||
    s.startsWith("how does") ||
    s.includes("what is this app") ||
    s.includes("what is feather app") ||
    s.includes("way of the feather") ||
    s.includes("what is maat") ||
    s.includes("what is ma'at") ||
    s.includes("what is isfet") ||
    s.includes("what is netjer") ||
    s.includes("what is ka") ||
    s.includes("what is khat") ||
    s.includes("what is sesh") ||
    s.includes("what is shef") ||
    s.includes("what is seef") ||
    s.includes("what is hrp") ||
    s.includes("what is shms")
  );
}

function answerDefinition(q: string) {
  const s = normalize(q);

  if (s.includes("feather app") || s.includes("this app") || s.includes("way of the feather")) {
    return CANON.appDefinition;
  }

  // overlay
  for (const k of Object.keys(CANON.overlay)) {
    if (s.includes(k.toLowerCase())) return `${k}: ${(CANON.overlay as any)[k]}`;
  }

  // terms
  for (const k of Object.keys(CANON.terms)) {
    if (s.includes(k.toLowerCase())) return `${k}: ${(CANON.terms as any)[k]}`;
  }

  return CANON.appDefinition;
}

function isRelationshipQuestion(q: string) {
  const s = normalize(q);
  const relMarkers = [
    "mother",
    "mum",
    "father",
    "dad",
    "husband",
    "wife",
    "partner",
    "boyfriend",
    "girlfriend",
    "friend",
    "family",
    "relationship",
    "argue",
    "fight",
    "conflict",
    "in-laws",
    "sister",
    "brother",
  ];
  return relMarkers.some((m) => s.includes(m));
}

function isDailyRoutineQuestion(q: string) {
  const s = normalize(q);
  return (
    s.includes("start my day") ||
    s.includes("morning") ||
    s.includes("unbothered") ||
    s.includes("with ease") ||
    s.includes("daily") ||
    s.includes("most days") ||
    s.includes("routine") ||
    s.includes("wake up") ||
    s.includes("waking")
  );
}

function classifyRelationshipPattern(q: string): Pattern {
  const s = normalize(q);

  const triangleMarkers = ["between", "my mother and", "my mum and", "my husband and", "my wife and", "my partner and", "my dad and", "my father and"];
  const hasTriangle =
    triangleMarkers.some((m) => s.includes(m)) ||
    (s.includes("mother") && (s.includes("husband") || s.includes("wife") || s.includes("partner"))) ||
    (s.includes("parent") && s.includes("partner"));

  const truthMarkers = ["denies", "gaslight", "that didn't happen", "making it up", "twist", "rewrite", "lies", "lying"];
  const hasTruth = truthMarkers.some((m) => s.includes(m));

  const boundaryMarkers = ["boundary", "invade", "control", "disrespect", "crossed the line", "won't stop", "keeps coming", "showing up", "telling me what"];
  const hasBoundary = boundaryMarkers.some((m) => s.includes(m));

  const fairMarkers = ["i do everything", "always me", "i carry", "i'm tired", "exhausted", "all on me", "not fair", "unbalanced"];
  const hasFair = fairMarkers.some((m) => s.includes(m));

  const overloadMarkers = ["too much", "overwhelmed", "flooded", "panic", "shut down", "numb", "can't think", "explode", "screaming", "yelling"];
  const hasOverload = overloadMarkers.some((m) => s.includes(m));

  if (hasTriangle) return "triangle";
  if (hasTruth) return "truth_distortion";
  if (hasBoundary) return "boundary";
  if (hasFair) return "fair_share";
  if (hasOverload) return "proportion_overload";
  return "unclear";
}

function prettyGoal(g: Goal | undefined) {
  if (!g || g === "unknown") return "unknown";
  return g.replaceAll("_", " ");
}

function buildDailyResolve(s: Session) {
  const sesh = [
    `- Question: ${s.originalQuestion}`,
    s.dailyTiming ? `- Timing: ${s.dailyTiming === "today" ? "today" : "most days"}` : null,
    s.dailyDisturbance ? `- Main disturbance: ${s.dailyDisturbance.replaceAll("_", " ")}` : null,
    s.bodyLoc ? `- Body: ${s.bodyLoc}${s.bodyQual ? ` (${s.bodyQual})` : ""}` : null,
    s.goal ? `- Goal: ${prettyGoal(s.goal)}` : null,
  ].filter(Boolean) as string[];

  // Seef (testable) based on disturbance
  let seef = "One possible pattern is: a small morning mismatch between load and capacity (proportion).";
  if (s.dailyDisturbance === "phone") seef = "One possible pattern is: early phone input hijacks attention (proportion + timing).";
  if (s.dailyDisturbance === "thoughts") seef = "One possible pattern is: thoughts start running before the body is steady (timing + truth).";
  if (s.dailyDisturbance === "people") seef = "One possible pattern is: other people’s demands arrive before your own line is set (fair-share + boundary).";
  if (s.dailyDisturbance === "pressure") seef = "One possible pattern is: urgency creates tight focus and removes choice (right-size needed).";
  if (s.dailyDisturbance === "body_fatigue") seef = "One possible pattern is: body energy is low, but the plan assumes high output (proportion).";

  const hrp =
    "- Truth: name the morning in one clean sentence (no drama).\n" +
    "- Fair-share: what belongs to you first, before others?\n" +
    "- Right-size: one tiny move that makes today steadier.";

  // Shms options (no commands)
  const shms =
    "Shms (pick one, <15 min):\n" +
    "A) 2-minute body reset, then write ONE line: “Today I will do ____.”\n" +
    "B) Phone gate: delay phone for 10 minutes; do water + wash + one breath cycle.\n" +
    "C) Small start: do 5 minutes on the easiest first step, then stop.\n" +
    "D) Boundary line: one sentence to others: “I’ll reply after I settle my morning.”";

  return (
    `Sesh (knowns):\n${sesh.join("\n")}\n\n` +
    `Shef (missing/unclear):\n- None needed to offer a small next step.\n\n` +
    `Seef (pattern — test, not verdict):\n- ${seef}\n\n` +
    `Hrp (Ma’at direction):\n${hrp}\n\n` +
    `${shms}\n\n` +
    `Feather point: choose the option that makes your ${s.bodyLoc ?? "body"} feel steadier, and keeps the step right-sized.\n\n` +
    CANON.guardrailsShort
  );
}

function buildRelationshipResolve(s: Session) {
  const sesh = [
    `- Question: ${s.originalQuestion}`,
    s.relTime ? `- When: ${s.relTime.replaceAll("_", " ")}` : null,
    s.relRole ? `- Your role: ${s.relRole.replaceAll("_", " ")}` : null,
    s.bodyLoc ? `- Body: ${s.bodyLoc}${s.bodyQual ? ` (${s.bodyQual})` : ""}` : null,
    s.goal ? `- Goal: ${prettyGoal(s.goal)}` : null,
    s.relRepeating ? `- Pattern frequency: ${s.relRepeating.replaceAll("_", " ")}` : null,
  ].filter(Boolean) as string[];

  const p = s.relPattern ?? "unclear";
  const pLabel =
    p === "triangle"
      ? "Triangle pressure"
      : p === "boundary"
      ? "Boundary breach"
      : p === "fair_share"
      ? "Fair-share imbalance"
      : p === "truth_distortion"
      ? "Truth distortion"
      : p === "proportion_overload"
      ? "Proportion overload"
      : "Unclear pattern";

  const isfet =
    p === "triangle"
      ? "If nothing changes, you get pulled into the middle again. Short calm, then repeat conflict. Resentment builds."
      : p === "boundary"
      ? "If nothing changes, lines stay blurred. People push harder or you shut down. Heat rises over time."
      : p === "fair_share"
      ? "If nothing changes, you carry more than your share. Depletion grows, then anger or numbness later."
      : p === "truth_distortion"
      ? "If nothing changes, reality gets fuzzy. Self-trust drops, and repair becomes harder."
      : p === "proportion_overload"
      ? "If nothing changes, bodies stay flooded. Talks become explosions or shutdown."
      : "If nothing changes, the same confusion repeats because the missing piece stays missing.";

  const hrp =
    "- Truth: name what happened in one clean sentence (no mind-reading).\n" +
    "- Fair-share: return responsibility to the right person (don’t carry two adults).\n" +
    "- Right-size: smallest move that lowers heat today.";

  const options =
    "Options with costs:\n" +
    "A) Jump in and manage them\n- Cost: you become the buffer.\n- Likely result: short calm, repeat pattern.\n\n" +
    "B) Step out of the triangle/pattern\n- Cost: discomfort now.\n- Likely result: responsibility returns; heat reduces over time.\n\n" +
    "C) One timed truth (after calm)\n- Cost: courage + timing.\n- Likely result: clarity increases; repair becomes possible.";

  const shms =
    "Shms (pick one, <15 min):\n" +
    "A) Write one calm boundary sentence you can repeat (no blame).\n" +
    "B) Timing rule: no serious talk while bodies are tight/heat is high.\n" +
    "C) Send one neutral line that lowers heat (not a solution).";

  return (
    `Sesh (knowns):\n${sesh.join("\n")}\n\n` +
    `Seef (pattern — test, not verdict):\n- ${pLabel}\n\n` +
    `Isfet track (likely cost if unchanged):\n- ${isfet}\n\n` +
    `Hrp (Ma’at direction):\n${hrp}\n\n` +
    `${options}\n\n` +
    `${shms}\n\n` +
    `Feather point: the Ma’at-leaning path usually reduces triangle pressure, increases truth, returns responsibility, and stays right-sized for today.\n\n` +
    CANON.guardrailsShort
  );
}

type Choice = { id: string; label: string; onPick: () => void };

function ButtonRow({ choices }: { choices: Choice[] }) {
  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
      {choices.map((c) => (
        <button
          key={c.id}
          onClick={c.onPick}
          style={{
            padding: "8px 10px",
            borderRadius: 999,
            border: "1px solid #ccc",
            background: "#fff",
            cursor: "pointer",
            fontSize: 14,
          }}
        >
          {c.label}
        </button>
      ))}
    </div>
  );
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

  const [session, setSession] = useState<Session>({
    flow: "none",
    step: "none",
    originalQuestion: "",
  });

  const canSend = useMemo(() => input.trim().length > 0, [input]);

  function push(role: Role, text: string) {
    setMessages((m) => [...m, { role, text }]);
  }

  function resetSession() {
    setSession({ flow: "none", step: "none", originalQuestion: "" });
  }

  function beginSession(q: string) {
    // Definitions answer immediately
    if (looksLikeDefinitionQuestion(q)) {
      push("app", answerDefinition(q) + "\n\n" + CANON.guardrailsShort);
      return;
    }

    // Relationship gets its own flow
    if (isRelationshipQuestion(q)) {
      const pat = classifyRelationshipPattern(q);
      setSession({
        flow: "relationship",
        step: "rel_time",
        originalQuestion: q,
        relPattern: pat,
        relRole: "unclear",
        relRepeating: "unclear",
        goal: "unknown",
      });
      push("app", "Quick check: when did it happen?");
      return;
    }

    // Daily routine questions: guided daily flow
    if (isDailyRoutineQuestion(q) || true) {
      // Default to daily for beta stability (works for most)
      setSession({
        flow: "daily",
        step: "daily_timing",
        originalQuestion: q,
        goal: "unknown",
        dailyDisturbance: "unclear",
      });
      push("app", "Is this about today, or most days?");
      return;
    }
  }

  function send() {
    const text = input.trim();
    if (!text) return;

    push("user", text);
    setInput("");

    if (session.flow === "none") {
      beginSession(text);
      return;
    }

    // If user types during a button-step, we treat it as “extra detail”
    push("app", "Got it. (Extra detail noted.) Use the buttons below to continue.");
  }

  // Build button choices based on step
  let choices: Choice[] = [];

  // DAILY FLOW
  if (session.flow === "daily") {
    if (session.step === "daily_timing") {
      choices = [
        {
          id: "today",
          label: "Today",
          onPick: () => {
            setSession((s) => ({ ...s, dailyTiming: "today", step: "daily_disturbance" }));
            push("app", "What’s the main thing that bothers your start?");
          },
        },
        {
          id: "most",
          label: "Most days",
          onPick: () => {
            setSession((s) => ({ ...s, dailyTiming: "most_days", step: "daily_disturbance" }));
            push("app", "What’s the main thing that bothers your start?");
          },
        },
      ];
    }

    if (session.step === "daily_disturbance") {
      choices = [
        {
          id: "thoughts",
          label: "Thoughts",
          onPick: () => {
            setSession((s) => ({ ...s, dailyDisturbance: "thoughts", step: "daily_body_loc" }));
            push("app", "Quick body check: where do you feel it most?");
          },
        },
        {
          id: "people",
          label: "People",
          onPick: () => {
            setSession((s) => ({ ...s, dailyDisturbance: "people", step: "daily_body_loc" }));
            push("app", "Quick body check: where do you feel it most?");
          },
        },
        {
          id: "phone",
          label: "Phone",
          onPick: () => {
            setSession((s) => ({ ...s, dailyDisturbance: "phone", step: "daily_body_loc" }));
            push("app", "Quick body check: where do you feel it most?");
          },
        },
        {
          id: "pressure",
          label: "Pressure",
          onPick: () => {
            setSession((s) => ({ ...s, dailyDisturbance: "pressure", step: "daily_body_loc" }));
            push("app", "Quick body check: where do you feel it most?");
          },
        },
        {
          id: "fatigue",
          label: "Body fatigue",
          onPick: () => {
            setSession((s) => ({ ...s, dailyDisturbance: "body_fatigue", step: "daily_body_loc" }));
            push("app", "Quick body check: where do you feel it most?");
          },
        },
      ];
    }

    if (session.step === "daily_body_loc") {
      choices = [
        {
          id: "chest",
          label: "Chest",
          onPick: () => {
            setSession((s) => ({ ...s, bodyLoc: "chest", step: "daily_body_qual" }));
            push("app", "And what’s the main body signal?");
          },
        },
        {
          id: "belly",
          label: "Belly / solar plexus",
          onPick: () => {
            setSession((s) => ({ ...s, bodyLoc: "belly", step: "daily_body_qual" }));
            push("app", "And what’s the main body signal?");
          },
        },
      ];
    }

    if (session.step === "daily_body_qual") {
      choices = [
        {
          id: "tight",
          label: "Tight",
          onPick: () => {
            setSession((s) => ({ ...s, bodyQual: "tight", step: "daily_goal" }));
            push("app", "What do you want most for your day-start?");
          },
        },
        {
          id: "open",
          label: "Open",
          onPick: () => {
            setSession((s) => ({ ...s, bodyQual: "open", step: "daily_goal" }));
            push("app", "What do you want most for your day-start?");
          },
        },
        {
          id: "numb",
          label: "Numb",
          onPick: () => {
            setSession((s) => ({ ...s, bodyQual: "numb", step: "daily_goal" }));
            push("app", "What do you want most for your day-start?");
          },
        },
        {
          id: "heat",
          label: "Heat",
          onPick: () => {
            setSession((s) => ({ ...s, bodyQual: "heat", step: "daily_goal" }));
            push("app", "What do you want most for your day-start?");
          },
        },
        {
          id: "neutral",
          label: "Neutral",
          onPick: () => {
            setSession((s) => ({ ...s, bodyQual: "neutral", step: "daily_goal" }));
            push("app", "What do you want most for your day-start?");
          },
        },
      ];
    }

    if (session.step === "daily_goal") {
      choices = [
        {
          id: "ease",
          label: "Ease",
          onPick: () => {
            const updated = { ...session, goal: "ease", step: "daily_resolve" as Step };
            setSession(updated);
            push("app", buildDailyResolve(updated));
            resetSession();
          },
        },
        {
          id: "focus",
          label: "Focus",
          onPick: () => {
            const updated = { ...session, goal: "focus", step: "daily_resolve" as Step };
            setSession(updated);
            push("app", buildDailyResolve(updated));
            resetSession();
          },
        },
        {
          id: "calm",
          label: "Calm",
          onPick: () => {
            const updated = { ...session, goal: "calm", step: "daily_resolve" as Step };
            setSession(updated);
            push("app", buildDailyResolve(updated));
            resetSession();
          },
        },
        {
          id: "discipline",
          label: "Discipline",
          onPick: () => {
            const updated = { ...session, goal: "discipline", step: "daily_resolve" as Step };
            setSession(updated);
            push("app", buildDailyResolve(updated));
            resetSession();
          },
        },
      ];
    }
  }

  // RELATIONSHIP FLOW
  if (session.flow === "relationship") {
    if (session.step === "rel_time") {
      choices = [
        {
          id: "breakfast",
          label: "Today (breakfast)",
          onPick: () => {
            setSession((s) => ({ ...s, relTime: "today_breakfast", step: "rel_role" }));
            push("app", "Your role in it?");
          },
        },
        {
          id: "phone",
          label: "Today (phone/text)",
          onPick: () => {
            setSession((s) => ({ ...s, relTime: "today_phone", step: "rel_role" }));
            push("app", "Your role in it?");
          },
        },
        {
          id: "yesterday",
          label: "Yesterday",
          onPick: () => {
            setSession((s) => ({ ...s, relTime: "yesterday", step: "rel_role" }));
            push("app", "Your role in it?");
          },
        },
        {
          id: "week",
          label: "This week",
          onPick: () => {
            setSession((s) => ({ ...s, relTime: "this_week", step: "rel_role" }));
            push("app", "Your role in it?");
          },
        },
        {
          id: "other",
          label: "Other",
          onPick: () => {
            setSession((s) => ({ ...s, relTime: "other", step: "rel_role" }));
            push("app", "Your role in it?");
          },
        },
      ];
    }

    if (session.step === "rel_role") {
      choices = [
        {
          id: "witness",
          label: "I witnessed it",
          onPick: () => {
            setSession((s) => ({ ...s, relRole: "witness", step: "rel_body_loc" }));
            push("app", "Quick body check: where do you feel it most?");
          },
        },
        {
          id: "involved",
          label: "I was involved",
          onPick: () => {
            setSession((s) => ({ ...s, relRole: "involved", step: "rel_body_loc" }));
            push("app", "Quick body check: where do you feel it most?");
          },
        },
        {
          id: "fix",
          label: "They want me to fix it",
          onPick: () => {
            setSession((s) => ({ ...s, relRole: "asked_to_fix", step: "rel_body_loc" }));
            push("app", "Quick body check: where do you feel it most?");
          },
        },
        {
          id: "unclear",
          label: "Not sure",
          onPick: () => {
            setSession((s) => ({ ...s, relRole: "unclear", step: "rel_body_loc" }));
            push("app", "Quick body check: where do you feel it most?");
          },
        },
      ];
    }

    if (session.step === "rel_body_loc") {
      choices = [
        {
          id: "chest",
          label: "Chest",
          onPick: () => {
            setSession((s) => ({ ...s, bodyLoc: "chest", step: "rel_body_qual" }));
            push("app", "And the main body signal?");
          },
        },
        {
          id: "belly",
          label: "Belly / solar plexus",
          onPick: () => {
            setSession((s) => ({ ...s, bodyLoc: "belly", step: "rel_body_qual" }));
            push("app", "And the main body signal?");
          },
        },
      ];
    }

    if (session.step === "rel_body_qual") {
      choices = [
        {
          id: "tight",
          label: "Tight",
          onPick: () => {
            setSession((s) => ({ ...s, bodyQual: "tight", step: "rel_goal" }));
            push("app", "What do you want most right now?");
          },
        },
        {
          id: "open",
          label: "Open",
          onPick: () => {
            setSession((s) => ({ ...s, bodyQual: "open", step: "rel_goal" }));
            push("app", "What do you want most right now?");
          },
        },
        {
          id: "numb",
          label: "Numb",
          onPick: () => {
            setSession((s) => ({ ...s, bodyQual: "numb", step: "rel_goal" }));
            push("app", "What do you want most right now?");
          },
        },
        {
          id: "heat",
          label: "Heat",
          onPick: () => {
            setSession((s) => ({ ...s, bodyQual: "heat", step: "rel_goal" }));
            push("app", "What do you want most right now?");
          },
        },
        {
          id: "neutral",
          label: "Neutral",
          onPick: () => {
            setSession((s) => ({ ...s, bodyQual: "neutral", step: "rel_goal" }));
            push("app", "What do you want most right now?");
          },
        },
      ];
    }

    if (session.step === "rel_goal") {
      choices = [
        {
          id: "peace",
          label: "Peace",
          onPick: () => {
            setSession((s) => ({ ...s, goal: "peace", step: "rel_repeating" }));
            push("app", "Is this a one-time event or repeating pattern?");
          },
        },
        {
          id: "fairness",
          label: "Fairness",
          onPick: () => {
            setSession((s) => ({ ...s, goal: "fairness", step: "rel_repeating" }));
            push("app", "Is this a one-time event or repeating pattern?");
          },
        },
        {
          id: "respect",
          label: "Respect",
          onPick: () => {
            setSession((s) => ({ ...s, goal: "respect", step: "rel_repeating" }));
            push("app", "Is this a one-time event or repeating pattern?");
          },
        },
        {
          id: "safety",
          label: "Safety",
          onPick: () => {
            setSession((s) => ({ ...s, goal: "safety", step: "rel_repeating" }));
            push("app", "Is this a one-time event or repeating pattern?");
          },
        },
        {
          id: "clarity",
          label: "Clarity",
          onPick: () => {
            setSession((s) => ({ ...s, goal: "clarity", step: "rel_repeating" }));
            push("app", "Is this a one-time event or repeating pattern?");
          },
        },
      ];
    }

    if (session.step === "rel_repeating") {
      choices = [
        {
          id: "one",
          label: "One-time",
          onPick: () => {
            const updated = { ...session, relRepeating: "one_time", step: "rel_resolve" as Step };
            setSession(updated);
            push("app", buildRelationshipResolve(updated));
            resetSession();
          },
        },
        {
          id: "rep",
          label: "Repeating",
          onPick: () => {
            const updated = { ...session, relRepeating: "repeating", step: "rel_resolve" as Step };
            setSession(updated);
            push("app", buildRelationshipResolve(updated));
            resetSession();
          },
        },
        {
          id: "unclear",
          label: "Not sure",
          onPick: () => {
            const updated = { ...session, relRepeating: "unclear", step: "rel_resolve" as Step };
            setSession(updated);
            push("app", buildRelationshipResolve(updated));
            resetSession();
          },
        },
      ];
    }
  }

  return (
    <main
      style={{
        padding: 20,
        maxWidth: 760,
        margin: "0 auto",
        fontFamily: "system-ui, -apple-system, Segoe UI, Roboto",
      }}
    >
      <h1 style={{ marginBottom: 6 }}>Way of the Feather</h1>
      <p style={{ marginTop: 0, color: "#444" }}>
        Plain language. Real life. Costs + balance. No commands.
      </p>

      <div
        style={{
          border: "1px solid #ddd",
          borderRadius: 12,
          padding: 12,
          minHeight: 340,
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
                maxWidth: "88%",
                background: msg.role === "user" ? "#111" : "#fff",
                color: msg.role === "user" ? "#fff" : "#111",
                border: msg.role === "user" ? "1px solid #111" : "1px solid #e6e6e6",
              }}
            >
              {msg.text}
            </div>
          </div>
        ))}

        {/* Button choices appear here when the session is awaiting a tap */}
        {choices.length > 0 && (
          <div style={{ marginTop: 6 }}>
            <ButtonRow choices={choices} />
          </div>
        )}
      </div>

      <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder='Type your question, then tap Send. Example: “How can I start my day with ease?”'
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
        Tip: After you tap Send, use the buttons to answer. You can still type extra details, but buttons keep it clean.
      </div>
    </main>
  );
}
