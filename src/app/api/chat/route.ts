export const runtime = "edge";

export async function POST(req: Request) {
  const { messages } = await req.json();
  const sys = { role: "system", content: "You are a coding copilot." };

  const resp = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini", // or another
      messages: [sys, ...messages],
      stream: true,
    }),
  });

  return new Response(resp.body, {
    headers: { "Content-Type": "text/event-stream" },
  });
}
