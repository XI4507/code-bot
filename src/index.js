import "dotenv/config";
import { getChangedFiles, postReviewComments } from "./octokit.js";
import { getReviewFromAI } from "./llm.js";

const prNumber = Number(process.env.PR_NUMBER);

async function runBot() {
  try {
    console.log(`Fetching changes for PR #${prNumber}...`);
    const files = await getChangedFiles(prNumber);

    if (!files.length) {
      console.log("No file changes detected.");
      return;
    }

    console.log("Extracting code changes...");
    const codeChanges = files.flatMap((file) =>
      file.lines.map((line) => ({
        filename: file.filename,
        line,
        patch: file.patch,
      }))
    );

    console.log("Requesting AI review...");
    const reviewComments = await getReviewFromAI(codeChanges);

    if (!reviewComments.length) {
      console.log("No review comments generated.");
      return;
    }

    console.log("Posting review comments...");
    await postReviewComments(prNumber, reviewComments);

    console.log("Review comments posted successfully!");
  } catch (error) {
    console.error("Error in Code Review Bot:", error);
  }
}

runBot();
