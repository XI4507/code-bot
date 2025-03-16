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

export async function postReviewComment(prNumber, reviewText) {
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
