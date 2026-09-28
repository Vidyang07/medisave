import http from "http";

const checkUrl = (url) => {
  return new Promise((resolve) => {
    const req = http.get(url, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        resolve({
          url,
          statusCode: res.statusCode,
          contentType: res.headers["content-type"],
          length: data.length,
          success: res.statusCode >= 200 && res.statusCode < 400,
        });
      });
    });
    req.on("error", (err) => {
      resolve({ url, error: err.message, success: false });
    });
  });
};

async function runTests() {
  console.log("===============================================================");
  console.log("MEDISAVE FRONTEND & BACKEND ROUTE AVAILABILITY VERIFICATION");
  console.log("===============================================================");

  const routes = [
    "http://localhost:5173/",
    "http://localhost:5173/buy",
    "http://localhost:5173/sell",
    "http://localhost:5173/dashboard",
    "http://localhost:5173/profile",
    "http://localhost:5173/admin",
    "http://localhost:5173/login",
    "http://localhost:5173/signup",
    "http://localhost:5173/terms",
    "http://localhost:5173/privacy",
    "http://localhost:5000/api/medicines",
  ];

  let passed = 0;
  let failed = 0;

  for (const url of routes) {
    const res = await checkUrl(url);
    if (res.success) {
      console.log(`[PASS] ${url} -> Status: ${res.statusCode} (${res.length} bytes)`);
      passed++;
    } else {
      console.error(`[FAIL] ${url} -> Status: ${res.statusCode || "ERROR"} (${res.error || ""})`);
      failed++;
    }
  }

  console.log("===============================================================");
  console.log(`ROUTE VERIFICATION SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log("===============================================================");
  process.exit(failed > 0 ? 1 : 0);
}

runTests();
