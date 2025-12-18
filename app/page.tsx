"use client";

export default function Home() {
  return (
    <main style={{ padding: 30 }}>
      <h1>Way of the Feather</h1>

      <p>
        If you can read this and see the box below, the app is working.
      </p>

      <textarea
        placeholder="Type your question here"
        rows={5}
        style={{
          width: "100%",
          marginTop: 20,
          padding: 10,
          fontSize: 16,
          border: "2px solid black"
        }}
      />

      <p style={{ marginTop: 20 }}>
        This page was edited directly on GitHub.
      </p>
    </main>
  );
}
