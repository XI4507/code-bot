import { Octokit } from "@octokit/rest";

const octokit = new Octokit({
  auth: process.env.GH_TOKEN || "",
});

const owner = "XI4507";
const repo = "code-bot";

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
  }));
}

export async function postReviewComments(prNumber, comments) {
  if (!prNumber) {
    throw new Error("PR_NUMBER is missing or invalid.");
  }

  const reviewPayload = {
    owner,
    repo,
    pull_number: prNumber,
    event: "COMMENT", // "COMMENT" creates a draft review
    comments: comments.map(({ filename, line, comment }) => ({
      path: filename,
      position: line, // `position` refers to the diff position in the PR
      body: comment,
    })),
  };

  try {
    await octokit.pulls.createReview(reviewPayload);
    console.log("Review comments posted successfully!");
  } catch (error) {
    console.error("Error posting review comments:", error.response?.data || error.message);
    throw error;
  }
}
