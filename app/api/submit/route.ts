import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

declare global {
  // eslint-disable-next-line no-var
  var __rateLimitMap: Map<string, RateLimitEntry> | undefined;
}

const rateLimitMap: Map<string, RateLimitEntry> =
  globalThis.__rateLimitMap ?? new Map();

if (!globalThis.__rateLimitMap) {
  globalThis.__rateLimitMap = rateLimitMap;
}

const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;
const MAX_INPUT_LENGTH = 2000;

const REQUIRED_FIELDS = [
  "role",
  "frustration",
  "stuckOn",
  "triedTools",
  "wantHelp",
  "benefit",
  "pay",
  "dealbreaker",
  "magic"
] as const;

const FIELD_LABELS: Record<(typeof REQUIRED_FIELDS)[number], string> = {
  role: "Role",
  frustration: "Weekly frustration",
  stuckOn: "Stuck on",
  triedTools: "Tried tools",
  wantHelp: "Want help with",
  benefit: "Biggest benefit",
  pay: "Pay willingness",
  dealbreaker: "Dealbreaker",
  magic: "Magic button"
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const getClientIp = (request: NextRequest) => {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }

  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp;

  return "unknown";
};

const normalize = (value: unknown) =>
  typeof value === "string" ? value.trim() : "";

const truncate = (value: string, max = 1024) => {
  if (value.length <= max) return value;
  return value.slice(0, max - 3) + "...";
};

type EmbedField = {
  name: string;
  value: string;
  inline?: boolean;
};

const quoteMultiline = (value: string) =>
  value
    .replace(/\r\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .split("\n")
    .map((line) => `> ${line}`)
    .join("\n");

const fieldValue = (value: string, max = 1024) => {
  if (!value) return "Not provided";
  return truncate(quoteMultiline(value), max);
};

export async function POST(request: NextRequest) {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
  if (!webhookUrl) {
    return NextResponse.json(
      { ok: false, error: "Server is not configured." },
      { status: 500 }
    );
  }

  let payload: Record<string, unknown>;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid request body." },
      { status: 400 }
    );
  }

  const honeypot = normalize(payload.company);
  if (honeypot) {
    return NextResponse.json({ ok: true });
  }

  const ip = getClientIp(request);
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
  } else if (entry.count >= RATE_LIMIT_MAX) {
    return NextResponse.json(
      { ok: false, error: "Too many submissions. Try again later." },
      { status: 429 }
    );
  } else {
    entry.count += 1;
    rateLimitMap.set(ip, entry);
  }

  const values: Record<string, string> = {};
  const missing: string[] = [];

  REQUIRED_FIELDS.forEach((key) => {
    const value = normalize(payload[key]);
    if (!value) {
      missing.push(key);
    }
    values[key] = value;
  });

  if (missing.length > 0) {
    return NextResponse.json(
      { ok: false, error: "Missing required fields." },
      { status: 400 }
    );
  }

  const contact = normalize(payload.contact);
  if (contact && !emailPattern.test(contact)) {
    return NextResponse.json(
      { ok: false, error: "Please provide a valid email address." },
      { status: 400 }
    );
  }

  const tooLong = REQUIRED_FIELDS.some((key) => values[key].length > MAX_INPUT_LENGTH);
  if (tooLong || contact.length > 200) {
    return NextResponse.json(
      { ok: false, error: "One or more answers are too long." },
      { status: 400 }
    );
  }

  const id = Math.random().toString(36).slice(2, 8).toUpperCase();
  const timestamp = new Date().toISOString();
  const footerText = `ID: ${id} | ${timestamp.replace("T", " ").replace("Z", " UTC")}`;

  const summaryFields: EmbedField[] = [
    { name: FIELD_LABELS.role, value: truncate(values.role, 256), inline: true },
    { name: FIELD_LABELS.stuckOn, value: truncate(values.stuckOn, 256), inline: true },
    { name: FIELD_LABELS.benefit, value: truncate(values.benefit, 256), inline: true },
    { name: FIELD_LABELS.pay, value: truncate(values.pay, 256), inline: true },
    {
      name: "Optional contact",
      value: contact ? truncate(contact, 256) : "Not provided",
      inline: true
    }
  ];

  const detailFields: EmbedField[] = [
    { name: FIELD_LABELS.frustration, value: fieldValue(values.frustration), inline: false },
    { name: FIELD_LABELS.triedTools, value: fieldValue(values.triedTools), inline: false },
    { name: FIELD_LABELS.wantHelp, value: fieldValue(values.wantHelp), inline: false },
    { name: FIELD_LABELS.dealbreaker, value: fieldValue(values.dealbreaker), inline: false },
    { name: FIELD_LABELS.magic, value: fieldValue(values.magic), inline: false }
  ];

  const embeds = [
    {
      title: "New Founder Survey Response",
      color: 0x22d3ee,
      description:
        "A new submission is in. Quick summary is below, with full answers in the next embed.",
      fields: summaryFields,
      timestamp
    },
    {
      title: "Full Responses",
      color: 0x14b8a6,
      fields: detailFields,
      timestamp,
      footer: { text: footerText }
    }
  ];

  let discordResponse: Response;
  try {
    discordResponse = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        content: "@here New survey response received.",
        allowed_mentions: {
          parse: ["everyone"]
        },
        embeds,
        username: "Founder Survey Bot"
      })
    });
  } catch {
    return NextResponse.json(
      { ok: false, error: "Unable to reach Discord right now." },
      { status: 502 }
    );
  }

  if (!discordResponse.ok) {
    return NextResponse.json(
      { ok: false, error: "Failed to send message." },
      { status: 502 }
    );
  }

  return NextResponse.json({ ok: true });
}
