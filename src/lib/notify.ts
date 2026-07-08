import "server-only";
import { Resend } from "resend";

let resend: Resend | null = null;
function getResend() {
  if (!process.env.RESEND_API_KEY) return null;
  if (!resend) resend = new Resend(process.env.RESEND_API_KEY);
  return resend;
}

export async function notifyBuilderOfQuestion(opts: {
  familyName: string;
  lot: string;
  categoryLabel: string;
  question: string;
  token: string;
}) {
  const client = getResend();
  const to = process.env.BUILDER_NOTIFY_EMAIL;
  if (!client || !to) return;

  const baseUrl = process.env.APP_BASE_URL ?? "https://meadows-selections.vercel.app";
  const portalUrl = `${baseUrl}/portal/${opts.token}`;

  try {
    const { error } = await client.emails.send({
      from: "Meadows Selections Portal <onboarding@resend.dev>",
      to,
      subject: `New question from ${opts.familyName} — Lot ${opts.lot}`,
      text: `${opts.familyName} family (Lot ${opts.lot}) asked about ${opts.categoryLabel}:\n\n"${opts.question}"\n\nView their portal: ${portalUrl}`,
    });
    if (error) console.error("Resend rejected buyer-question notification email:", error);
  } catch (err) {
    console.error("Failed to send buyer-question notification email:", err);
  }
}
