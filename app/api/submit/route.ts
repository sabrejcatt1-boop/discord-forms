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
  return value.slice(0, max - 1) + "…";
};

type EmbedField = {
  name: string;
  value: string;
  inline?: boolean;
};

const splitFieldsByLength = (fields: EmbedField[], limit = 5500) => {
  const groups: EmbedField[][] = [];
  let current: EmbedField[] = [];
  let total = 0;

  fields.forEach((field) => {
    const length = field.name.length + field.value.length;
    if (current.length > 0 && total + length > limit) {
      groups.push(current);
      current = [];
      total = 0;
    }

    current.push(field);
    total += length;
  });

  if (current.length > 0) {
    groups.push(current);
  }

  return groups;
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

  const fields: EmbedField[] = REQUIRED_FIELDS.map((key) => ({
    name: FIELD_LABELS[key],
    value: truncate(values[key]) || "Not provided",
    inline: false
  }));

  fields.push({
    name: "Optional contact",
    value: contact ? truncate(contact) : "Not provided",
    inline: false
  });

  const id = Math.random().toString(36).slice(2, 8).toUpperCase();
  const timestamp = new Date().toISOString();
  const footerText = `ID: ${id} • ${timestamp.replace("T", " ").replace("Z", " UTC")}`;

  const fieldGroups = splitFieldsByLength(fields, 5500).slice(0, 2);

  const embeds = fieldGroups.map((group, index) => ({
    title:
      index === 0 ? "New Survey Response" : "New Survey Response (cont.)",
    color: 0x22d3ee,
    fields: group,
    timestamp,
    ...(index === fieldGroups.length - 1
      ? { footer: { text: footerText } }
      : {})
  }));

  const discordResponse = await fetch(webhookUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      content: "",
      embeds
    })
  });

  if (!discordResponse.ok) {
    return NextResponse.json(
      { ok: false, error: "Failed to send message." },
      { status: 502 }
    );
  }

  return NextResponse.json({ ok: true });
}
