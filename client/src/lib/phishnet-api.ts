import { z } from "zod";

const ShowSchema = z.object({
  showid: z.string(),
  showdate: z.string(),
  venue: z.string(),
  location: z.string(),
});

const ShowsResponseSchema = z.object({
  response: z.object({
    data: z.array(ShowSchema)
  })
});

type Show = z.infer<typeof ShowSchema>;

export class PhishNetApi {
  private readonly baseUrl = "https://api.phish.net/v5";
  private readonly apiKey: string;

  constructor() {
    const apiKey = import.meta.env.VITE_PHISHNET_APIKEY;
    if (!apiKey) {
      console.error("Missing Phish.net API key in environment variables. Please set VITE_PHISHNET_APIKEY.");
      return;
    }
    this.apiKey = apiKey;
  }

  private async fetchApi(endpoint: string, params: Record<string, string> = {}) {
    if (!this.apiKey) {
      throw new Error("API key not configured");
    }

    const searchParams = new URLSearchParams({
      apikey: this.apiKey,
      ...params
    });

    const response = await fetch(
      `${this.baseUrl}${endpoint}?${searchParams.toString()}`
    );

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  async getUserShows(username: string): Promise<Show[]> {
    const data = await this.fetchApi("/user/shows/query", {
      username
    });

    const parsed = ShowsResponseSchema.safeParse(data);
    if (!parsed.success) {
      console.error("API Response validation failed:", parsed.error);
      return [];
    }

    return parsed.data.response.data;
  }
}

// Export singleton instance
export const phishNetApi = new PhishNetApi();