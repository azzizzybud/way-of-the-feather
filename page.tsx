"use client";

import { useState } from "react";

export default function Home() {
  const [question, setQuestion] = useState("");

  return (
    <main style={{ padding: 24, maxWidth: 600 }}>
      <h1>Way of the Feather</h1>
      <p>Ask a real-life question. We’ll slow it down first.</p>

      <textarea
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        placeholder="What’s the situation you want clarity on?"
        rows={4}
        style={{
          width: "100%",
          padding: 12,
          marginTop: 16,
          borderRadius: 8,
          border: "1px solid #ccc",
        }}
      />

      <button
        style={{
          marginTop: 12,
          padding: "10px 16px",
          borderRadius: 8,
          border: "none",
          background: "black",
          color: "white",
          cursor: "pointer",
        }}
        onClick={() => {
          alert("Later this will open the Feather clarification flow.");
        }}
      >
        Ask the Feather
      </button>
    </main>
  );
}
