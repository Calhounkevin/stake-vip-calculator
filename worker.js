/**
 * STAKE VIP ENGINE - EDGE ROUTING WORKER
 * Platform: Cloudflare Workers (Free Tier)
 */

// Target Configuration
const AFFILIATE_CODE = "VIPEDGE"; // Your primary affiliate tracking code
const TARGET_STAKE_COM = `https://stake.com/?c=${AFFILIATE_CODE}`;
const TARGET_STAKE_US = `https://stake.us/?c=${AFFILIATE_CODE}`;

// Default Security Headers
const SECURITY_HEADERS = {
  "X-Frame-Options": "DENY",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "no-referrer-when-downgrade",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS"
};

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // 1. Intercept Link Cloaking /play
    if (url.pathname === "/play" || url.pathname === "/play/") {
      const country = request.headers.get("cf-ipcountry") || "US";
      
      // Auto-route US traffic to Stake.us, all international traffic to Stake.com
      let destination = TARGET_STAKE_COM;
      if (country === "US") {
        destination = TARGET_STAKE_US;
      }

      return Response.redirect(destination, 302);
    }

    // 2. Fetch Original Static Asset from GitHub Pages
    const response = await fetch(request);
    const newHeaders = new Headers(response.headers);

    // Apply Hardened Edge Security Headers
    Object.keys(SECURITY_HEADERS).forEach(key => {
      newHeaders.set(key, SECURITY_HEADERS[key]);
    });

    // Custom Edge Caching for data.json (Edge Cache for 120 seconds)
    if (url.pathname.endsWith("data.json")) {
      newHeaders.set("Cache-Control", "public, max-age=120, s-maxage=120");
    }

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: newHeaders
    });
  }
};