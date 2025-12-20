"use client";

import { useMemo, useState } from "react";

type Role = "user" | "app";
type Msg = { role: Role; text: string };

type Flow = "none" | "definition" | "daily" | "relationship" | "work" | "money" | "health";

type BodyLoc = "chest" | "belly" | "head" | "whole_body";
type BodyQual = "tight" | "heavy" | "numb" | "heat" | "neutral";

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
  | "stability"
  | "relief"
  | "clarity"
  | "progress"
  | "understanding"
  | "energy"
  | "unknown";

type Pattern = "triangle" | "boundary" | "fair_share" | "truth_distortion" | "proportion_overload" | "unclear";

type WorkScope = "too_much" | "conflict" | "unclear_priorities" | "avoidance" | "job_direction";
type WorkTiming = "today" | "this_week" | "ongoing";

type MoneyPressure = "not_enough_in" | "too_much_out" | "fear_uncertainty" | "avoided_decision" | "conflict_money";
type MoneyHorizon = "right_now" | "this_month" | "ongoing";

type HealthIssue = "energy_fatigue" | "pain_discomfort" | "stress_anxiety" | "sleep" | "habit";
type HealthPattern = "new" | "ongoing" | "comes_goes";

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
  | "rel_done"
  // work
  | "work_scope"
  | "work_timing"
  | "work_body_loc"
  | "work_body_qual"
  | "work_goal"
  | "work_done"
  // money
  | "money_pressure"
  | "money_horizon"
  | "money_body_loc"
  | "money_body_qual"
  | "money_goal"
  | "money_done"
  // health
  | "health_issue"
  | "health_pattern"
  | "health_body_loc"
  | "health_body_qual"
  | "health_goal"
  | "health_done";

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

  // work
  workScope?: WorkScope;
  workTiming?: WorkTiming;

  // money
  moneyPressure?: MoneyPressure;
  moneyHorizon?: MoneyHorizon;

  // health
  healthIssue?: HealthIssue;
  healthPattern?: HealthPattern;
};

const CANON = {
  appDefinition:
    "Way of the Feather is a plain-language clarity app. You ask a real-life question, it asks a few focused follow-ups, then it shows balanced options (without telling you what to do).",
  guardrailsShort:
    "Note: This app doesn’t give commands, doesn’t pretend certainty, and will say “I don’t know” if there isn’t enough to answer cleanly.",
  healthSafety:
    "Health note: This is not medical advice. If symptoms are severe, sudden, worsening, or you feel unsafe, seek professional help.",
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
    s.startsWith("should ") ||
    s.startsWith("help ")
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

function isWorkQuestion(q: string) {
  const s = normalize(q);
  const workMarkers = ["work", "job", "boss", "project", "deadline", "office", "colleague", "coworker", "career", "meeting"];
  return workMarkers.some((m) => s.includes(m));
}

function isMoneyQuestion(q: string) {
  const s = normalize(q);
  const moneyMarkers = ["money", "bills", "rent", "debt", "loan", "saving", "savings", "income", "salary", "pay", "spending", "budget"];
  return moneyMarkers.some((m) => s.includes(m));
}

function isHealthQuestion(q: string) {
  const s = normalize(q);
  const healthMarkers = ["health", "pain", "sick", "ill", "fatigue", "tired", "sleep", "anxiety", "stress", "panic", "headache", "stomach", "depressed"];
  return healthMarkers.some((m) => s.includes(m));
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

function formatOptions(header: string, bestLabel: "A" | "B" | "C", options: OptionBlock[], microAction: string, footer?: string) {
  const blocks = options
    .map(
      (o) =>
        `${o.label}) ${o.title}\n` +
        `- Steps: ${o.steps.join(" → ")}\n` +
        `- Cost: ${o.cost}\n`
    )
    .join("\n");

  const best = options.find((o) => o.label === bestLabel)!;

  return (
    `${header}\n\n` +
    `Here are 3 balanced options (you choose):\n\n` +
    `${blocks}\n` +
    `Why option ${bestLabel} is usually most balanced:\n- ${best.why}\n\n` +
    `Tiny move (<15 min): ${microAction}\n\n` +
    (footer ? footer + "\n\n" : "") +
    CANON.guardrailsShort
  );
}

// ---------- ANSWERS (no inner model shown) ----------

function buildDailyAnswer(s: Session) {
  const timing = s.dailyTiming === "today" ? "today" : "most days";
  const dist = (s.dailyDisturbance ?? "unclear").replaceAll("_", " ");
  const body = s.bodyLoc ? `${s.bodyLoc}${s.bodyQual ? ` (${s.bodyQual})` : ""}` : "unknown";
  const goal = (s.goal ?? "unknown").replaceAll("_", " ");

  const header = `I’m hearing: this is about ${timing}, the main trouble is ${dist}, your body says ${body}, and you want ${goal}.`;

  const A: OptionBlock = {
    label: "A",
    title: "Stabilize the body first (2–5 min)",
    steps: ["6 slow breaths", "water / wash face", "write one line: “Today I will ____.”"],
    cost: "Feels slow at first, but it reduces drift fast.",
    why: "When the body is tight/heat/numb, regulation restores choice and stops the spiral early.",
  };

  const B: OptionBlock = {
    label: "B",
    title: "Reduce input (10 min gate)",
    steps: ["no phone for 10 minutes", "one simple physical task", "then open your day"],
    cost: "You delay messages, but you protect attention.",
    why: "If inputs hijack attention early, balance comes from controlling the first inputs.",
  };

  const C: OptionBlock = {
    label: "C",
    title: "Small-start focus (5 min)",
    steps: ["pick easiest first step", "set 5-minute timer", "stop when it ends"],
    cost: "Not a full solution, but it breaks “stuck.”",
    why: "One small action restores proportion and reduces fear-fog more than thinking does.",
  };

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

  return formatOptions(header, best, [A, B, C], micro);
}

function buildRelationshipAnswer(s: Session) {
  const when = s.relTime ? s.relTime.replaceAll("_", " ") : "unknown time";
  const role = s.relRole ? s.relRole.replaceAll("_", " ") : "unclear role";
  const body = s.bodyLoc ? `${s.bodyLoc}${s.bodyQual ? ` (${s.bodyQual})` : ""}` : "unknown";
  const goal = (s.goal ?? "unknown").replaceAll("_", " ");
  const rep = s.relRepeating ? s.relRepeating.replaceAll("_", " ") : "unclear";

  const p = s.relPattern ?? "unclear";
  const likelyCost =
    p === "triangle"
      ? "If nothing changes, you get pulled into the middle again. Short calm, repeat conflict."
      : p === "boundary"
      ? "If nothing changes, lines stay blurred. Heat rises or you shut down."
      : p === "fair_share"
      ? "If nothing changes, you carry too much. Resentment grows."
      : p === "truth_distortion"
      ? "If nothing changes, facts stay fuzzy and repair gets harder."
      : p === "proportion_overload"
      ? "If nothing changes, talks happen while flooded and escalate."
      : "If nothing changes, the confusion repeats.";

  const header =
    `I’m hearing: this happened ${when}, your role is ${role}, your body says ${body}, you want ${goal}, and it’s ${rep}.\n\n` +
    `If nothing changes, the likely cost is:\n- ${likelyCost}`;

  const A: OptionBlock = {
    label: "A",
    title: "Step in and manage it now",
    steps: ["mediate", "calm both sides", "try to solve"],
    cost: "Short calm, but you may become the permanent buffer.",
    why: "This often increases dependence on you and repeats the cycle.",
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

  let best: "A" | "B" | "C" = "B";
  if (p === "truth_distortion") best = "C";
  if (p === "proportion_overload") best = "B";
  if (p === "triangle") best = "B";

  const micro = best === "C"
    ? "Write one neutral truth sentence you can say later (no mind-reading)."
    : "Write one calm boundary sentence you can repeat (no blame).";

  return formatOptions(header, best, [A, B, C], micro);
}

function buildWorkAnswer(s: Session) {
  const scope = s.workScope ?? "too_much";
  const timing = s.workTiming ?? "today";
  const body = s.bodyLoc ? `${s.bodyLoc}${s.bodyQual ? ` (${s.bodyQual})` : ""}` : "unknown";
  const goal = (s.goal ?? "unknown").replaceAll("_", " ");

  const scopeText =
    scope === "too_much"
      ? "too much to do"
      : scope === "conflict"
      ? "conflict with someone"
      : scope === "unclear_priorities"
      ? "unclear priorities"
      : scope === "avoidance"
      ? "avoidance / motivation"
      : "job direction / next move";

  const timingText = timing === "today" ? "today" : timing === "this_week" ? "this week" : "ongoing";
  const header =
    `I’m hearing: this is work-related, mainly ${scopeText}, mostly about ${timingText}. Your body says ${body}. You want ${goal}.\n\n` +
    `If nothing changes, the likely cost is pressure spreading into everything and focus shrinking.`;

  const A: OptionBlock = {
    label: "A",
    title: "Shrink the load (one true priority)",
    steps: ["choose ONE task that matters most", "park the rest for now", "do 10 minutes on that one"],
    cost: "Some things wait.",
    why: "When load is too wide, reducing scope restores proportion and stops mental overload.",
  };

  const B: OptionBlock = {
    label: "B",
    title: "Reset a boundary (one clear sentence)",
    steps: ["name what you can do", "name what you cannot do today", "give a time you can revisit"],
    cost: "Awkward moment now.",
    why: "Many work problems are hidden boundary problems. Clear lines reduce conflict and unfair load.",
  };

  const C: OptionBlock = {
    label: "C",
    title: "Small visible progress (5–10 min)",
    steps: ["pick the easiest visible step", "do it for 5–10 minutes", "stop and reassess"],
    cost: "Doesn’t solve the whole situation today.",
    why: "Small progress restores control and reduces avoidance fog.",
  };

  let best: "A" | "B" | "C" = "A";
  if (scope === "conflict") best = "B";
  if (scope === "unclear_priorities") best = "A";
  if (scope === "avoidance") best = "C";
  if (scope === "job_direction") best = "C";

  const micro =
    best === "B"
      ? "Write one boundary sentence: “I can do X today; I can look at Y on ____.”"
      : best === "C"
      ? "Set a 5-minute timer and do the easiest visible step only."
      : "Write the ONE task that matters most today, in one sentence.";

  return formatOptions(header, best, [A, B, C], micro);
}

function buildMoneyAnswer(s: Session) {
  const pressure = s.moneyPressure ?? "fear_uncertainty";
  const horizon = s.moneyHorizon ?? "right_now";
  const body = s.bodyLoc ? `${s.bodyLoc}${s.bodyQual ? ` (${s.bodyQual})` : ""}` : "unknown";
  const goal = (s.goal ?? "unknown").replaceAll("_", " ");

  const pressureText =
    pressure === "not_enough_in"
      ? "not enough coming in"
      : pressure === "too_much_out"
      ? "too much going out"
      : pressure === "fear_uncertainty"
      ? "uncertainty / fear"
      : pressure === "avoided_decision"
      ? "a decision you’re avoiding"
      : "conflict with someone about money";

  const horizonText = horizon === "right_now" ? "right now" : horizon === "this_month" ? "this month" : "ongoing";

  const header =
    `I’m hearing: this is money pressure about ${pressureText}, mainly ${horizonText}. Your body says ${body}. You want ${goal}.\n\n` +
    `If nothing changes, money stress usually leaks into sleep, relationships, and decision-making.`;

  const A: OptionBlock = {
    label: "A",
    title: "See the truth (numbers only, no fixing yet)",
    steps: ["write real income", "write real outflow", "circle the top 3 costs"],
    cost: "Uncomfortable, but clean.",
    why: "Fear grows fastest in vagueness. Reality reduces panic and increases choice.",
  };

  const B: OptionBlock = {
    label: "B",
    title: "Stabilize first (reduce the leak)",
    steps: ["pause one non-essential spend", "delay one optional purchase", "set a simple limit for 7 days"],
    cost: "Temporary limitation.",
    why: "Stability restores breathing room before optimization.",
  };

  const C: OptionBlock = {
    label: "C",
    title: "One concrete improvement",
    steps: ["one small income action", "or one bill reduction call/message", "or one plan for next pay cycle"],
    cost: "Requires effort and follow-through.",
    why: "Movement reduces fear more than thinking does.",
  };

  let best: "A" | "B" | "C" = "A";
  if (pressure === "fear_uncertainty") best = "A";
  if (horizon === "right_now") best = "B";
  if (pressure === "not_enough_in") best = "C";
  if (pressure === "too_much_out") best = "B";
  if (pressure === "conflict_money") best = "A";

  const micro =
    best === "A"
      ? "Spend 10 minutes listing real numbers (income + outflow). No judgment."
      : best === "B"
      ? "Pick ONE expense to pause for 7 days."
      : "Pick ONE small action that increases income or reduces outflow this week.";

  return formatOptions(header, best, [A, B, C], micro);
}

function buildHealthAnswer(s: Session) {
  const issue = s.healthIssue ?? "stress_anxiety";
  const pattern = s.healthPattern ?? "ongoing";
  const body = s.bodyLoc ? `${s.bodyLoc}${s.bodyQual ? ` (${s.bodyQual})` : ""}` : "unknown";
  const goal = (s.goal ?? "unknown").replaceAll("_", " ");

  const issueText =
    issue === "energy_fatigue"
      ? "energy / fatigue"
      : issue === "pain_discomfort"
      ? "pain or discomfort"
      : issue === "stress_anxiety"
      ? "stress / anxiety"
      : issue === "sleep"
      ? "sleep"
      : "a habit you can’t keep";

  const patternText = pattern === "new" ? "new" : pattern === "comes_goes" ? "comes and goes" : "ongoing";

  const header =
    `I’m hearing: this is about ${issueText}, it’s ${patternText}, your body says ${body}, and you want ${goal}.\n\n` +
    `If nothing changes, the body often compensates short-term and pays later with lower energy or higher stress.`;

  const A: OptionBlock = {
    label: "A",
    title: "Reduce load (right-size today)",
    steps: ["lower one demand", "remove one extra input", "stop earlier than usual once"],
    cost: "Less output today.",
    why: "Many health struggles are overload signals. Reducing load restores balance.",
  };

  const B: OptionBlock = {
    label: "B",
    title: "Improve recovery (simple basics)",
    steps: ["water + food support", "short walk or stretch", "consistent wind-down"],
    cost: "Requires repetition.",
    why: "Recovery is where the system rebuilds. Consistency beats intensity.",
  };

  const C: OptionBlock = {
    label: "C",
    title: "Get clearer information",
    steps: ["track one signal for 3 days", "or talk to a professional", "or rule out red flags"],
    cost: "Time + vulnerability.",
    why: "Clear information prevents unnecessary worry and helps right-size the response.",
  };

  let best: "A" | "B" | "C" = "B";
  if (pattern === "new") best = "C";
  if (issue === "pain_discomfort") best = "C";
  if (issue === "stress_anxiety") best = "A";
  if (issue === "sleep") best = "B";

  const micro =
    best === "C"
      ? "Note one symptom detail (when it happens + what makes it better/worse) for 3 days."
      : best === "A"
      ? "Remove ONE non-essential demand today, and do a 2-minute breath reset."
      : "Do one small recovery action: water + 5-minute walk or stretch.";

  return formatOptions(header, best, [A, B, C], micro, CANON.healthSafety);
}

// ---------- UI helpers ----------

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
      text: "Welcome. Ask a real-life question. I won’t tell you what to do — I’ll show balanced options.",
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
    if (looksLikeDefinitionQuestion(q)) {
      push("app", answerDefinition(q));
      return;
    }

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

    if (isWorkQuestion(q)) {
      setSession({
        flow: "work",
        step: "work_scope",
        originalQuestion: q,
        goal: "unknown",
      });
      push("app", "Work check: what is this mainly about?");
      return;
    }

    if (isMoneyQuestion(q)) {
      setSession({
        flow: "money",
        step: "money_pressure",
        originalQuestion: q,
        goal: "unknown",
      });
      push("app", "Money check: what’s the main pressure?");
      return;
    }

    if (isHealthQuestion(q)) {
      setSession({
        flow: "health",
        step: "health_issue",
        originalQuestion: q,
        goal: "unknown",
      });
      push("app", "Health check: what’s the main concern?");
      return;
    }

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

    // Default fallback: daily (stable + useful)
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

  // Build choices based on current step
  let choices: Choice[] = [];

  // Shared body prompt helpers
  const bodyLocChoices: Choice[] = [
    {
      id: "chest",
      label: "Chest",
      onPick: () => {
        setSession((s) => ({ ...s, bodyLoc: "chest", step: nextBodyQualStep(s.step) }));
        push("app", "Main body signal?");
      },
    },
    {
      id: "belly",
      label: "Belly / solar plexus",
      onPick: () => {
        setSession((s) => ({ ...s, bodyLoc: "belly", step: nextBodyQualStep(s.step) }));
        push("app", "Main body signal?");
      },
    },
  ];

  const healthBodyLocChoices: Choice[] = [
    {
      id: "head",
      label: "Head",
      onPick: () => {
        setSession((s) => ({ ...s, bodyLoc: "head", step: "health_body_qual" }));
        push("app", "Main body signal?");
      },
    },
    {
      id: "chest",
      label: "Chest",
      onPick: () => {
        setSession((s) => ({ ...s, bodyLoc: "chest", step: "health_body_qual" }));
        push("app", "Main body signal?");
      },
    },
    {
      id: "belly",
      label: "Belly",
      onPick: () => {
        setSession((s) => ({ ...s, bodyLoc: "belly", step: "health_body_qual" }));
        push("app", "Main body signal?");
      },
    },
    {
      id: "whole",
      label: "Whole body",
      onPick: () => {
        setSession((s) => ({ ...s, bodyLoc: "whole_body", step: "health_body_qual" }));
        push("app", "Main body signal?");
      },
    },
  ];

  function nextBodyQualStep(current: Step): Step {
    // map loc step -> qual step for each flow
    if (current === "daily_body_loc") return "daily_body_qual";
    if (current === "rel_body_loc") return "rel_body_qual";
    if (current === "work_body_loc") return "work_body_qual";
    if (current === "money_body_loc") return "money_body_qual";
    return current;
  }

  const bodyQualChoices = (nextStep: Step, nextQuestion: string): Choice[] => [
    {
      id: "tight",
      label: "Tight",
      onPick: () => {
        setSession((s) => ({ ...s, bodyQual: "tight", step: nextStep }));
        push("app", nextQuestion);
      },
    },
    {
      id: "heavy",
      label: "Heavy",
      onPick: () => {
        setSession((s) => ({ ...s, bodyQual: "heavy", step: nextStep }));
        push("app", nextQuestion);
      },
    },
    {
      id: "numb",
      label: "Numb",
      onPick: () => {
        setSession((s) => ({ ...s, bodyQual: "numb", step: nextStep }));
        push("app", nextQuestion);
      },
    },
    {
      id: "heat",
      label: "Heat",
      onPick: () => {
        setSession((s) => ({ ...s, bodyQual: "heat", step: nextStep }));
        push("app", nextQuestion);
      },
    },
    {
      id: "neutral",
      label: "Neutral",
      onPick: () => {
        setSession((s) => ({ ...s, bodyQual: "neutral", step: nextStep }));
        push("app", nextQuestion);
      },
    },
  ];

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
        { id: "thoughts", label: "Thoughts", onPick: () => (setSession((s) => ({ ...s, dailyDisturbance: "thoughts", step: "daily_body_loc" })), push("app", "Body check: where do you feel it most?")) },
        { id: "people", label: "People", onPick: () => (setSession((s) => ({ ...s, dailyDisturbance: "people", step: "daily_body_loc" })), push("app", "Body check: where do you feel it most?")) },
        { id: "phone", label: "Phone", onPick: () => (setSession((s) => ({ ...s, dailyDisturbance: "phone", step: "daily_body_loc" })), push("app", "Body check: where do you feel it most?")) },
        { id: "pressure", label: "Pressure", onPick: () => (setSession((s) => ({ ...s, dailyDisturbance: "pressure", step: "daily_body_loc" })), push("app", "Body check: where do you feel it most?")) },
        { id: "fatigue", label: "Body fatigue", onPick: () => (setSession((s) => ({ ...s, dailyDisturbance: "body_fatigue", step: "daily_body_loc" })), push("app", "Body check: where do you feel it most?")) },
      ];
    }

    if (session.step === "daily_body_loc") choices = bodyLocChoices;

    if (session.step === "daily_body_qual") {
      choices = bodyQualChoices("daily_goal", "What do you want most?");
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
        { id: "breakfast", label: "Today (breakfast)", onPick: () => (setSession((s) => ({ ...s, relTime: "today_breakfast", step: "rel_role" })), push("app", "Your role in it?")) },
        { id: "phone", label: "Today (phone/text)", onPick: () => (setSession((s) => ({ ...s, relTime: "today_phone", step: "rel_role" })), push("app", "Your role in it?")) },
        { id: "yesterday", label: "Yesterday", onPick: () => (setSession((s) => ({ ...s, relTime: "yesterday", step: "rel_role" })), push("app", "Your role in it?")) },
        { id: "week", label: "This week", onPick: () => (setSession((s) => ({ ...s, relTime: "this_week", step: "rel_role" })), push("app", "Your role in it?")) },
        { id: "other", label: "Other", onPick: () => (setSession((s) => ({ ...s, relTime: "other", step: "rel_role" })), push("app", "Your role in it?")) },
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

    if (session.step === "rel_body_loc") choices = bodyLocChoices;

    if (session.step === "rel_body_qual") {
      choices = bodyQualChoices("rel_goal", "What do you want most right now?");
    }

    if (session.step === "rel_goal") {
      choices = [
        { id: "peace", label: "Peace", onPick: () => (setSession((s) => ({ ...s, goal: "peace", step: "rel_repeating" })), push("app", "Is this one-time or repeating?")) },
        { id: "fairness", label: "Fairness", onPick: () => (setSession((s) => ({ ...s, goal: "fairness", step: "rel_repeating" })), push("app", "Is this one-time or repeating?")) },
        { id: "respect", label: "Respect", onPick: () => (setSession((s) => ({ ...s, goal: "respect", step: "rel_repeating" })), push("app", "Is this one-time or repeating?")) },
        { id: "safety", label: "Safety", onPick: () => (setSession((s) => ({ ...s, goal: "safety", step: "rel_repeating" })), push("app", "Is this one-time or repeating?")) },
        { id: "clarity", label: "Clarity", onPick: () => (setSession((s) => ({ ...s, goal: "clarity", step: "rel_repeating" })), push("app", "Is this one-time or repeating?")) },
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

  // WORK FLOW
  if (session.flow === "work") {
    if (session.step === "work_scope") {
      choices = [
        { id: "too_much", label: "Too much to do", onPick: () => (setSession((s) => ({ ...s, workScope: "too_much", step: "work_timing" })), push("app", "Is this about today, this week, or ongoing?")) },
        { id: "conflict", label: "Conflict with someone", onPick: () => (setSession((s) => ({ ...s, workScope: "conflict", step: "work_timing" })), push("app", "Is this about today, this week, or ongoing?")) },
        { id: "priorities", label: "Unclear priorities", onPick: () => (setSession((s) => ({ ...s, workScope: "unclear_priorities", step: "work_timing" })), push("app", "Is this about today, this week, or ongoing?")) },
        { id: "avoidance", label: "Avoidance / motivation", onPick: () => (setSession((s) => ({ ...s, workScope: "avoidance", step: "work_timing" })), push("app", "Is this about today, this week, or ongoing?")) },
        { id: "direction", label: "Job direction / next move", onPick: () => (setSession((s) => ({ ...s, workScope: "job_direction", step: "work_timing" })), push("app", "Is this about today, this week, or ongoing?")) },
      ];
    }

    if (session.step === "work_timing") {
      choices = [
        { id: "today", label: "Today", onPick: () => (setSession((s) => ({ ...s, workTiming: "today", step: "work_body_loc" })), push("app", "Body check: where do you feel it most?")) },
        { id: "week", label: "This week", onPick: () => (setSession((s) => ({ ...s, workTiming: "this_week", step: "work_body_loc" })), push("app", "Body check: where do you feel it most?")) },
        { id: "ongoing", label: "Ongoing", onPick: () => (setSession((s) => ({ ...s, workTiming: "ongoing", step: "work_body_loc" })), push("app", "Body check: where do you feel it most?")) },
      ];
    }

    if (session.step === "work_body_loc") choices = bodyLocChoices;

    if (session.step === "work_body_qual") {
      choices = bodyQualChoices("work_goal", "What do you want most right now?");
    }

    if (session.step === "work_goal") {
      const resolve = (g: Goal) => {
        const updated: Session = { ...session, goal: g, step: "work_done", flow: "work" };
        setSession(updated);
        push("app", buildWorkAnswer(updated));
        resetSession();
      };

      choices = [
        { id: "clarity", label: "Clarity", onPick: () => resolve("clarity") },
        { id: "relief", label: "Relief", onPick: () => resolve("relief") },
        { id: "fairness", label: "Fairness", onPick: () => resolve("fairness") },
        { id: "progress", label: "Progress", onPick: () => resolve("progress") },
        { id: "stability", label: "Stability", onPick: () => resolve("stability") },
      ];
    }
  }

  // MONEY FLOW
  if (session.flow === "money") {
    if (session.step === "money_pressure") {
      choices = [
        { id: "in", label: "Not enough coming in", onPick: () => (setSession((s) => ({ ...s, moneyPressure: "not_enough_in", step: "money_horizon" })), push("app", "Is this about right now, this month, or ongoing?")) },
        { id: "out", label: "Too much going out", onPick: () => (setSession((s) => ({ ...s, moneyPressure: "too_much_out", step: "money_horizon" })), push("app", "Is this about right now, this month, or ongoing?")) },
        { id: "fear", label: "Uncertainty / fear", onPick: () => (setSession((s) => ({ ...s, moneyPressure: "fear_uncertainty", step: "money_horizon" })), push("app", "Is this about right now, this month, or ongoing?")) },
        { id: "avoid", label: "Decision I’m avoiding", onPick: () => (setSession((s) => ({ ...s, moneyPressure: "avoided_decision", step: "money_horizon" })), push("app", "Is this about right now, this month, or ongoing?")) },
        { id: "conflict", label: "Conflict with someone", onPick: () => (setSession((s) => ({ ...s, moneyPressure: "conflict_money", step: "money_horizon" })), push("app", "Is this about right now, this month, or ongoing?")) },
      ];
    }

    if (session.step === "money_horizon") {
      choices = [
        { id: "now", label: "Right now", onPick: () => (setSession((s) => ({ ...s, moneyHorizon: "right_now", step: "money_body_loc" })), push("app", "Body check: where do you feel it most?")) },
        { id: "month", label: "This month", onPick: () => (setSession((s) => ({ ...s, moneyHorizon: "this_month", step: "money_body_loc" })), push("app", "Body check: where do you feel it most?")) },
        { id: "ongoing", label: "Ongoing pattern", onPick: () => (setSession((s) => ({ ...s, moneyHorizon: "ongoing", step: "money_body_loc" })), push("app", "Body check: where do you feel it most?")) },
      ];
    }

    if (session.step === "money_body_loc") choices = bodyLocChoices;

    if (session.step === "money_body_qual") {
      choices = bodyQualChoices("money_goal", "What matters most right now?");
    }

    if (session.step === "money_goal") {
      const resolve = (g: Goal) => {
        const updated: Session = { ...session, goal: g, step: "money_done", flow: "money" };
        setSession(updated);
        push("app", buildMoneyAnswer(updated));
        resetSession();
      };

      choices = [
        { id: "safety", label: "Safety", onPick: () => resolve("safety") },
        { id: "stability", label: "Stability", onPick: () => resolve("stability") },
        { id: "fairness", label: "Fairness", onPick: () => resolve("fairness") },
        { id: "relief", label: "Relief", onPick: () => resolve("relief") },
        { id: "clarity", label: "Clarity", onPick: () => resolve("clarity") },
      ];
    }
  }

  // HEALTH FLOW
  if (session.flow === "health") {
    if (session.step === "health_issue") {
      choices = [
        { id: "energy", label: "Energy / fatigue", onPick: () => (setSession((s) => ({ ...s, healthIssue: "energy_fatigue", step: "health_pattern" })), push("app", "Is it new, ongoing, or comes and goes?")) },
        { id: "pain", label: "Pain / discomfort", onPick: () => (setSession((s) => ({ ...s, healthIssue: "pain_discomfort", step: "health_pattern" })), push("app", "Is it new, ongoing, or comes and goes?")) },
        { id: "stress", label: "Stress / anxiety", onPick: () => (setSession((s) => ({ ...s, healthIssue: "stress_anxiety", step: "health_pattern" })), push("app", "Is it new, ongoing, or comes and goes?")) },
        { id: "sleep", label: "Sleep", onPick: () => (setSession((s) => ({ ...s, healthIssue: "sleep", step: "health_pattern" })), push("app", "Is it new, ongoing, or comes and goes?")) },
        { id: "habit", label: "Habit I can’t keep", onPick: () => (setSession((s) => ({ ...s, healthIssue: "habit", step: "health_pattern" })), push("app", "Is it new, ongoing, or comes and goes?")) },
      ];
    }

    if (session.step === "health_pattern") {
      choices = [
        { id: "new", label: "New", onPick: () => (setSession((s) => ({ ...s, healthPattern: "new", step: "health_body_loc" })), push("app", "Where do you feel it most?")) },
        { id: "ongoing", label: "Ongoing", onPick: () => (setSession((s) => ({ ...s, healthPattern: "ongoing", step: "health_body_loc" })), push("app", "Where do you feel it most?")) },
        { id: "comes", label: "Comes and goes", onPick: () => (setSession((s) => ({ ...s, healthPattern: "comes_goes", step: "health_body_loc" })), push("app", "Where do you feel it most?")) },
      ];
    }

    if (session.step === "health_body_loc") choices = healthBodyLocChoices;

    if (session.step === "health_body_qual") {
      choices = bodyQualChoices("health_goal", "What matters most right now?");
    }

    if (session.step === "health_goal") {
      const resolve = (g: Goal) => {
        const updated: Session = { ...session, goal: g, step: "health_done", flow: "health" };
        setSession(updated);
        push("app", buildHealthAnswer(updated));
        resetSession();
      };

      choices = [
        { id: "relief", label: "Relief", onPick: () => resolve("relief") },
        { id: "stability", label: "Stability", onPick: () => resolve("stability") },
        { id: "understanding", label: "Understanding", onPick: () => resolve("understanding") },
        { id: "energy", label: "Energy", onPick: () => resolve("energy") },
        { id: "calm", label: "Calm", onPick: () => resolve("calm") },
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
          placeholder='Type your question, tap Send, then use the buttons. Example: “Work is overwhelming.”'
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
          onClick={() => {
            const text = input.trim();
            if (!text) return;
            push("user", text);
            setInput("");

            // mid-flow new question -> restart
            if (session.flow !== "none" && looksLikeNewQuestion(text)) {
              push("app", "New question noticed. Starting fresh.");
              resetSession();
              beginSession(text);
              return;
            }

            if (session.flow === "none") {
              beginSession(text);
              return;
            }

            push("app", "Got it. (Detail noted.) Use the buttons below to continue.");
          }}
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
        Tip: After you tap Send, answer with buttons. If you type a new question mid-flow, it starts fresh.
      </div>
    </main>
  );
}
