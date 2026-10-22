
const { test, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");
const app = require("../app");

beforeEach(async () => {
  await request(app).delete("/api/queue/reset");
});

test("health endpoint reports healthy", async () => {
  const response = await request(app).get("/health");

  assert.equal(response.status, 200);
  assert.equal(response.body.status, "healthy");
});

test("creates a queue token", async () => {
  const response = await request(app)
    .post("/api/queue")
    .send({ name: "Priya", department: "Accounts" });

  assert.equal(response.status, 201);
  assert.equal(response.body.token, "A001");
  assert.equal(response.body.status, "WAITING");
});

test("rejects an empty name", async () => {
  const response = await request(app)
    .post("/api/queue")
    .send({ name: "" });

  assert.equal(response.status, 400);
});

test("calls the next waiting token", async () => {
  await request(app).post("/api/queue").send({ name: "Priya" });

  const response = await request(app).post("/api/queue/next");

  assert.equal(response.status, 200);
  assert.equal(response.body.status, "SERVING");
});

test("does not serve two tokens simultaneously", async () => {
  await request(app).post("/api/queue").send({ name: "Priya" });
  await request(app).post("/api/queue").send({ name: "Asha" });
  await request(app).post("/api/queue/next");

  const response = await request(app).post("/api/queue/next");

  assert.equal(response.status, 409);
});

