// Comprehensive QA test for portraitpayai.com - v2
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
        try {
          resolve({ status: res.statusCode, headers: res.headers, body: JSON.parse(data) || data });
        } catch {
          resolve({ status: res.statusCode, headers: res.headers, body: data });
        }
      });
    });
    req.on("error", reject);
    req.on("timeout", () => { req.destroy(); reject(new Error("Timeout")); });
    if (options.body) req.write(options.body);
    req.end();
  });
}

async function testUrl(path, expectedStatus, description) {
  try {
    const res = await httpRequest(BASE_URL + path);
    const passed = res.status === expectedStatus;
    console.log(`${passed ? "✅" : "❌"} [${res.status}] ${description}: ${path}`);
    if (!passed) console.log(`   Expected: ${expectedStatus}, Got: ${res.status}, Location: ${res.headers.location || "none"}`);
    return passed;
  } catch (e) {
    console.log(`❌ [ERR] ${description}: ${path} - ${e.message}`);
    return false;
  }
}

async function testApiJson(path, method, body, expectedStatus, description, headers = {}) {
  try {
    const res = await httpRequest(BASE_URL + path, {
      method,
      headers: { "Content-Type": "application/json", ...headers },
      body: body ? JSON.stringify(body) : undefined,
    });
    const passed = res.status === expectedStatus;
    console.log(`${passed ? "✅" : "❌"} [${res.status}] ${description}`);
    if (!passed) console.log(`   Expected: ${expectedStatus}, Got: ${res.status}, Body: ${JSON.stringify(res.body).slice(0, 400)}`);
    return passed;
  } catch (e) {
    console.log(`❌ [ERR] ${description} - ${e.message}`);
    return false;
  }
}

async function run() {
  console.log("=== PUBLIC PAGES ===");
  await testUrl("/", 200, "Home page");
  await testUrl("/login", 200, "Login page");
  await testUrl("/register", 200, "Register page");
  await testUrl("/forgot-password", 200, "Forgot password page");
  await testUrl("/terms", 200, "Terms page");
  await testUrl("/privacy", 200, "Privacy page");
  await testUrl("/contact", 200, "Contact page");
  await testUrl("/celebrity", 200, "Celebrity page");
  await testUrl("/enterprise/authorization/apply", 200, "Enterprise authorization apply");

  console.log("\n=== PROTECTED PAGES (should redirect to login) ===");
  const protectedPages = ["/dashboard", "/portraits", "/portraits/upload", "/earnings", "/settings"];
  for (const p of protectedPages) {
    try {
      const res = await httpRequest(BASE_URL + p);
      const redirected = res.status === 307 || res.status === 302 || res.status === 301;
      const loc = res.headers.location || "";
      console.log(`${redirected && loc.includes("login") ? "✅" : "❌"} [${res.status}] Protected page redirects to login: ${p} (location: ${loc})`);
    } catch (e) {
      console.log(`❌ [ERR] ${p} - ${e.message}`);
    }
  }

  // /api-keys is a page, not API - check behavior
  try {
    const res = await httpRequest(BASE_URL + "/api-keys");
    console.log(`   [${res.status}] /api-keys page response (protected, should redirect): ${res.headers.location || "none"}`);
  } catch (e) {
    console.log(`❌ [ERR] /api-keys - ${e.message}`);
  }

  console.log("\n=== AUTH API TESTS ===");
  await testApiJson("/api/auth/login", "POST", { email: "test@test.com", password: "wrongpassword" }, 401, "Login with wrong password → 401");
  
  // Register with ALL required fields
  const ts = Date.now();
  await testApiJson("/api/auth/register", "POST", {
    email: `qa_${ts}@test.com`,
    password: "Test1234!",
    confirmPassword: "Test1234!",
    name: "QA Test User",
    role: "user"
  }, 201, "Register new user with all fields → 201");

  // Test login with real credentials (use known test account)
  await testApiJson("/api/auth/login", "POST", { email: "test@test.com", password: "Test1234!" }, 200, "Login with correct password → 200");
  await testApiJson("/api/auth/forgot-password", "POST", { email: "test@test.com" }, 200, "Forgot password → 200");

  console.log("\n=== PROTECTED API TESTS (with token from login) ===");
  // First login to get a fresh token
  let token = null;
  try {
    const loginRes = await httpRequest(BASE_URL + "/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "test@test.com", password: "Test1234!" }),
    });
    if (loginRes.status === 200 && loginRes.body && loginRes.body.data && loginRes.body.data.accessToken) {
      token = loginRes.body.data.accessToken;
      console.log(`✅ [200] Got access token from login`);
    } else if (loginRes.status === 200 && loginRes.body && loginRes.body.token) {
      token = loginRes.body.token;
      console.log(`✅ [200] Got access token from login (flat)`);
    } else {
      console.log(`⚠️  Login response body:`, JSON.stringify(loginRes.body).slice(0, 300));
    }
  } catch (e) {
    console.log(`❌ Login failed: ${e.message}`);
  }

  if (token) {
    const authHeaders = { Authorization: `Bearer ${token}` };
    await testApiJson("/api/portraits", "GET", null, 200, "GET /api/portraits with token → 200", authHeaders);
    await testApiJson("/api/v1/face-compare", "POST", { face1: "test_url", face2: "test_url" }, 200, "POST /api/v1/face-compare with token → 200", authHeaders);
    await testApiJson("/api/portraits", "POST", { title: "Test Portrait", description: "QA test" }, 201, "POST /api/portraits create portrait → 201", authHeaders);
  } else {
    console.log("⚠️  Skipping authenticated API tests - no token");
  }

  console.log("\n=== CHECKING EXISTING LAWYER REGISTRATION PAGE ===");
  try {
    const res = await httpRequest(BASE_URL + "/enterprise/lawyer-registration");
    console.log(`   [${res.status}] /enterprise/lawyer-registration page`);
  } catch (e) {
    console.log(`   Not found: /enterprise/lawyer-registration`);
  }
  try {
    const res = await httpRequest(BASE_URL + "/lawyers/apply");
    console.log(`   [${res.status}] /lawyers/apply page`);
  } catch (e) {
    console.log(`   Not found: /lawyers/apply`);
  }

  console.log("\n=== DONE ===");
}

run().catch(console.error);