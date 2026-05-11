// aiClient-Gemini.js
import { setTimeout as sleep } from "timers/promises";

export async function callLLM(prompt, modelName, apiKey, retries = 3, delay = 5000) {
  const finalApiKey = apiKey || "AIzaSyA4ur4a05rrGSH4OjVyfNHGG5BD3gAbyuc";

  const model = (modelName && modelName.includes("gemini")) ? modelName : "gemini-2.5-flash-lite"; // 💡 PRO TIP: Flash-Lite often has more capacity than standard Flash

  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${finalApiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        })
      });

      const data = await res.json();

      if (res.status === 503 || res.status === 429) {
        console.warn(`⚠️ High demand. Retrying in ${delay / 1000}s... (Attempt ${i + 1}/${retries})`);
        await sleep(delay);
        delay *= 2; // Exponentially increase wait time
        continue;
      }

      if (data.error) throw new Error(data.error.message);
      return data.candidates[0].content.parts[0].text;

    } catch (err) {
      if (i === retries - 1) throw err;
      await sleep(delay);
    }
  }
}