import { NextResponse } from "next/server";
import { APICallError, generateObject, NoObjectGeneratedError } from "ai";

import { todayISO } from "@/lib/dates/iso";
import { MOCK_EXTRACTION } from "@/lib/extraction/mock";
import { preprocessSyllabus } from "@/lib/extraction/preprocess";
import {
  buildExtractionMessages,
  buildRepairMessage,
  type PromptMessage,
} from "@/lib/extraction/prompt";
import {
  extractionSchema,
  extractRequestSchema,
  type ExtractResponse,
} from "@/lib/extraction/schema";
import {
  getExtractionModel,
  isMockMode,
  isProviderConfigured,
} from "@/lib/llm/provider";

export const runtime = "nodejs";
export const maxDuration = 60;

const HARD_INPUT_CAP = 32_000;
const MOCK_LATENCY_MS = 800;

function jsonError(
  status: number,
  error: Extract<ExtractResponse, { ok: false }>["error"],
  message: string,
): NextResponse {
  return NextResponse.json({ ok: false, error, message }, { status });
}

async function callModel(messages: PromptMessage[]) {
  return generateObject({
    model: getExtractionModel(),
    schema: extractionSchema,
    messages,
    temperature: 0,
  });
}

export async function POST(request: Request): Promise<NextResponse> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError(400, "invalid-input", "Request body must be JSON.");
  }

  const parsed = extractRequestSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(
      400,
      "invalid-input",
      "That doesn't look like a syllabus yet — paste at least a few lines of it.",
    );
  }

  if (isMockMode()) {
    await new Promise((resolve) => setTimeout(resolve, MOCK_LATENCY_MS));
    return NextResponse.json({ ok: true, result: MOCK_EXTRACTION });
  }

  if (!isProviderConfigured()) {
    return jsonError(
      503,
      "provider-not-configured",
      "AI extraction isn't configured on this deployment yet. You can still add courses manually.",
    );
  }

  const text = preprocessSyllabus(
    parsed.data.text.slice(0, HARD_INPUT_CAP),
  );
  const messages = buildExtractionMessages(text, todayISO());

  try {
    const { object } = await callModel(messages);
    return NextResponse.json({ ok: true, result: object });
  } catch (firstError: unknown) {
    if (APICallError.isInstance(firstError) && firstError.statusCode === 429) {
      return jsonError(
        429,
        "rate-limited",
        "The AI provider is rate-limiting us — wait a few seconds and try again.",
      );
    }

    if (NoObjectGeneratedError.isInstance(firstError)) {
      try {
        const repair = buildRepairMessage(
          firstError.text ?? "",
          String(firstError.cause ?? "schema mismatch"),
        );
        const { object } = await callModel([...messages, ...repair]);
        return NextResponse.json({ ok: true, result: object });
      } catch {
        return jsonError(
          422,
          "extraction-failed",
          "The AI couldn't produce a clean read of this syllabus. Try pasting just the grading and schedule sections, or add the course manually.",
        );
      }
    }

    return jsonError(
      502,
      "provider-down",
      "Couldn't reach the AI provider. Check your connection or try again shortly.",
    );
  }
}
