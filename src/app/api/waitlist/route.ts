// POST /api/waitlist — store a landing-page email. Uses the Supabase secret
// key server-side (service role bypasses RLS); the email is never exposed to
// the client. Duplicate emails are treated as success ("already on the list").

import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export async function POST(req: Request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) {
    return Response.json(
      { error: "The waitlist isn't available right now." },
      { status: 503 },
    );
  }

  let email = "";
  try {
    ({ email } = (await req.json()) as { email: string });
  } catch {
    return Response.json({ error: "Invalid request." }, { status: 400 });
  }
  email = (email ?? "").trim().toLowerCase();
  if (!EMAIL_RE.test(email)) {
    return Response.json({ error: "Please enter a valid email." }, { status: 400 });
  }

  const supa = createClient(url, key, { auth: { persistSession: false } });
  const { error } = await supa.from("waitlist").insert({ email });

  if (error) {
    if (error.code === "23505") {
      return Response.json({ ok: true, already: true }); // unique violation
    }
    return Response.json(
      { error: "Couldn't join the waitlist. Please try again." },
      { status: 500 },
    );
  }
  return Response.json({ ok: true });
}
