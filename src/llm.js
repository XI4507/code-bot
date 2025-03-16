import axios from "axios";
import fs from "fs/promises";

export async function getReviewFromAI(codeChanges) {
  const openaiAPIKey = process.env.OPENAI_API_KEY?.trim();

  if (!openaiAPIKey) {
    throw new Error(
      "OPENAI_API_KEY is missing. Check your environment variables."
    );
  }

  try {
    // Read guidelines from file
    const guidelines = await fs.readFile("guidelines.md", "utf-8");

    const prompt = `Guidelines:\n${guidelines}\n\nCode Changes:\n${JSON.stringify(
      codeChanges
    )}\n\nReview this code following the given guidelines.`;

    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content:
              "You are a code review assistant following given guidelines.",
          },
          { role: "user", content: prompt },
        ],
      },
      {
        headers: { Authorization: `Bearer ${openaiAPIKey}` },
      }
    );

    return response.data.choices[0].message.content;
  } catch (error) {
    console.error("OpenAI API Error:", error.response?.data || error.message);
    throw error;
  }
}
