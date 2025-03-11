import "dotenv/config"; 
import { Octokit } from "@octokit/rest";
import axios from "axios"; 

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

const owner = "XI4507";
const repo = "code-bot";
const prNumber = process.env.GITHUB_PR_NUMBER;

async function getChangedFiles() {
  const { data } = await octokit.pulls.listFiles({
    owner,
    repo,
    pull_number: prNumber,
  });

  return data.map((file) => ({
    filename: file.filename,
    patch: file.patch, // Get code changes
  }));
}

async function getReviewFromAI(codeChanges) {
  const openaiAPIKey = process.env.OPENAI_API_KEY;

  const prompt = `Review the following code changes and provide feedback:\n\n${JSON.stringify(
    codeChanges
  )}`;

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
}

async function postReviewComment(reviewText) {
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
