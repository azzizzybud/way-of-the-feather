"use client";

import { useMemo, useState } from "react";

type Role = "user" | "app";
type Msg = { role: Role; text: string };

type Flow = "none" | "definition" | "daily" | "relationship";

type BodyLoc = "chest" | "belly";
type BodyQual = "tight" | "open" | "numb" | "heat" | "neutral";

type DailyDisturbance = "thoughts" | "people" | "phone" | "pressure" | "body_fatigue" | "unclear";
type DailyTiming = "today" | "most_days";

type Goal =
  | "ease"
  | "focus"
  | "calm"
  | "discipline"
  | "peace"
  | "fairness"
  | "respect"
  | "safety"
  | "clarity"
  | "unknown";

type Pattern = "triangle" | "boundary" | "fair_share" | "truth_distortion" | "proportion_overload" | "unclear";

type Step =
  | "none"
  // daily
  | "daily_timing"
  | "daily_disturbance"
  | "daily_body_loc"
  | "daily_body_qual"
  | "daily_goal"
  | "daily_done"
  // relationship
  | "rel_time"
  | "rel_role"
  | "rel_body_loc"
  | "rel_body_qual"
  | "rel_goal"
  | "rel_repeating"
  | "rel_done";

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
  relTime?: "today_breakfast" | "today_phone" | "yesterday" | "this_week" | "other";
  relRole?: "involved" | "witness" | "asked_to_fix" | "unclear";
  relRepeating?: "one_time" | "repeating" | "unclear";
  relPattern?: Pattern;
};

const CANON = {
  appDefinition:
    "Way of the Feather is a plain-language clarity app. You ask a real-life question, it asks a few focused follow-ups, then it shows balanced options (without telling you what to do).",
  guardrailsShort:
    "Note: This app doesn’t give commands, doesn’t pretend certainty, and will say “I don’t know” if there isn’t enough to answer cleanly.",
  terms: {
    "Ma’at": "Balance in real life: truth, fair-share, and right-size.",
    Isfet: "Drift/chaos signal (not moral failure): escalation, numbness, looping, pressure fog.",
    Netjer: "Unchanging background-awareness (not a person, not your mind).",
    Ka: "Witness-channel; trainable clarity.",
    Khat: "The physical body.",
    Sesh: "Knowns (facts + signals).",
    Shef: "Missing/unclear pieces.",
    Seef: "Emerging pattern (testable).",
    Hrp: "Balanced direction.",
    Shms: "Small action.",
  } as Record<string, string>,
};

function normalize(s: string) {
  return s.trim().toLowerCase();
}

function looksLikeNewQuestion(text: string) {
  const s = normalize(text);
  return (
    s.endsWith("?") ||
    s.startsWith("how ") ||
    s.startsWith("what ") ||
    s.startsWith("why ") ||
    s.startsWith("when ") ||
    s.startsWith("where ") ||
    s.startsWith("can ") ||
    s.startsWith("should ")
  );
}

function looksLikeDefinitionQuestion(q: string) {
  const s = normalize(q);
  return (
    s.startsWith("what is") ||
    s.startsWith("whats") ||
    s.startsWith("what’s") ||
    s.startsWith("define") ||
    s.startsWith("explain") ||
    s.includes("what is this app") ||
    s.includes("what is feather app") ||
    s.includes("way of the feather") ||
    Object.keys(CANON.terms).some((k) => s.includes(k.toLowerCase()))
  );
}

function answerDefinition(q: string) {
  const s = normalize(q);
  if (s.includes("feather app") || s.includes("this app") || s.includes("way of the feather")) {
    return CANON.appDefinition;
  }
  for (const k of Object.keys(CANON.terms)) {
    if (s.includes(k.toLowerCase())) return `${k}: ${CANON.terms[k]}`;
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
    s.includes("wake up") ||
    s.includes("waking") ||
    s.includes("daily") ||
    s.includes("most days") ||
    s.includes("routine") ||
    s.includes("unbothered") ||
    s.includes("with ease")
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

type OptionBlock = {
  label: "A" | "B" | "C";
  title: string;
  steps: string[];
  cost: string;
  why: string;
};

function formatOptions(bestLabel: "A" | "B" | "C", mirrorLine: string, options: OptionBlock[], microAction: string) {
  const blocks = options
    .map((o) => {
      return (
        `${o.label}) ${o.title}\n` +
        `- Steps: ${o.steps.join(" → ")}\n` +
        `- Cost: ${o.cost}\n`
      );
    })
    .join("\n");

  const best = options.find((o) => o.label === bestLabel)!;

  return (
    `${mirrorLine}\n\n` +
    `Here are 3 balanced options (you choose):\n\n` +
    `${blocks}\n` +
    `Why option ${bestLabel} is usually most balanced:\n- ${best.why}\n\n` +
    `Tiny move (<15 min): ${microAction}\n\n` +
    CANON.guardrailsShort
  );
}

// DAILY: simple mirror + 3 options
function buildDailyAnswer(s: Session) {
  const timing = s.dailyTiming === "today" ? "today" : "most days";
  const dist = (s.dailyDisturbance ?? "unclear").replaceAll("_", " ");
  const body = s.bodyLoc ? `${s.bodyLoc}${s.bodyQual ? ` (${s.bodyQual})` : ""}` : "unknown";
  const goal = (s.goal ?? "unknown").replaceAll("_", " ");

  const mirror = `I’m hearing: this is about ${timing}, the main trouble is ${dist}, your body says ${body}, and you want ${goal}.`;

  const A: OptionBlock = {
    label: "A",
    title: "Stabilize the body first (2–5 min)",
    steps: ["2 minutes slow breath", "water / wash face", "write one line: “Today I will ____.”"],
    cost: "Feels slow at first, but it reduces drift fast.",
    why: "When the body is tight/heat/numb, trying to “think your way out” usually fails. Regulation restores choice.",
  };

  const B: OptionBlock = {
    label: "B",
    title: "Reduce input (10 min gate)",
    steps: ["no phone for 10 minutes", "one simple physical task", "then open your day"],
    cost: "You delay messages, but you protect attention.",
    why: "If input hijacks attention early, balance comes from controlling the first inputs.",
  };

  const C: OptionBlock = {
    label: "C",
    title: "Small-start focus (5 min)",
    steps: ["pick easiest first step", "set 5-minute timer", "stop when it ends"],
    cost: "Not a full solution, but it breaks “stuck.”",
    why: "When pressure/thoughts are loud, one small action restores proportion and reduces fear fog.",
  };

  // Pick best based on what we know
  let best: "A" | "B" | "C" = "A";
  if (s.dailyDisturbance === "phone") best = "B";
  if (s.dailyDisturbance === "pressure" || s.dailyDisturbance === "thoughts") best = "C";
  if (s.bodyQual === "tight" || s.bodyQual === "heat" || s.bodyQual === "numb") best = "A";

  const micro =
    best === "A"
      ? "Do 6 slow breaths, then write ONE sentence: “Today I will ____.”"
      : best === "B"
      ? "Put the phone away for 10 minutes and do one tiny physical reset."
      : "Set a 5-minute timer and do the easiest first step only.";

  return formatOptions(best, mirror, [A, B, C], micro);
}

// RELATIONSHIPS: mirror + drift cost + 3 options
function buildRelationshipAnswer(s: Session) {
  const when = s.relTime ? s.relTime.replaceAll("_", " ") : "unknown time";
  const role = s.relRole ? s.relRole.replaceAll("_", " ") : "unclear role";
  const body = s.bodyLoc ? `${s.bodyLoc}${s.bodyQual ? ` (${s.bodyQual})` : ""}` : "unknown";
  const goal = (s.goal ?? "unknown").replaceAll("_", " ");
  const rep = s.relRepeating ? s.relRepeating.replaceAll("_", " ") : "unclear";

  const mirror = `I’m hearing: this happened ${when}, your role is ${role}, your body says ${body}, you want ${goal}, and it’s ${rep}.`;

  const p = s.relPattern ?? "unclear";
  const drift =
    p === "triangle"
      ? "If nothing changes, you get pulled into the middle again. Short calm, repeat fight."
      : p === "boundary"
      ? "If nothing changes, lines stay blurred. Heat rises or you shut down."
      : p === "fair_share"
      ? "If nothing changes, you carry too much. Resentment grows."
      : p === "truth_distortion"
      ? "If nothing changes, facts stay fuzzy. Repair becomes harder."
      : p === "proportion_overload"
      ? "If nothing changes, talks happen while flooded and escalate."
      : "If nothing changes, confusion repeats.";

  const A: OptionBlock = {
    label: "A",
    title: "Step in and manage it now",
    steps: ["mediate", "calm both sides", "try to solve"],
    cost: "Short calm, but you may become the permanent buffer.",
    why: "This often increases dependence on you and repeats the same cycle.",
  };

  const B: OptionBlock = {
    label: "B",
    title: "Step out of the middle (boundary + timing)",
    steps: ["no sides", "pause talk while heated", "offer calm talk later"],
    cost: "Uncomfortable now. Someone may be annoyed.",
    why: "This returns responsibility to the right people and reduces repeat cycles over time.",
  };

  const C: OptionBlock = {
    label: "C",
    title: "One clean truth later (timed, neutral)",
    steps: ["wait until calm", "say one neutral sentence", "make one small request"],
    cost: "Requires courage and timing.",
    why: "This increases clarity without escalation and prevents reality-drift.",
  };

  // Best pick rules
  let best: "A" | "B" | "C" = "B";
  if (p === "truth_distortion") best = "C";
  if (p === "proportion_overload") best = "B";
  if (p === "triangle") best = "B";

  const micro =
    best === "B"
      ? "Write one calm boundary sentence you can repeat (no blame)."
      : "Write one neutral truth sentence you can say later (no mind-reading).";

  // Add drift line without showing “internal model”
  const top = `${mirror}\n\nIf nothing changes, the likely cost is:\n- ${drift}`;

  return formatOptions(best, top, [A, B, C], micro);
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
        "I won’t tell you what to do — I’ll show balanced options.",
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
    // Definitions
    if (looksLikeDefinitionQuestion(q)) {
      push("app", answerDefinition(q));
      return;
    }

    // Relationships
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

    // Daily routine questions
    if (isDailyRoutineQuestion(q)) {
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

    // Default fallback: treat as daily-style (safe + useful)
    setSession({
      flow: "daily",
      step: "daily_timing",
      originalQuestion: q,
      goal: "unknown",
      dailyDisturbance: "unclear",
    });
    push("app", "Is this about today, or most days?");
  }

  function send() {
    const text = input.trim();
    if (!text) return;

    push("user", text);
    setInput("");

    // If mid-flow and user typed a NEW question, restart clean.
    if (session.flow !== "none" && looksLikeNewQuestion(text)) {
      push("app", "New question noticed. Starting fresh.");
      resetSession();
      beginSession(text);
      return;
    }

    // Start new session
    if (session.flow === "none") {
      beginSession(text);
      return;
    }

    // Otherwise: treat as optional detail; buttons drive the flow.
    push("app", "Got it. (Detail noted.) Use the buttons below to continue.");
  }

  // Button choices based on step
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
            push("app", "Main body signal?");
          },
        },
        {
          id: "belly",
          label: "Belly / solar plexus",
          onPick: () => {
            setSession((s) => ({ ...s, bodyLoc: "belly", step: "daily_body_qual" }));
            push("app", "Main body signal?");
          },
        },
      ];
    }

    if (session.step === "daily_body_qual") {
      choices = [
        { id: "tight", label: "Tight", onPick: () => (setSession((s) => ({ ...s, bodyQual: "tight", step: "daily_goal" })), push("app", "What do you want most?")) },
        { id: "open", label: "Open", onPick: () => (setSession((s) => ({ ...s, bodyQual: "open", step: "daily_goal" })), push("app", "What do you want most?")) },
        { id: "numb", label: "Numb", onPick: () => (setSession((s) => ({ ...s, bodyQual: "numb", step: "daily_goal" })), push("app", "What do you want most?")) },
        { id: "heat", label: "Heat", onPick: () => (setSession((s) => ({ ...s, bodyQual: "heat", step: "daily_goal" })), push("app", "What do you want most?")) },
        { id: "neutral", label: "Neutral", onPick: () => (setSession((s) => ({ ...s, bodyQual: "neutral", step: "daily_goal" })), push("app", "What do you want most?")) },
      ];
    }

    if (session.step === "daily_goal") {
      const setGoalAndResolve = (g: Goal) => {
        const updated: Session = { ...session, goal: g, step: "daily_done", flow: "daily" };
        setSession(updated);
        push("app", buildDailyAnswer(updated));
        resetSession();
      };

      choices = [
        { id: "ease", label: "Ease", onPick: () => setGoalAndResolve("ease") },
        { id: "focus", label: "Focus", onPick: () => setGoalAndResolve("focus") },
        { id: "calm", label: "Calm", onPick: () => setGoalAndResolve("calm") },
        { id: "discipline", label: "Discipline", onPick: () => setGoalAndResolve("discipline") },
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
        { id: "witness", label: "I witnessed it", onPick: () => (setSession((s) => ({ ...s, relRole: "witness", step: "rel_body_loc" })), push("app", "Body check: where do you feel it most?")) },
        { id: "involved", label: "I was involved", onPick: () => (setSession((s) => ({ ...s, relRole: "involved", step: "rel_body_loc" })), push("app", "Body check: where do you feel it most?")) },
        { id: "fix", label: "They want me to fix it", onPick: () => (setSession((s) => ({ ...s, relRole: "asked_to_fix", step: "rel_body_loc" })), push("app", "Body check: where do you feel it most?")) },
        { id: "unclear", label: "Not sure", onPick: () => (setSession((s) => ({ ...s, relRole: "unclear", step: "rel_body_loc" })), push("app", "Body check: where do you feel it most?")) },
      ];
    }

    if (session.step === "rel_body_loc") {
      choices = [
        { id: "chest", label: "Chest", onPick: () => (setSession((s) => ({ ...s, bodyLoc: "chest", step: "rel_body_qual" })), push("app", "Main body signal?")) },
        { id: "belly", label: "Belly / solar plexus", onPick: () => (setSession((s) => ({ ...s, bodyLoc: "belly", step: "rel_body_qual" })), push("app", "Main body signal?")) },
      ];
    }

    if (session.step === "rel_body_qual") {
      choices = [
        { id: "tight", label: "Tight", onPick: () => (setSession((s) => ({ ...s, bodyQual: "tight", step: "rel_goal" })), push("app", "What do you want most right now?")) },
        { id: "open", label: "Open", onPick: () => (setSession((s) => ({ ...s, bodyQual: "open", step: "rel_goal" })), push("app", "What do you want most right now?")) },
        { id: "numb", label: "Numb", onPick: () => (setSession((s) => ({ ...s, bodyQual: "numb", step: "rel_goal" })), push("app", "What do you want most right now?")) },
        { id: "heat", label: "Heat", onPick: () => (setSession((s) => ({ ...s, bodyQual: "heat", step: "rel_goal" })), push("app", "What do you want most right now?")) },
        { id: "neutral", label: "Neutral", onPick: () => (setSession((s) => ({ ...s, bodyQual: "neutral", step: "rel_goal" })), push("app", "What do you want most right now?")) },
      ];
    }

    if (session.step === "rel_goal") {
      choices = [
        { id: "peace", label: "Peace", onPick: () => (setSession((s) => ({ ...s, goal: "peace", step: "rel_repeating" })), push("app", "Is this a one-time event or repeating pattern?")) },
        { id: "fair", label: "Fairness", onPick: () => (setSession((s) => ({ ...s, goal: "fairness", step: "rel_repeating" })), push("app", "Is this a one-time event or repeating pattern?")) },
        { id: "respect", label: "Respect", onPick: () => (setSession((s) => ({ ...s, goal: "respect", step: "rel_repeating" })), push("app", "Is this a one-time event or repeating pattern?")) },
        { id: "safety", label: "Safety", onPick: () => (setSession((s) => ({ ...s, goal: "safety", step: "rel_repeating" })), push("app", "Is this a one-time event or repeating pattern?")) },
        { id: "clarity", label: "Clarity", onPick: () => (setSession((s) => ({ ...s, goal: "clarity", step: "rel_repeating" })), push("app", "Is this a one-time event or repeating pattern?")) },
      ];
    }

    if (session.step === "rel_repeating") {
      const resolve = (r: "one_time" | "repeating" | "unclear") => {
        const updated: Session = { ...session, relRepeating: r, step: "rel_done", flow: "relationship" };
        setSession(updated);
        push("app", buildRelationshipAnswer(updated));
        resetSession();
      };

      choices = [
        { id: "one", label: "One-time", onPick: () => resolve("one_time") },
        { id: "rep", label: "Repeating", onPick: () => resolve("repeating") },
        { id: "unsure", label: "Not sure", onPick: () => resolve("unclear") },
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
      <p style={{ marginTop: 0, color: "#444" }}>Plain language. Real life. Costs + balance. No commands.</p>

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
          placeholder='Type your question, tap Send, then use the buttons. Example: “How can I start my day with ease?”'
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
        Tip: After you tap Send, answer with the buttons. If you type a new question mid-flow, it starts fresh.
      </div>
    </main>
  );
}
