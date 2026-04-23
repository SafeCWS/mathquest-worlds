import type { NextConfig } from "next";

const isGitHubPages = Boolean(process.env.GITHUB_PAGES);

const nextConfig: NextConfig = {
  output: isGitHubPages ? "export" : "standalone",
  basePath: isGitHubPages ? "/mathquest-worlds" : "",
  trailingSlash: isGitHubPages ? true : false,
  images: isGitHubPages ? { unoptimized: true } : {},
  // COOP header is only emitted on the Node server (standalone build).
  // Static export (`output: "export"`) does not support async headers(),
  // and GitHub Pages is being sunset in favor of Render — but we keep
  // the conditional intact as an emergency fallback.
  ...(isGitHubPages
    ? {}
    : {
        async headers() {
          return [
            {
              source: "/:path*",
              headers: [
                // Required for Google Identity Services popup flow on
                // Safari/macOS. Without this header, the OAuth popup
                // closes silently before the auth code is returned.
                {
                  key: "Cross-Origin-Opener-Policy",
                  value: "same-origin-allow-popups",
                },
                // Force HTTPS for 2 years, include subdomains, request
                // preload list inclusion. Render serves HTTPS-only so
                // this is safe.
                {
                  key: "Strict-Transport-Security",
                  value: "max-age=63072000; includeSubDomains; preload",
                },
                // Block MIME-sniffing. If we serve a .js with the wrong
                // Content-Type, the browser will refuse to execute it
                // rather than guess.
                {
                  key: "X-Content-Type-Options",
                  value: "nosniff",
                },
                // Send the Origin on cross-origin requests but strip
                // the path/query. Protects any tokens that might end
                // up in URLs without breaking analytics.
                {
                  key: "Referrer-Policy",
                  value: "strict-origin-when-cross-origin",
                },
                // We never embed the game in an iframe. Refuse all
                // framing — this is the belt-and-suspenders complement
                // to a CSP frame-ancestors directive.
                {
                  key: "X-Frame-Options",
                  value: "DENY",
                },
                // CSP intentionally NOT set here. Google Identity
                // Services popup requires `frame-src accounts.google.com`
                // plus nonce-based `script-src`, which needs deeper
                // config (middleware-generated nonce + per-request
                // header). Flagged as tech debt — add once the auth
                // flow is stable in production.
              ],
            },
          ];
        },
      }),
};

export default nextConfig;
