const MAX_FILE_BYTES = 18 * 1024 * 1024;
const DESTINATION = "Sandra.mongelos@gmail.com";

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/api/send" && request.method === "POST") {
      if (!env.RESEND_API_KEY || !env.FROM_EMAIL) {
        return json({ error: "Falta configurar RESEND_API_KEY y FROM_EMAIL en Cloudflare." }, 500);
      }
      try {
        const form = await request.formData();
        const player = clean(form.get("player"), 70);
        const type = clean(form.get("type"), 30);
        const prompt = clean(form.get("prompt"), 500);
        const round = clean(form.get("round"), 10);
        if (!player || !prompt || !["Verdad", "Consecuencia"].includes(type)) {
          return json({ error: "Faltan datos válidos del juego." }, 400);
        }
        const subject = `Verdad o Consecuencia · ${player} · ${type}`;
        const lines = [
          "Juego: Verdad o Consecuencia",
          `Jugador/a: ${player}`,
          `Ronda: ${round || "—"}`,
          `Tipo: ${type}`,
          `Consigna: ${prompt}`,
          type === "Verdad" ? `Respuesta: ${clean(form.get("answer"), 4000) || "(sin respuesta)"}` : "Archivo adjunto: ver archivo."
        ];
        const email = {
          from: env.FROM_EMAIL,
          to: [DESTINATION],
          subject,
          text: lines.join("\n")
        };
        const file = form.get("file");
        if (file && typeof file === "object" && "arrayBuffer" in file && file.size > 0) {
          if (file.size > MAX_FILE_BYTES) return json({ error: "El archivo supera el límite de 18 MB." }, 413);
          const bytes = new Uint8Array(await file.arrayBuffer());
          let binary = "";
          const chunkSize = 0x8000;
          for (let i = 0; i < bytes.length; i += chunkSize) {
            binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
          }
          email.attachments = [{
            filename: safeFilename(file.name || "archivo"),
            content: btoa(binary)
          }];
          email.text += `\nNombre del archivo: ${safeFilename(file.name || "archivo")}\nTamaño: ${file.size} bytes`;
        }
        const response = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json" },
          body: JSON.stringify(email)
        });
        const result = await response.json().catch(() => ({}));
        if (!response.ok) {
          return json({ error: result.message || result.name || "El proveedor de email rechazó el envío." }, 502);
        }
        return json({ ok: true, id: result.id || null });
      } catch (err) {
        return json({ error: "Error procesando el envío. Probá con un archivo más pequeño." }, 500);
      }
    }
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders() });
    }
    return env.ASSETS.fetch(request);
  }
};

function clean(value, max) {
  return String(value ?? "").replace(/[<>]/g, "").trim().slice(0, max);
}
function safeFilename(name) {
  return String(name).replace(/[^\w.\-() ]/g, "_").slice(0, 120) || "archivo";
}
function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status, headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" }
  });
}
function corsHeaders() {
  return { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type" };
}