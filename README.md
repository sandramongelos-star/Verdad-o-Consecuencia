# Verdad o Consecuencia — Cloudflare Workers

Aplicación web en español: pide el nombre del jugador, deja elegir Verdad o Consecuencia en cada ronda y envía cada respuesta o archivo al correo configurado. Incluye 10 rondas y preguntas/retos elegidos al azar.

## Antes de publicar

El email **no puede enviarse directamente desde el navegador** de forma segura. Esta app usa un Cloudflare Worker como backend y Resend como proveedor de correo. No publiques una API key dentro del HTML.

### 1) Requisitos
- Cuenta de Cloudflare.
- Cuenta de Resend (https://resend.com).
- Un dominio verificado en Resend para usar como remitente. El remitente debe ser del dominio verificado.

### 2) Instalar Wrangler
Requiere Node.js instalado:
```bash
npm install -g wrangler
wrangler login
```

### 3) Configurar el remitente y la API key
Desde la carpeta del proyecto:
```bash
wrangler secret put RESEND_API_KEY
```
Pegá la API key de Resend cuando la solicite.

Definí un remitente autorizado en el dominio verificado:
```bash
wrangler secret put FROM_EMAIL
```
Ejemplo de valor: `Juego <juego@tudominio.com>` (reemplazar por el remitente real verificado).

El destinatario está fijado en `src/worker.js` como `Sandra.mongelos@gmail.com`.

### 4) Publicar
```bash
wrangler deploy
```
Wrangler publicará los archivos de `public/` como assets y el Worker para `/api/send`. La URL publicada aparecerá en la salida del comando.

## Límites y privacidad
- El archivo se adjunta al email; máximo 18 MB por archivo en la interfaz y el backend. Los límites efectivos también dependen de Cloudflare y Resend.
- No se almacenan los archivos en una base de datos ni en R2. El Worker los procesa para enviarlos y no implementa una galería pública.
- Antes de jugar, la persona confirma que entiende que se enviarán sus respuestas/archivos al correo indicado.
- No subas contenido íntimo, material de menores, ni fotos/audios/videos de otras personas sin permiso.
- Para usarlo con un grupo amplio, se recomienda añadir CAPTCHA/rate limiting y una política de privacidad. La app no incluye autenticación y la URL puede ser compartida.
- La ronda de video de la ruta incluye un aviso de seguridad: grabar solo estando detenido/a y en un lugar seguro.

## Personalización
- Preguntas y consecuencias: `public/index.html`, arrays `truths` y `dares`.
- Destinatario: constante `DESTINATION` en `src/worker.js`.
- El envío se realiza por cada ronda confirmada; no hay un botón de envío automático sin interacción del jugador.
