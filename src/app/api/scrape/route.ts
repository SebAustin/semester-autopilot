import { NextResponse } from "next/server";
import { z } from "zod";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_MARKDOWN_CHARS = 40_000;
const FIRECRAWL_TIMEOUT_MS = 45_000;
const MOCK_LATENCY_MS = 600;

const requestSchema = z.object({ url: z.string().min(8).max(2_000) });

type ScrapeResponse =
  | { ok: true; markdown: string }
  | {
      ok: false;
      error: "invalid-input" | "scrape-not-configured" | "scrape-failed";
      message: string;
    };

function jsonError(
  status: number,
  error: Extract<ScrapeResponse, { ok: false }>["error"],
  message: string,
): NextResponse {
  return NextResponse.json({ ok: false, error, message }, { status });
}

/** http(s) on a public-looking host — everything else is rejected. */
function validateTargetUrl(raw: string): URL | null {
  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    return null;
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;
  const host = parsed.hostname.toLowerCase();
  const isPrivate =
    host === "localhost" ||
    host.endsWith(".local") ||
    host.endsWith(".internal") ||
    /^127\.|^10\.|^192\.168\.|^169\.254\.|^0\./.test(host) ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(host) ||
    host === "[::1]" ||
    !host.includes(".");
  return isPrivate ? null : parsed;
}

const MOCK_MARKDOWN = `# CS 3110 — Data Structures and Functional Programming
Lectures MWF 10:10–11:00, Gates Hall G01.
Grading: Problem Sets 30%, Prelim 1 15%, Prelim 2 15%, Final Exam 25%, Programming Project 10%, Participation 5%.
PS1 due Fri Sep 4. PS2 due Fri Sep 18. Prelim 1: Thursday, October 8, 7:30pm.
Final project due Wednesday, December 9. Final Exam: date TBD.`;

export async function POST(request: Request): Promise<NextResponse> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError(400, "invalid-input", "Request body must be JSON.");
  }

  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(400, "invalid-input", "That doesn't look like a link.");
  }

  const target = validateTargetUrl(parsed.data.url);
  if (!target) {
    return jsonError(
      400,
      "invalid-input",
      "Use a full public link, like https://cs.example.edu/courses/3110.",
    );
  }

  if (process.env.LLM_MOCK === "1") {
    await new Promise((resolve) => setTimeout(resolve, MOCK_LATENCY_MS));
    return NextResponse.json({ ok: true, markdown: MOCK_MARKDOWN });
  }

  const apiKey = process.env.FIRECRAWL_API_KEY;
  if (!apiKey) {
    return jsonError(
      503,
      "scrape-not-configured",
      "Link import isn't configured on this deployment — paste the syllabus text instead.",
    );
  }

  try {
    const response = await fetch("https://api.firecrawl.dev/v2/scrape", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        url: target.toString(),
        formats: ["markdown"],
        onlyMainContent: true,
      }),
      signal: AbortSignal.timeout(FIRECRAWL_TIMEOUT_MS),
    });

    if (!response.ok) {
      return jsonError(
        502,
        "scrape-failed",
        "Couldn't read that page — it may be private (Canvas/Blackboard logins can't be scraped). Paste the text instead.",
      );
    }

    const payload = (await response.json()) as {
      data?: { markdown?: string };
    };
    const markdown = payload.data?.markdown?.slice(0, MAX_MARKDOWN_CHARS);
    if (!markdown || markdown.trim().length < 40) {
      return jsonError(
        502,
        "scrape-failed",
        "That page came back empty — it may need a login. Paste the text instead.",
      );
    }

    return NextResponse.json({ ok: true, markdown });
  } catch {
    return jsonError(
      502,
      "scrape-failed",
      "Couldn't reach that page. Check the link, or paste the text instead.",
    );
  }
}
