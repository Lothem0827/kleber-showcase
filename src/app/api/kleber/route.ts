import { NextResponse } from "next/server";
import { DEFAULT_KLEBER_URL } from "@/lib/kleber/methods";
import type { KleberRequest, KleberResponse } from "@/lib/kleber/types";

export async function POST(request: Request) {
  const kleberUrl = process.env.KLEBER_URL?.trim() || DEFAULT_KLEBER_URL;

  let body: KleberRequest;
  try {
    body = (await request.json()) as KleberRequest;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const kleberKey =
    body.requestKey?.trim() || process.env.KLEBER_KEY?.trim() || "";

  if (!kleberKey) {
    return NextResponse.json(
      { error: "KLEBER_KEY is not configured on the server." },
      { status: 500 },
    );
  }

  if (!body.method) {
    return NextResponse.json({ error: "Method is required." }, { status: 400 });
  }

  const payload = new URLSearchParams();
  payload.set("RequestKey", kleberKey);
  payload.set("Method", body.method);
  payload.set("OutputFormat", "json");

  Object.entries(body.params ?? {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && String(value).length > 0) {
      payload.set(key, String(value));
    }
  });

  try {
    const response = await fetch(kleberUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: payload.toString(),
      cache: "no-store",
    });

    const data = (await response.json()) as KleberResponse;

    if (!response.ok) {
      return NextResponse.json(
        {
          error: data.DtResponse?.ErrorMessage ?? "Kleber service request failed.",
          DtResponse: data.DtResponse,
        },
        { status: response.status },
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to reach Kleber service.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
