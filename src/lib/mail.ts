export function invitationLink(token: string): string {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  return `${base}/invite?token=${encodeURIComponent(token)}`;
}

export async function sendInvitationEmail(opts: {
  to: string;
  name: string;
  restaurant: string;
  link: string;
}): Promise<{ sent: boolean; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.log(`[mail:dev] Invitación para ${opts.to}: ${opts.link}`);
    return { sent: false, error: "RESEND_API_KEY no está configurada" };
  }

  const from = process.env.MAIL_FROM ?? "TuComida <onboarding@resend.dev>";
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
      <h2 style="color: #af5331;">TuComida</h2>
      <p>Hola ${opts.name},</p>
      <p><strong>${opts.restaurant}</strong> te invitó a unirte a su equipo en TuComida.</p>
      <p>Creá tu contraseña para empezar a trabajar:</p>
      <p style="text-align: center; margin: 24px 0;">
        <a href="${opts.link}" style="background: #af5331; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; display: inline-block;">
          Aceptar invitación
        </a>
      </p>
      <p style="color: #888; font-size: 13px;">O copiá este enlace: ${opts.link}</p>
    </div>
  `;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [opts.to],
        subject: `Invitación a ${opts.restaurant} en TuComida`,
        html,
      }),
    });
    if (res.ok) return { sent: true };
    const body = await res.json().catch(() => null);
    const message =
      typeof body?.message === "string"
        ? body.message
        : `Resend respondió con error ${res.status}`;
    console.log(`[mail:fail] ${opts.to}: ${message}`);
    return { sent: false, error: message };
  } catch {
    console.log(`[mail:feed] No se pudo enviar correo a ${opts.to}: ${opts.link}`);
    return { sent: false, error: "No se pudo conectar con Resend" };
  }
}