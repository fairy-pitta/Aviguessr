import { Hono } from "hono";
import { cors } from "hono/cors";
import type { Bindings } from "./types";
import { gameRoutes } from "./routes/game";
import { birdRoutes } from "./routes/birds";

const app = new Hono<{ Bindings: Bindings }>();

app.use("/api/*", cors());

app.get("/api/health", (c) => c.json({ status: "ok" }));

app.route("/api/game", gameRoutes);
app.route("/api/birds", birdRoutes);

export default app;
