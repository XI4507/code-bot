import axios from "axios";
import dotenv from "dotenv";

dotenv.config(); // Load environment variables

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

const headers = {
  Authorization: `token ${GITHUB_TOKEN}`,
  Accept: "application/vnd.github.v3+json",
};

// Get changed files in a pull request
export async function getChangedFiles(owner, repo, pull_number) {
  try {
    const url = `https://api.github.com/repos/${owner}/${repo}/pulls/${pull_number}/files`;
    const response = await axios.get(url, { headers });
    return response.data.map((file) => file.filename);
  } catch (error) {
    console.error("Error fetching changed files:", error.response?.data || error.message);
    return [];
  }
}

// Post a comment on a pull request
export async function postComment(owner, repo, pull_number, comment) {
  try {
    const url = `https://api.github.com/repos/${owner}/${repo}/issues/${pull_number}/comments`;
    await axios.post(url, { body: comment }, { headers });
    console.log("✅ Comment posted successfully!");
  } catch (error) {
    console.error("Error posting comment:", error.response?.data || error.message);
  }
}
