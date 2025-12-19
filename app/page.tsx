"use client";

import { useMemo, useState } from "react";

type Role = "user" | "app";
type Msg = { role: Role; text: string };

type Pattern = "triangle" | "boundary" | "fair_share" | "truth_distortion" | "proportion_overload" | "unknown";

type Session = {
  mode: "none" | "definition" | "life";
  originalQuestion: string;

  // Sesh
  timePlace?: string; // e.g. "this morning at breakfast"
  bodyLoc?: "chest" | "belly";
  bodyQual?: "tight" | "open" | "numb" | "heat" | "neutral";
  userRole?: "involved" | "witness" | "asked_to_fix" | "unknown";
  repeating?: "one_time" | "repeating" | "unknown";
  goal?: "peace" | "fairness" | "respect" | "safety" | "clarity" | "unknown";

  // analysis
  pattern?: Pattern;

  // flow
  awaiting?: "none" | "timePlace" | "bodyLoc" | "role" | "repeating" | "goal";
};

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
      "Ordering intelligence: truth, fair-share, and right-size in real life. Alignment is often detectable by steadier body signals and cleaner consequences.",
    Netjer:
      "The unchanging background-awareness. Not a person. Not your mind. (We don’t claim personal identity as Netjer.)",
    Ka: "The witness-channel: how experience registers without spin. Trainable. (After-body continuation is unknown.)",
    Khat: "The physical body. It senses, runs hormones/emotions, and ends at physical death.",
    Isfet:
      "Drift/distortion/incoherence. An alarm signal, not moral failure. Common signals: lurch, grind, static, numb, compulsion, rage spiral, avoidance fog.",
    Ra: "Manifest action/appearance: the visible deed, the daily cycle of doing.",
    Amen: "Hidden potential: the unmanifest seed.",
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
    s.includes("what is the feather app") ||
    s.includes("what is maat") ||
    s.includes("what is ma'at") ||
    s.includes("what is netjer") ||
    s.includes("what is isfet") ||
    s.includes("what is sesh") ||
    s.includes("what is shef") ||
    s.includes("what is seef") ||
    s.includes("what is hrp") ||
    s.includes("what is shms")
  );
}

function glossaryHit(q: string) {
  const s = normalize(q);
  // overlay keys
  for (const k of Object.keys(CANON.overlay)) {
    if (s.includes(k.toLowerCase())) return { kind: "overlay" as const, key: k };
  }
  // canon terms
  for (const k of Object.keys(CANON.terms)) {
    if (s.includes(k.toLowerCase())) return { kind: "term" as const, key: k };
  }
  return null;
}

function answerDefinition(q: string) {
  const s = normalize(q);

  if (s.includes("feather app") || s.includes("way of the feather") || s.includes("this app")) {
    return CANON.appDefinition;
  }

  const hit = glossaryHit(q);
  if (hit?.kind === "overlay") {
    const key = hit.key as keyof typeof CANON.overlay;
    return `${key}: ${CANON.overlay[key]}`;
  }
  if (hit?.kind === "term") {
    const key = hit.key as keyof typeof CANON.terms;
    return `${key}: ${CANON.terms[key]}`;
  }

  return CANON.appDefinition;
}

function detectBodyLoc(text: string): "chest" | "belly" | null {
  const s = normalize(text);
  if (s.includes("chest")) return "chest";
  if (s.includes("belly") || s.includes("solar") || s.includes("plexus") || s.includes("stomach")) return "belly";
  return null;
}

function detectBodyQual(text: string): Session["bodyQual"] | null {
  const s = normalize(text);
  if (s.includes("tight") || s.includes("tense")) return "tight";
  if (s.includes("open") || s.includes("calm") || s.includes("steady")) return "open";
  if (s.includes("numb") || s.includes("blank") || s.includes("shutdown")) return "numb";
  if (s.includes("heat") || s.includes("hot") || s.includes("burn")) return "heat";
  if (s.includes("neutral") || s.includes("ok")) return "neutral";
  return null;
}

function detectRepeating(text: string): Session["repeating"] | null {
  const s = normalize(text);
  if (s.includes("repeating") || s.includes("always") || s.includes("often") || s.includes("many times") || s.includes("every")) {
    return "repeating";
  }
  if (s.includes("one time") || s.includes("once") || s.includes("first time") || s.includes("rare")) {
    return "one_time";
  }
  return null;
}

function detectGoal(text: string): Session["goal"] | null {
  const s = normalize(text);
  if (s.includes("peace") || s.includes("calm")) return "peace";
  if (s.includes("fair") || s.includes("justice")) return "fairness";
  if (s.includes("respect")) return "respect";
  if (s.includes("safe") || s.includes("safety")) return "safety";
  if (s.includes("clarity") || s.includes("clear")) return "clarity";
  return null;
}

function detectUserRole(originalQ: string, text: string): Session["userRole"] {
  const s = normalize(originalQ + " " + text);
  if (s.includes("they asked me") || s.includes("asked me to") || s.includes("fix") || s.includes("mediate")) return "asked_to_fix";
  if (s.includes("i was there") || s.includes("i joined") || s.includes("i said") || s.includes("i yelled") || s.includes("i argued")) return "involved";
  if (s.includes("i saw") || s.includes("i watched") || s.includes("i heard") || s.includes("witness")) return "witness";
  return "unknown";
}

function detectTimePlace(text: string): string | null {
  // We keep it simple: if they mention a time reference or a place-ish phrase, accept it.
  const s = text.trim();
  if (!s) return null;

  const low = normalize(s);
  const timeWords = ["today", "yesterday", "this morning", "this evening", "last night", "at", "pm", "am", "breakfast", "lunch", "dinner", "meeting"];
  const placeWords = ["home", "house", "kitchen", "car", "work", "office", "school", "phone", "text", "whatsapp", "breakfast", "table"];

  const hasTime = timeWords.some((w) => low.includes(w));
  const hasPlace = placeWords.some((w) => low.includes(w));

  // If they answered with a short phrase like "this morning at breakfast", it qualifies.
  if (hasTime || hasPlace || low.length >= 8) return s;
  return null;
}

function classifyRelationshipPattern(q: string): Pattern {
  const s = normalize(q);

  // Triangle: multiple family roles, "between", "my X and my Y"
  const triangleMarkers = ["between", "my mother and", "my mum and", "my husband and", "my wife and", "my partner and", "my dad and", "my father and"];
  const hasTriangle =
    triangleMarkers.some((m) => s.includes(m)) ||
    (s.includes("mother") && (s.includes("husband") || s.includes("wife") || s.includes("partner"))) ||
    (s.includes("parent") && s.includes("partner"));

  // Boundary: control/intrusion/disrespect
  const boundaryMarkers = ["boundary", "invade", "control", "disrespect", "crossed the line", "won't stop", "keeps coming", "showing up", "telling me what"];
  const hasBoundary = boundaryMarkers.some((m) => s.includes(m));

  // Fair-share: overload, carrying, doing everything
  const fairMarkers = ["i do everything", "always me", "i carry", "i'm tired", "exhausted", "all on me", "not fair", "unbalanced"];
  const hasFair = fairMarkers.some((m) => s.includes(m));

  // Truth distortion: denial, gaslight, rewrite
  const truthMarkers = ["denies", "gaslight", "that didn't happen", "making it up", "twist", "rewrite", "lies", "lying"];
  const hasTruth = truthMarkers.some((m) => s.includes(m));

  // Proportion overload: heat/flood/shutdown
  const overloadMarkers = ["too much", "overwhelmed", "flooded", "panic", "shut down", "numb", "can't think", "explode", "screaming", "yelling"];
  const hasOverload = overloadMarkers.some((m) => s.includes(m));

  if (hasTriangle) return "triangle";
  if (hasTruth) return "truth_distortion";
  if (hasBoundary) return "boundary";
  if (hasFair) return "fair_share";
  if (hasOverload) return "proportion_overload";
  return "unknown";
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
  ];
  return relMarkers.some((m) => s.includes(m));
}

function buildRelationshipResponse(session: Session) {
  const A = "Person A";
  const B = "Person B";

  const seshLines: string[] = [];
  seshLines.push(`- Situation: ${session.originalQuestion.trim()}`);
  if (session.timePlace) seshLines.push(`- Time/place: ${session.timePlace}`);
  if (session.userRole && session.userRole !== "unknown") seshLines.push(`- Your role: ${session.userRole.replaceAll("_", " ")}`);
  if (session.bodyLoc) {
    const qual = session.bodyQual ? ` (${session.bodyQual})` : "";
    seshLines.push(`- Body: ${session.bodyLoc}${qual}`);
  }

  const pattern = session.pattern ?? "unknown";

  const patternLabel =
    pattern === "triangle"
      ? "Triangle pressure"
      : pattern === "boundary"
      ? "Boundary breach"
      : pattern === "fair_share"
      ? "Fair-share imbalance"
      : pattern === "truth_distortion"
      ? "Truth distortion"
      : pattern === "proportion_overload"
      ? "Proportion overload"
      : "Unclear pattern";

  const isfetTrajectory =
    pattern === "triangle"
      ? "If nothing changes, you get pulled into the middle again. Short calm, then the same fight repeats. Resentment builds."
      : pattern === "boundary"
      ? "If nothing changes, lines stay blurred. People push harder or you shut down. Heat rises over time."
      : pattern === "fair_share"
      ? "If nothing changes, you carry more than your share. You get depleted, then anger or numbness shows up later."
      : pattern === "truth_distortion"
      ? "If nothing changes, reality gets fuzzy. Self-trust drops, and the conflict becomes harder to repair."
      : pattern === "proportion_overload"
      ? "If nothing changes, the nervous system stays flooded. Conversations turn into explosions or total shutdown."
      : "If nothing changes, the same confusion repeats because the missing piece stays missing.";

  // Ma’at direction (always the same 3 checks, in plain language)
  const maatDirection = [
    "- Truth: name one clean sentence about what happened (no mind-reading).",
    "- Fair-share: return responsibility to the right person (don’t carry two adults).",
    "- Right-size: choose the smallest move that lowers heat today.",
  ].join("\n");

  // Options + costs
  const optionA =
    "Option A — Jump in and manage it\n" +
    "- Cost: you become the buffer. People rely on you instead of owning their part.\n" +
    "- Likely result: short calm, repeat pattern (Isfet returns).";

  const optionB =
    "Option B — Step out of the triangle / pattern\n" +
    "- Cost: discomfort now. Someone may be unhappy with you briefly.\n" +
    "- Likely result: responsibility moves back where it belongs. Heat reduces over time.";

  const optionC =
    "Option C — One timed truth (after bodies are calmer)\n" +
    "- Cost: courage + timing. It may feel awkward at first.\n" +
    "- Likely result: clarity increases. Repair becomes possible, or boundaries become clear.";

  // Micro-actions (Shms) under 15 min
  const shms =
    "Shms (smallest move, <15 min — pick one):\n" +
    "1) Write one calm boundary sentence you can repeat (no blame).\n" +
    "2) Make a timing rule: no serious talk while chest/belly is tight/heat is high.\n" +
    "3) Send one neutral line that lowers heat (not a solution).";

  const closing =
    "Feather point: the Ma’at-leaning path is usually the one that reduces triangle pressure, increases truth, returns responsibility, and stays right-sized for today.\n\n" +
    CANON.guardrailsShort;

  return (
    `Sesh (what we know):\n${seshLines.join("\n")}\n\n` +
    `Seef (pattern — test, not verdict):\n- ${patternLabel}\n\n` +
    `Isfet track (where it tends to go):\n- ${isfetTrajectory}\n\n` +
    `Hrp (Ma’at direction):\n${maatDirection}\n\n` +
    `Options with costs:\n${optionA}\n\n${optionB}\n\n${optionC}\n\n` +
    `${shms}\n\n` +
    closing
  );
}

function nextGap(session: Session): Session["awaiting"] {
  // Minimum needed to avoid generic looping:
  // - time/place (one anchor)
  // - body location (regulator)
  // Then optionally: goal OR repeating (only one more question)
  if (!session.timePlace) return "timePlace";
  if (!session.bodyLoc) return "bodyLoc";
  if (!session.goal || session.goal === "unknown") return "goal";
  return "none";
}

function promptForGap(gap: Session["awaiting"]) {
  switch (gap) {
    case "timePlace":
      return "First, one anchor: when/where did it happen? (example: “this morning at breakfast”, “yesterday on the phone”)";
    case "bodyLoc":
      return "Where do you feel it most right now — chest or belly/solar plexus? (You can add: tight / open / numb / heat)";
    case "goal":
      return "What do you want most right now: peace, fairness, respect, safety, or clarity?";
    case "role":
      return "Were you involved, a witness, or being asked to fix it?";
    case "repeating":
      return "Is this a one-time event or repeating pattern?";
    default:
      return "";
  }
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
    mode: "none",
    originalQuestion: "",
    awaiting: "none",
  });

  const canSend = useMemo(() => input.trim().length > 0, [input]);

  function pushApp(text: string) {
    setMessages((m) => [...m, { role: "app", text }]);
  }

  function pushUser(text: string) {
    setMessages((m) => [...m, { role: "user", text }]);
  }

  function resetSession() {
    setSession({ mode: "none", originalQuestion: "", awaiting: "none" });
  }

  function beginLifeSession(q: string) {
    const rel = isRelationshipQuestion(q);
    const pattern = rel ? classifyRelationshipPattern(q) : "unknown";
    const initial: Session = {
      mode: "life",
      originalQuestion: q,
      awaiting: "timePlace",
      userRole: "unknown",
      repeating: "unknown",
      goal: "unknown",
      pattern,
    };
    setSession(initial);
    pushApp(promptForGap("timePlace"));
  }

  function integrateAnswerIntoSession(ans: string, current: Session): Session {
    const updated: Session = { ...current };

    // Always try to extract signals, even if awaiting something else
    const loc = detectBodyLoc(ans);
    if (loc) updated.bodyLoc = loc;
    const qual = detectBodyQual(ans);
    if (qual) updated.bodyQual = qual;
    const rep = detectRepeating(ans);
    if (rep) updated.repeating = rep;
    const goal = detectGoal(ans);
    if (goal) updated.goal = goal;

    // Primary awaited gap handling
    if (current.awaiting === "timePlace" && !updated.timePlace) {
      const tp = detectTimePlace(ans);
      if (tp) updated.timePlace = tp;
    }
    if (current.awaiting === "bodyLoc" && !updated.bodyLoc) {
      // handled above; if still missing, it stays missing
    }
    if (current.awaiting === "goal" && (!updated.goal || updated.goal === "unknown")) {
      // handled above; if still unknown, it stays unknown
    }

    // Derive user role lightly
    updated.userRole = detectUserRole(updated.originalQuestion, ans);

    // Determine next gap
    updated.awaiting = nextGap(updated);

    return updated;
  }

  function resolveIfReady(updated: Session) {
    if (updated.awaiting !== "none") return;

    // Build response
    if (isRelationshipQuestion(updated.originalQuestion)) {
      pushApp(buildRelationshipResponse(updated));
      // Keep session but mark complete by setting awaiting none (already none). User can ask a new question.
      pushApp("If you want, paste one short follow-up detail and I’ll refine the options (still no commands).");
      resetSession();
      return;
    }

    // Non-relationship life question: still provide a simple Feather structure
    const seshLines = [
      `- Situation: ${updated.originalQuestion.trim()}`,
      updated.timePlace ? `- Time/place: ${updated.timePlace}` : null,
      updated.bodyLoc ? `- Body: ${updated.bodyLoc}${updated.bodyQual ? ` (${updated.bodyQual})` : ""}` : null,
      updated.goal && updated.goal !== "unknown" ? `- Goal: ${updated.goal}` : null,
    ].filter(Boolean) as string[];

    const response =
      `Sesh (what we know):\n${seshLines.join("\n")}\n\n` +
      `Seef (pattern — test):\n- One possibility is a proportion mismatch (too much load for the moment). Let’s test by choosing a smallest move.\n\n` +
      `Hrp (Ma’at direction):\n- Truth: name one clean sentence.\n- Fair-share: what belongs to you vs not-you?\n- Right-size: smallest move today.\n\n` +
      `Shms (smallest move, <15 min — pick one):\n` +
      `1) Write one sentence that names the next step.\n` +
      `2) Remove one extra task for today.\n` +
      `3) Do a 2-minute reset, then take one small action.\n\n` +
      CANON.guardrailsShort;

    pushApp(response);
    resetSession();
  }

  function handleSend() {
    const text = input.trim();
    if (!text) return;

    // show the user's message once (prevents duplicates)
    pushUser(text);
    setInput("");

    // If no active session, decide mode
    if (session.mode === "none") {
      if (looksLikeDefinitionQuestion(text)) {
        const a = answerDefinition(text);
        pushApp(a + "\n\n" + CANON.guardrailsShort);
        return;
      }
      beginLifeSession(text);
      return;
    }

    // Active life session: integrate answer and continue
    if (session.mode === "life") {
      const updated = integrateAnswerIntoSession(text, session);

      // acknowledge intake (prevents “ignored answer” feeling)
      pushApp("Got it. I’m taking that in.");

      setSession(updated);

      if (updated.awaiting !== "none") {
        pushApp(promptForGap(updated.awaiting));
        return;
      }

      // ready to resolve
      resolveIfReady(updated);
      return;
    }

    // Fallback
    pushApp("I’m not sure what mode I’m in. Please ask your question again in one sentence.");
    resetSession();
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
          minHeight: 320,
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
      </div>

      <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder='Try: "My mother and husband fought this morning." or "What is Ma’at?"'
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
          onClick={handleSend}
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
        Tip: If you ask “what is Sesh?” you get a definition. If you ask a relationship question, you get pattern + costs + Ma’at direction.
      </div>
    </main>
  );
}
