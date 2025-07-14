import express from "express";
const app = express();

app.get("/hello", (req, res) => {
  res.send("Hello from Express!");
});

app.post("/submit", (req, res) => {
  const data = req.body;
  res.status(201).json({ message: "Data received", data });
});

app.listen(3000);
