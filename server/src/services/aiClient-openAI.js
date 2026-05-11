import { setTimeout as delay } from "timers/promises";
// aiClient-openAI.js
export async function callLLM(prompt) {
  const apiKey = process.env.OPENAI_API_KEY; 

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "You are a Data Quality API." },
          { role: "user", content: prompt }
        ],
        response_format: { type: "json_object" }
      })
    });

    const data = await res.json();

    // 🛡️ CHECK FOR API ERRORS
    if (data.error) {
      console.error("OpenAI API Error Details:", data.error.message); // This tells you WHY it failed
      throw new Error(`OpenAI Error: ${data.error.message}`);
    }

    if (!data.choices || !data.choices[0]) {
      console.error("Unexpected OpenAI Response Format:", data);
      throw new Error("Invalid response structure from OpenAI");
    }

    return data.choices[0].message.content;

  } catch (err) {
    console.error("LLM fetch error:", err.message);
    throw err;
  }
}