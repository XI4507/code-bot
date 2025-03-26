import { Octokit } from "@octokit/rest";

const octokit = new Octokit({
  auth: process.env.GH_TOKEN || "",
});

const owner = "XI4507";
const repo = "code-bot";

/**
 * Parses the patch to extract the line number in the base file
 */
function extractLineNumbers(patch) {
  const lineNumbers = [];
  const lines = patch.split("\n");
  let currentLine = 0;

  for (const line of lines) {
    if (line.startsWith("@@")) {
      const match = line.match(/@@ -(\d+),/);
      if (match) {
        currentLine = parseInt(match[1], 10);
      }
    } else if (!line.startsWith("-")) {
      lineNumbers.push(currentLine);
      currentLine++;
    }
  }

  return lineNumbers;
}

export async function getChangedFiles(prNumber) {
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
    lines: extractLineNumbers(file.patch),
  }));
}

export async function postReviewComments(prNumber, comments) {
  if (!prNumber) {
    throw new Error("PR_NUMBER is missing or invalid.");
  }

  const reviewComments = comments.map(({ filename, line, comment }) => ({
    path: filename,
    line, // Use actual line number
    side: "RIGHT",
    body: comment,
  }));

  try {
    await octokit.pulls.createReview({
      owner,
      repo,
      pull_number: prNumber,
      event: "COMMENT",
      comments: reviewComments,
    });

    console.log("Review comments posted successfully!");
  } catch (error) {
    console.error("Error posting review comments:", error.response?.data || error.message);
    throw error;
  }
}
