import axios from "axios";
import fs from "fs/promises";

export async function getReviewFromAI(codeChanges) {
  const openaiAPIKey = process.env.OPENAI_API_KEY?.trim();

  if (!openaiAPIKey) {
    throw new Error("OPENAI_API_KEY is missing. Check your environment variables.");
  }

  try {
    const guidelines = await fs.readFile("guidelines.md", "utf-8");

    const prompt = `
    Guidelines:\n${guidelines}\n\n
    Code Changes:\n${JSON.stringify(codeChanges, null, 2)}\n\n
    Review the given code changes and provide line-specific comments in JSON format:
    [{"filename": "file1.js", "line": 10, "comment": "This line can be optimized."}, ...]`;

    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-4.1-nano",
        messages: [
          {
            role: "system",
            content: "You are a precise code review assistant. Return JSON only. No explanations.",
          },
          { role: "user", content: prompt },
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${openaiAPIKey}`,
          "Content-Type": "application/json",
        },
      }
    );

    let content = response.data?.choices?.[0]?.message?.content;

    if (content) {
      content = content.replace(/```json|```/g, "").trim();

      try {
        const review = JSON.parse(content);
        return review;
      } catch (parseError) {
        console.error("Failed to parse cleaned JSON content:", content);
        throw new Error("Invalid JSON format after cleaning.");
      }
    } else {
      console.error("Unexpected response format:", response.data);
      throw new Error("No content returned by OpenAI.");
    }
  } catch (error) {
    console.error("OpenAI API Error:", error.response?.data || error.message);
    throw error;
  }
}
