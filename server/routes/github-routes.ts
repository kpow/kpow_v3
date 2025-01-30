import { Router } from "express";
import axios from "axios";

export function registerGithubRoutes(router: Router) {
  router.get("/api/github/user", async (_req, res) => {
    try {
      const githubToken = process.env.GITHUB_TOKEN;
      if (!githubToken) {
        throw new Error("GitHub token not found in environment variables");
      }

      const response = await axios.get('https://api.github.com/users/kpow', {
        headers: {
          'Accept': 'application/vnd.github+json',
          'Authorization': `Bearer ${githubToken}`,
          'X-GitHub-Api-Version': '2022-11-28'
        }
      });

      res.json(response.data);
    } catch (error) {
      console.error("Error fetching GitHub data:", error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to fetch GitHub data" 
      });
    }
  });
}
