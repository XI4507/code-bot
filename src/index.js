import "dotenv/config";
import { getChangedFiles, postReviewComment } from "./octokit.js";
import { getReviewFromAI } from "./llm.js";

const prNumber = Number(process.env.PR_NUMBER);

async function runBot() {
  try {
    console.log("Fetching PR changes...");
    const files = await getChangedFiles(prNumber);

    if (!files.length) {
      console.log("No file changes detected.");
      return;
    }

    console.log("Requesting AI review...");
    const reviewText = await getReviewFromAI(files);

    console.log("Posting review comment...");
    await postReviewComment(prNumber, reviewText);

    console.log("Review posted successfully!");
  } catch (error) {
    console.error("Error in Code Review Bot:", error);
  }
}

runBot();
