const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const Module = require("node:module");
const ts = require("typescript");

// Transpile the real TypeScript modules in memory. No network or database is used.
function load(file, mocks = {}) {
  const filename = path.resolve(__dirname, "..", file);
  const compiled = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 }
  }).outputText;
  const module = new Module(filename);
  module.filename = filename;
  module.paths = Module._nodeModulePaths(path.dirname(filename));
  const originalRequire = module.require.bind(module);
  module.require = (name) => Object.hasOwn(mocks, name) ? mocks[name] : originalRequire(name);
  module._compile(compiled, filename);
  return module.exports;
}

const validation = load("lib/payment-validation.ts");
const requestValidation = load("lib/payment-request.ts");
const expected = { amountCents: 1150, clientTransactionId: "si-test", providerTransactionId: "123" };
const approved = { amount: 1150, clientTransactionId: "si-test", transactionId: 123, currency: "USD", statusCode: 3, transactionStatus: "Approved" };

test("amount parsing uses integer cents and accepts comma or dot", () => {
  for (const [input, output] of [["1", 100], ["10.01", 1001], ["10,5", 1050], ["5000.00", 500000]]) assert.equal(validation.parseAmountCents(input), output);
});
test("rejects zero, negatives, excessive precision, malformed and excessive amounts", () => {
  for (const input of ["", "0", "0.99", "-1", "1.001", "5e2", "5,000.00", "5000.01", "Infinity", "abc"]) assert.equal(validation.parseAmountCents(input), null, input);
});
test("the simple form requires only a concept, amount and explicit confirmation", () => {
  const valid = { concept: "Anticipo de servicio", amount: "10", accepted: true };
  assert.equal(validation.paymentInputSchema.safeParse(valid).success, true);
  for (const key of Object.keys(valid)) assert.equal(validation.paymentInputSchema.safeParse({ ...valid, [key]: key === "accepted" ? false : "" }).success, false, key);
});
test("only a fully matching provider approval is accepted", () => {
  assert.equal(validation.assessConfirmation(approved, expected), "APPROVED");
  for (const change of [{ amount: 1 }, { clientTransactionId: "different" }, { transactionId: 999 }, { currency: "EUR" }, { currency: undefined }, { statusCode: 2 }, { transactionStatus: "Pending" }]) {
    assert.equal(validation.assessConfirmation({ ...approved, ...change }, expected), "REVIEW");
  }
});
test("recognizes a verified cancellation", () => {
  assert.equal(validation.assessConfirmation({ ...approved, statusCode: 2, transactionStatus: "Canceled" }, expected), "CANCELLED");
});

async function withGateway(callback, { claim = true, response = approved, failure = false } = {}) {
  const keys = ["PAYPHONE_ENABLED", "PAYPHONE_TOKEN", "PAYPHONE_STORE_ID", "PAYPHONE_ENVIRONMENT"];
  const previous = Object.fromEntries(keys.map((key) => [key, process.env[key]]));
  const oldFetch = global.fetch;
  Object.assign(process.env, { PAYPHONE_ENABLED: "true", PAYPHONE_TOKEN: "mock-token", PAYPHONE_STORE_ID: "mock-store", PAYPHONE_ENVIRONMENT: "test" });
  const updates = []; const requests = [];
  const prisma = { payment: {
    updateMany: async (args) => { updates.push(args); return { count: updates.length === 1 ? Number(claim) : 1 }; },
    findUniqueOrThrow: async () => ({ id: "receipt", ...expected, verificationUntil: updates[0].data.verificationUntil })
  } };
  global.fetch = async (url, options) => {
    requests.push({ url, options });
    if (failure) throw new Error("timeout");
    return new Response(JSON.stringify(response), { status: 200 });
  };
  try {
    const gateway = load("lib/payphone.ts", { "server-only": {}, "@/lib/prisma": { prisma }, "@/lib/payment-validation": validation });
    await callback({ ...gateway, updates, requests });
  } finally {
    global.fetch = oldFetch;
    for (const key of keys) { if (previous[key] === undefined) delete process.env[key]; else process.env[key] = previous[key]; }
  }
}

test("server confirms with bearer token, saves only verified approval", async () => {
  await withGateway(async ({ confirmPayment, updates, requests }) => {
    await confirmPayment("receipt", "123");
    assert.equal(requests.length, 1);
    assert.deepEqual(JSON.parse(requests[0].options.body), { id: 123, clientTxId: "si-test" });
    assert.equal(requests[0].options.headers.Authorization, "Bearer mock-token");
    assert.equal(updates[1].data.status, "APPROVED");
    assert.equal(updates[1].data.providerTransactionId, "123");
    assert.ok(updates[1].data.paidAt instanceof Date);
    assert.equal(updates[1].data.providerResponse, undefined);
  });
});
test("an already claimed or terminal payment never calls PayPhone again", async () => {
  await withGateway(async ({ confirmPayment, updates, requests }) => {
    await confirmPayment("receipt", "123");
    assert.equal(requests.length, 0); assert.equal(updates.length, 1);
    assert.deepEqual(updates[0].where.AND[1].OR.map((condition) => condition.status), ["PENDING", "REVIEW", "VERIFYING"]);
  }, { claim: false });
});
test("network failure remains in review, never approved or declined", async () => {
  await withGateway(async ({ confirmPayment, updates }) => {
    await confirmPayment("receipt", "123");
    assert.equal(updates[1].data.status, "REVIEW"); assert.equal(updates[1].data.verificationUntil, null);
  }, { failure: true });
});
test("mismatched confirmation stays in review without a provider payment reference", async () => {
  await withGateway(async ({ confirmPayment, updates }) => {
    await confirmPayment("receipt", "123");
    assert.equal(updates[1].data.status, "REVIEW");
    assert.equal(updates[1].data.paidAt, null); assert.equal(updates[1].data.providerTransactionId, null);
  }, { response: { ...approved, amount: 1 } });
});
test("configuration is disabled unless explicitly enabled with credentials and environment", async () => {
  await withGateway(async ({ getPayphoneConfig }) => {
    assert.ok(getPayphoneConfig());
    for (const key of ["PAYPHONE_ENABLED", "PAYPHONE_TOKEN", "PAYPHONE_STORE_ID", "PAYPHONE_ENVIRONMENT"]) {
      const prior = process.env[key]; process.env[key] = ""; assert.equal(getPayphoneConfig(), null, key); process.env[key] = prior;
    }
  });
});

function checkoutRoute({ configured = true, attempts = 0 } = {}) {
  const created = [];
  const tx = {
    $queryRaw: async () => [],
    payment: {
      count: async () => attempts,
      create: async ({ data }) => { created.push(data); return { ...data, id: "receipt" }; }
    }
  };
  const route = load("app/api/payments/route.ts", {
    "@/lib/prisma": { prisma: { $transaction: async (callback) => callback(tx) } },
    "@/lib/payphone": { getPayphoneConfig: () => configured ? { token: "mock-token", storeId: "store" } : null },
    "@/lib/payment-validation": validation,
    "@/lib/payment-request": requestValidation
  });
  return { ...route, created };
}
const input = { concept: "Anticipo de servicio", amount: "11.50", accepted: true };
function request(body, origin = "https://example.test") {
  return new Request("https://example.test/api/payments", { method: "POST", headers: { Origin: origin, "Content-Type": "application/json" }, body: JSON.stringify(body) });
}
test("checkout validates total on server and prepares the official box", async () => {
  const { POST, created } = checkoutRoute();
  const response = await POST(request(input));
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(created[0].amountCents, 1150);
  assert.equal(created[0].concept, "Anticipo de servicio");
  assert.equal(created[0].email, undefined);
  assert.equal(body.box.amount, 1150);
  assert.equal(body.box.amountWithoutTax, 1150);
  assert.equal(body.box.tax, undefined);
  assert.equal(body.box.amountWithTax, undefined);
  assert.equal(created[0].taxCents, undefined);
  assert.equal(created[0].taxRatePercent, undefined);
  assert.equal(body.box.phoneNumber, undefined);
  assert.equal(body.box.email, undefined);
  assert.equal(response.headers.get("cache-control"), "no-store");
});
test("checkout rejects cross-origin requests before creating records", async () => {
  const { POST, created } = checkoutRoute();
  assert.equal((await POST(request(input, "https://attacker.test"))).status, 403);
  assert.equal(created.length, 0);
});
test("checkout is unavailable without explicit configuration", async () => {
  const { POST, created } = checkoutRoute({ configured: false });
  assert.equal((await POST(request(input))).status, 503);
  assert.equal(created.length, 0);
});
test("checkout rejects invalid fields and excessive attempts", async () => {
  assert.equal((await checkoutRoute().POST(request({ ...input, amount: "0" }))).status, 400);
  const limited = checkoutRoute({ attempts: 5 });
  assert.equal((await limited.POST(request(input))).status, 429);
  assert.equal(limited.created.length, 0);
});

test("origin checks handle internal localhost URLs without accepting other sites", () => {
  const make = (origin) => new Request("http://localhost:3000/api/payments", {
    headers: { Host: "www.example.test", "x-forwarded-proto": "https", Origin: origin }
  });
  assert.equal(requestValidation.isPaymentSameOrigin(make("https://www.example.test")), true);
  assert.equal(requestValidation.isPaymentSameOrigin(make("https://attacker.test")), false);
  assert.equal(requestValidation.isPaymentSameOrigin(make("http://www.example.test")), false);
  assert.equal(requestValidation.isPaymentSameOrigin(make("null")), false);
});

test("return confirms on the server and redirects relatively, never to internal localhost", async () => {
  const confirmations = [];
  const { GET } = load("app/api/payments/payphone/return/route.ts", {
    "@/lib/prisma": { prisma: { payment: { findUnique: async () => ({ id: "receipt-id" }) } } },
    "@/lib/payphone": { confirmPayment: async (...args) => confirmations.push(args) }
  });
  const response = await GET(new Request("http://localhost:3000/api/payments/payphone/return?id=123&clientTransactionId=si-12345678-1234-1234-1234-123456789012"));
  assert.equal(response.status, 303);
  assert.equal(response.headers.get("location"), "/pagos/resultado/receipt-id");
  assert.deepEqual(confirmations, [["receipt-id", "123"]]);
});
test("return rejects fabricated parameters without accessing the database", async () => {
  const { GET } = load("app/api/payments/payphone/return/route.ts", {
    "@/lib/prisma": { prisma: { payment: { findUnique: async () => { throw new Error("Database must not be called"); } } } },
    "@/lib/payphone": { confirmPayment: async () => { throw new Error("Provider must not be called"); } }
  });
  assert.equal((await GET(new Request("http://localhost/api/payments/payphone/return?id=bad&clientTransactionId=bad"))).status, 400);
});

test("the exact entered total is preserved without any tax calculation", async () => {
  for (const amount of ["1", "112", "115.75", "5000"]) {
    const { POST, created } = checkoutRoute();
    const response = await POST(request({ ...input, amount, taxRatePercent: 15, taxCents: 99999 }));
    assert.equal(response.status, 200);
    const result = await response.json();
    const expectedCents = validation.parseAmountCents(amount);
    assert.equal(result.box.amount, expectedCents);
    assert.equal(result.box.amountWithoutTax, expectedCents);
    assert.equal(created[0].amountCents, expectedCents);
    assert.equal(Object.hasOwn(created[0], "taxCents"), false);
    assert.equal(Object.hasOwn(result, "taxRatePercent"), false);
  }
});
