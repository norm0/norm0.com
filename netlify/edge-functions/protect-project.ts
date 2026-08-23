import type { Context } from "@netlify/edge-functions";

const SESSION_LENGTH_SECONDS = 8 * 60 * 60;
const encoder = new TextEncoder();

type Project = {
  cookieName: string;
  cookiePath: string;
  name: string;
  passwordVariable: string;
  sessionSecretVariable: string;
};

function projectFromPath(pathname: string): Project | undefined {
  const parts = pathname.split("/").filter(Boolean);
  if (parts.length !== 2 || parts[0] !== "projects") return undefined;

  const slug = parts[1];
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) return undefined;

  const environmentPrefix = slug.replaceAll("-", "_").toUpperCase();
  const name = slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

  return {
    cookieName: `${slug}_session`,
    cookiePath: `/projects/${slug}`,
    name,
    passwordVariable: `${environmentPrefix}_PASSWORD`,
    sessionSecretVariable: `${environmentPrefix}_SESSION_SECRET`,
  };
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function loginPage(projectName: string, message = ""): Response {
  const safeProjectName = escapeHtml(projectName);
  const feedback = message
    ? `<p class="feedback" role="alert">${escapeHtml(message)}</p>`
    : "";

  return new Response(
    `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="robots" content="noindex, nofollow">
    <title>Protected project</title>
    <style>
      :root { color-scheme: light dark; }
      * { box-sizing: border-box; }
      body {
        min-height: 100vh;
        margin: 0;
        display: grid;
        place-items: center;
        padding: 1.5rem;
        background: #f4f2ed;
        color: #181818;
        font: 16px/1.5 system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      }
      main {
        width: min(100%, 25rem);
        padding: 2rem;
        border: 1px solid #d8d4ca;
        border-radius: 1rem;
        background: #fff;
        box-shadow: 0 1rem 3rem rgb(0 0 0 / 8%);
      }
      h1 { margin: 0 0 .5rem; font-size: 1.5rem; }
      p { margin: 0 0 1.5rem; color: #5b5852; }
      label { display: block; margin-bottom: .5rem; font-weight: 650; }
      input, button { width: 100%; min-height: 3rem; border-radius: .6rem; font: inherit; }
      input { border: 1px solid #aaa59b; padding: .65rem .8rem; background: #fff; color: #181818; }
      input:focus { outline: 3px solid rgb(24 24 24 / 20%); outline-offset: 2px; }
      button { margin-top: .8rem; border: 0; padding: .65rem 1rem; background: #181818; color: #fff; font-weight: 700; cursor: pointer; }
      button:hover { background: #343434; }
      .feedback { margin: 0 0 1rem; color: #a3261d; }
      @media (prefers-color-scheme: dark) {
        body { background: #171717; color: #f7f5f0; }
        main { border-color: #393939; background: #222; }
        p { color: #bdb9b0; }
        input { border-color: #68645e; background: #171717; color: #f7f5f0; }
        button { background: #f7f5f0; color: #181818; }
        button:hover { background: #dedbd4; }
        .feedback { color: #ff938a; }
      }
    </style>
  </head>
  <body>
    <main>
      <h1>Private project</h1>
      <p>Enter the password to view ${safeProjectName}.</p>
      ${feedback}
      <form method="post">
        <label for="password">Password</label>
        <input id="password" name="password" type="password" autocomplete="current-password" required autofocus>
        <button type="submit">View project</button>
      </form>
    </main>
  </body>
</html>`,
    {
      status: message ? 401 : 200,
      headers: {
        "Cache-Control": "no-store",
        "Content-Type": "text/html; charset=utf-8",
        "X-Content-Type-Options": "nosniff",
        "X-Frame-Options": "DENY",
      },
    },
  );
}

function getCookie(request: Request, name: string): string | undefined {
  const cookies = request.headers.get("cookie") ?? "";

  for (const cookie of cookies.split(";")) {
    const [key, ...value] = cookie.trim().split("=");
    if (key === name) return value.join("=");
  }

  return undefined;
}

function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);

  return btoa(binary)
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "");
}

async function sign(value: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(value));
  return toBase64Url(new Uint8Array(signature));
}

function safeEqual(left: string, right: string): boolean {
  const maxLength = Math.max(left.length, right.length);
  let difference = left.length ^ right.length;

  for (let index = 0; index < maxLength; index += 1) {
    difference |= (left.charCodeAt(index) || 0) ^ (right.charCodeAt(index) || 0);
  }

  return difference === 0;
}

async function validSession(
  request: Request,
  cookieName: string,
  secret: string,
): Promise<boolean> {
  const cookie = getCookie(request, cookieName);
  if (!cookie) return false;

  const [expiresAt, providedSignature] = cookie.split(".");
  if (!expiresAt || !providedSignature || !/^\d+$/.test(expiresAt)) return false;
  if (Number(expiresAt) <= Math.floor(Date.now() / 1000)) return false;

  const expectedSignature = await sign(expiresAt, secret);
  return safeEqual(providedSignature, expectedSignature);
}

export default async (request: Request, context: Context) => {
  const requestUrl = new URL(request.url);
  const project = projectFromPath(requestUrl.pathname);

  if (!project) {
    console.error(`Project protection is misconfigured for ${requestUrl.pathname}.`);
    return new Response("Protected page is not configured.", {
      status: 503,
      headers: { "Cache-Control": "no-store" },
    });
  }

  const password = Netlify.env.get(project.passwordVariable);
  const sessionSecret = Netlify.env.get(project.sessionSecretVariable);

  if (!password || !sessionSecret) {
    console.error(
      `${project.passwordVariable} and ${project.sessionSecretVariable} must be configured.`,
    );
    return new Response("Protected page is not configured.", {
      status: 503,
      headers: { "Cache-Control": "no-store" },
    });
  }

  if (request.method === "GET" && requestUrl.searchParams.get("logout") === "1") {
    return new Response(null, {
      status: 303,
      headers: {
        Location: requestUrl.pathname,
        "Cache-Control": "no-store",
        "Set-Cookie": `${project.cookieName}=; Path=${project.cookiePath}; Max-Age=0; HttpOnly; Secure; SameSite=Lax`,
      },
    });
  }

  if (await validSession(request, project.cookieName, sessionSecret)) {
    return context.next();
  }

  if (request.method === "POST") {
    const contentType = request.headers.get("content-type") ?? "";
    if (!contentType.startsWith("application/x-www-form-urlencoded")) {
      return new Response("Unsupported form submission.", { status: 415 });
    }

    const form = await request.formData();
    const submittedPassword = form.get("password");

    if (typeof submittedPassword === "string" && safeEqual(submittedPassword, password)) {
      const expiresAt = Math.floor(Date.now() / 1000) + SESSION_LENGTH_SECONDS;
      const signature = await sign(String(expiresAt), sessionSecret);

      return new Response(null, {
        status: 303,
        headers: {
          Location: requestUrl.pathname + requestUrl.search,
          "Cache-Control": "no-store",
          "Set-Cookie": `${project.cookieName}=${expiresAt}.${signature}; Path=${project.cookiePath}; Max-Age=${SESSION_LENGTH_SECONDS}; HttpOnly; Secure; SameSite=Lax`,
        },
      });
    }

    return loginPage(project.name, "That password wasn’t recognized. Please try again.");
  }

  if (request.method !== "GET" && request.method !== "HEAD") {
    return new Response("Method not allowed.", {
      status: 405,
      headers: { Allow: "GET, HEAD, POST" },
    });
  }

  return loginPage(project.name);
};
