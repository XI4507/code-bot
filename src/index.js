const axios = require("axios");
const dotenv = require("dotenv");
const { Configuration, OpenAIApi } = require("openai");

dotenv.config();

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

const headers = {
  Authorization: `token ${GITHUB_TOKEN}`,
  Accept: "application/vnd.github.v3+json",
};

const openai = new OpenAIApi(
  new Configuration({ apiKey: process.env.OPENAI_API_KEY })
);

// AI-based code review function
async function reviewCode(code) {
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

// Get changed files in a pull request
async function getChangedFiles(owner, repo, pull_number) {
  try {
    const url = `https://api.github.com/repos/${owner}/${repo}/pulls/${pull_number}/files`;
    const response = await axios.get(url, { headers });
    return response.data.map((file) => file.filename);
  } catch (error) {
    console.error(
      "Error fetching changed files:",
      error.response?.data || error.message
    );
    return [];
  }
}

// Post a comment on a pull request
async function postComment(owner, repo, pull_number, comment) {
  try {
    const url = `https://api.github.com/repos/${owner}/${repo}/issues/${pull_number}/comments`;
    await axios.post(url, { body: comment }, { headers });
    console.log("✅ Comment posted successfully!");
  } catch (error) {
    console.error(
      "Error posting comment:",
      error.response?.data || error.message
    );
  }
}

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
          await postComment(
            owner,
            repo,
            pull_number,
            `### Code Review Feedback for \`${file}\`:\n${reviewFeedback}`
          );
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
