export const runtime = "edge";

export async function POST(req: Request) {
  const { messages, model } = await req.json();
  const sys = { role: "system", content: "You are a coding copilot." };

  const resp = await fetch("http://localhost:11434/api/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: model,
      messages: [sys, ...messages],
      stream: true,
    }),
  });

  return new Response(resp.body, {
    headers: { "Content-Type": "application/x-ndjson" },
  });
}
