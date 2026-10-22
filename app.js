
const express = require("express");
const path = require("path");

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

let queue = [];
let nextId = 1;

app.get("/health", (req, res) => {
  res.status(200).json({ status: "healthy" });
});

app.get("/api/queue", (req, res) => {
  res.json(queue);
});

app.get("/api/queue/current", (req, res) => {
  res.json(queue.find(item => item.status === "SERVING") || null);
});

app.post("/api/queue", (req, res) => {
  const name = String(req.body.name || "").trim();
  const department = String(req.body.department || "General").trim();

  if (!name) {
    return res.status(400).json({ error: "Name is required" });
  }

  const item = {
    id: nextId++,
    token: `A${String(nextId - 1).padStart(3, "0")}`,
    name,
    department,
    status: "WAITING",
    createdAt: new Date().toISOString()
  };

  queue.push(item);
  res.status(201).json(item);
});

app.post("/api/queue/next", (req, res) => {
  if (queue.some(item => item.status === "SERVING")) {
    return res.status(409).json({
      error: "Complete the current token first"
    });
  }

  const next = queue.find(item => item.status === "WAITING");

  if (!next) {
    return res.status(404).json({ error: "No waiting tokens" });
  }

  next.status = "SERVING";
  res.json(next);
});

app.patch("/api/queue/:id/complete", (req, res) => {
  const item = queue.find(
    entry => entry.id === Number(req.params.id)
  );

  if (!item) {
    return res.status(404).json({ error: "Token not found" });
  }

  if (item.status !== "SERVING") {
    return res.status(409).json({
      error: "Only the serving token can be completed"
    });
  }

  item.status = "COMPLETED";
  res.json(item);
});

// Reset is intended for local demonstration and testing.
app.delete("/api/queue/reset", (req, res) => {
  queue = [];
  nextId = 1;
  res.json({ message: "Queue reset successfully" });
});

module.exports = app;
