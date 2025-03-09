import type { Express } from "express";
import axios from "axios";
import { parseString } from "xml2js";
import { promisify } from "util";

// API Base URLs
export const PHISH_API_BASE = "https://api.phish.net/v5";
export const LASTFM_API_BASE = "https://ws.audioscrobbler.com/2.0/";
export const GOODREADS_API_BASE = "https://www.goodreads.com";
export const GOODREADS_USER_ID = "457389";
export const GOODREADS_API_KEY = "ajR4uV5s4lLmYZUWI2SKXw";

export const parseXMLAsync = promisify(parseString);

// Last.fm API utility function
export async function fetchLastFmData(method: string, params: Record<string, string>) {
  try {
    const apiKey = process.env.LASTFM_API_KEY;
    if (!apiKey) {
      throw new Error("Last.fm API key is not set");
    }

    const queryParams = new URLSearchParams();
    queryParams.append("method", method);
    queryParams.append("api_key", apiKey);
    queryParams.append("format", "json");
    Object.entries(params).forEach(([key, value]) => {
      queryParams.append(key, value);
    });

    const url = `${LASTFM_API_BASE}?${queryParams.toString()}`;
    const response = await fetch(url);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to fetch data from Last.fm API");
    }

    return data;
  } catch (error) {
    console.error("Error fetching from Last.fm:", error);
    throw error;
  }
}

// Phish.net API utility function
export async function fetchPhishData(endpoint: string) {
  try {
    const apiKey = process.env.PHISH_API_KEY;
    const response = await fetch(
      `${PHISH_API_BASE}${endpoint}.json?apikey=${apiKey}`,
    );
    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.message || "Failed to fetch data from Phish.net API",
      );
    }

    return data.data;
  } catch (error) {
    console.error("Error fetching from Phish.net:", error);
    throw error;
  }
}

// URL formatting utility
export function formatSongUrl(songName: string): string {
  return `https://phish.net/song/${songName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")}`;
}
