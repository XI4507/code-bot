import { getChangedFiles, postComment } from "./github";
import { reviewCode } from "./review.js";
import axios from "axios";

async function performCodeReview(owner, repo, pull_number, branch) {
  try {
    console.log("🚀 Fetching changed files...");
    const changedFiles = await getChangedFiles(owner, repo, pull_number);
    console.log("📂 Changed files:", changedFiles);

    for (const file of changedFiles) {
      try {
        const url = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${file}`;
        const { data: code } = await axios.get(url);

        const reviewFeedback = await reviewCode(code);
        if (reviewFeedback.trim()) {
          await postComment(owner, repo, pull_number, `### Code Review Feedback for \`${file}\`:\n${reviewFeedback}`);
        }
      } catch (error) {
        console.error(`❌ Error fetching file ${file}:`, error.message);
      }
    }
  } catch (error) {
    console.error("❌ Error performing code review:", error.message);
  }
}

// Run the function (replace with real PR number)
const [owner, repo, pull_number, branch] = process.argv.slice(2);
performCodeReview(owner, repo, pull_number, branch);
