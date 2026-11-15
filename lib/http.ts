import { NextRequest, NextResponse } from "next/server";

export function jsonError(status: number, error: string) {
  return NextResponse.json({ error }, { status });
}

export function noContent() {
  return new NextResponse(null, { status: 204 });
}

// Accepts a positive whole number given as a number or a string of digits.
export function parseId(value: unknown): number | null {
  if (typeof value === "number") {
    return Number.isInteger(value) && value > 0 ? value : null;
  }
  if (typeof value === "string" && /^\d+$/.test(value)) {
    const id = Number(value);
    return id > 0 && Number.isSafeInteger(id) ? id : null;
  }
  return null;
}

// Returns the parsed body, or undefined when it is missing or not valid JSON.
export async function readJsonBody(request: NextRequest): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    return undefined;
  }
}
