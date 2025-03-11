import { Configuration, OpenAIApi } from "openai";
import dotenv from "dotenv";

dotenv.config();

const openai = new OpenAIApi(new Configuration({ apiKey: process.env.OPENAI_API_KEY }));

// AI-based code review function
export async function reviewCode(code) {
  try {
    const prompt = `You are a professional code reviewer. Analyze the following code and provide constructive feedback:\n\n${code}`;
    const response = await openai.createChatCompletion({
      model: "gpt-4",
      messages: [{ role: "system", content: prompt }],
    });

    return response.data.choices[0].message.content.trim();
  } catch (error) {
    console.error("Error generating review:", error.message);
    return "Error in AI review.";
  }
}
