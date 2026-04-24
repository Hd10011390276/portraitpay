// Extended QA: portrait and blockchain endpoints
const https = require("https");
const http = require("http");

const BASE_URL = "https://portraitpayai.com";

function httpRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const isHttps = u.protocol === "https:";
    const reqOptions = {
      hostname: u.hostname,
      port: u.port || (isHttps ? 443 : 80),
      path: u.pathname + u.search,
      method: options.method || "GET",
      headers: options.headers || {},
      timeout: 20000,
    };
    const client = isHttps ? https : http;
    const req = client.request(reqOptions, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try { resolve({ status: res.statusCode, headers: res.headers, body: JSON.parse(data) || data }); }
        catch { resolve({ status: res.statusCode, headers: res.headers, body: data }); }
      });
    });
    req.on("error", reject);
    req.on("timeout", () => { req.destroy(); reject(new Error("Timeout")); });
    if (options.body) req.write(options.body);
    req.end();
  });
}

async function run() {
  // Get token via login
  let token = null;
  let portraitId = null;
  
  const loginRes = await httpRequest(BASE_URL + "/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "test@test.com", password: "Test1234!" }),
  });
  
  if (loginRes.status === 200 && loginRes.body && loginRes.body.data && loginRes.body.data.accessToken) {
    token = loginRes.body.data.accessToken;
    console.log(`✅ Got token for API tests`);
  } else {
    console.log(`⚠️ Could not get token, body: ${JSON.stringify(loginRes.body).slice(0, 200)}`);
    return;
  }

  const authHeaders = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

  // Test GET /api/portraits to get a portrait ID
  const portraitsRes = await httpRequest(BASE_URL + "/api/portraits", { headers: authHeaders });
  console.log(`\nGET /api/portraits: [${portraitsRes.status}]`, JSON.stringify(portraitsRes.body).slice(0, 200));
  
  if (portraitsRes.status === 200 && portraitsRes.body && portraitsRes.body.data && portraitsRes.body.data.length > 0) {
    portraitId = portraitsRes.body.data[0].id || portraitsRes.body.data.portraits?.[0]?.id;
  }

  // Try POST /api/v1/face-compare with multipart/form-data (proper format)
  if (portraitId) {
    const portraitUrl = portraitsRes.body.data[0].imageUrl || portraitsRes.body.data[0]?.url;
    // Test with form data (simulate with proper content type check)
    console.log(`\n⚠️ face-compare requires multipart/form-data - need to test with actual file upload`);
    console.log(`   (Skipping form-data test in simple curl mode)`);
  }

  // Test GET /portraits/[id] page
  if (portraitId) {
    const viewRes = await httpRequest(BASE_URL + `/portraits/${portraitId}`, { headers: { /* no auth - should be public or 404 */ }});
    console.log(`\nGET /portraits/${portraitId}: [${viewRes.status}]`);
    if (viewRes.status === 200) console.log(`   (Public portrait page accessible)`);
  }

  // Test POST /api/portraits/[id]/certify (blockchain cert)
  if (portraitId) {
    try {
      const certifyRes = await httpRequest(BASE_URL + `/api/portraits/${portraitId}/certify`, {
        method: "POST",
        headers: authHeaders,
      });
      console.log(`\nPOST /api/portraits/${portraitId}/certify: [${certifyRes.status}]`, JSON.stringify(certifyRes.body).slice(0, 200));
    } catch (e) {
      console.log(`\nPOST /api/portraits/${portraitId}/certify: ERROR - ${e.message}`);
    }
  }

  // Test GET /api/v1/face-compare (if exists)
  try {
    const fcGetRes = await httpRequest(BASE_URL + "/api/v1/face-compare", { headers: authHeaders });
    console.log(`\nGET /api/v1/face-compare: [${fcGetRes.status}]`, JSON.stringify(fcGetRes.body).slice(0, 200));
  } catch (e) {
    console.log(`\nGET /api/v1/face-compare: ERROR - ${e.message}`);
  }

  // Test other protected pages
  const pages = ["/dashboard", "/portraits", "/portraits/upload", "/earnings", "/settings"];
  console.log(`\n=== Protected pages (with no auth) ===`);
  for (const p of pages) {
    try {
      const res = await httpRequest(BASE_URL + p);
      const loc = res.headers.location || "";
      console.log(`[${res.status}] ${p} -> ${loc}`);
    } catch (e) {
      console.log(`[ERR] ${p}: ${e.message}`);
    }
  }

  console.log(`\n=== DONE ===`);
}

run().catch(console.error);