import "dotenv/config";
import { Octokit } from "@octokit/rest";
import axios from "axios";

const octokit = new Octokit({
  auth: process.env.GH_TOKEN || "", 
});

const owner = "XI4507";
const repo = "code-bot";
const prNumber = Number(process.env.PR_NUMBER); 

console.log("PR Number:", prNumber);

async function getChangedFiles() {
  if (!prNumber) {
    throw new Error("PR_NUMBER is missing or invalid.");
  }

  const { data } = await octokit.pulls.listFiles({
    owner,
    repo,
    pull_number: prNumber,
  });

  return data.map((file) => ({
    filename: file.filename,
    patch: file.patch,
  }));
}

async function getReviewFromAI(codeChanges) {
  const openaiAPIKey = process.env.OPENAI_API_KEY?.trim(); 

  if (!openaiAPIKey) {
    throw new Error("OPENAI_API_KEY is missing. Check your environment variables.");
  }

  const prompt = `Review the following code changes and provide feedback:\n\n${JSON.stringify(
    codeChanges
  )}`;

  try {
    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-4",
        messages: [{ role: "user", content: prompt }],
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


async function postReviewComment(reviewText) {
  if (!prNumber) {
    throw new Error("PR_NUMBER is missing or invalid.");
  }

  await octokit.issues.createComment({
    owner,
    repo,
    issue_number: prNumber,
    body: reviewText,
  });
}

async function runBot() {
  try {
    console.log("Fetching PR changes...");
    const files = await getChangedFiles();

    if (!files.length) {
      console.log("No file changes detected.");
      return;
    }

    console.log("Requesting AI review...");
    const reviewText = await getReviewFromAI(files);

    console.log("Posting review comment...");
    await postReviewComment(reviewText);

    console.log("Review posted successfully!");
  } catch (error) {
    console.error("Error in Code Review Bot:", error);
  }
}

runBot();
