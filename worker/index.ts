import { Hono } from "hono";
import { cors } from "hono/cors";
import type { Bindings } from "./types";
import { gameRoutes } from "./routes/game";
import { birdRoutes } from "./routes/birds";
import { dailyRoutes } from "./routes/daily";

const app = new Hono<{ Bindings: Bindings }>();

app.use("/api/*", cors());

app.get("/api/health", (c) => c.json({ status: "ok" }));

app.route("/api/game", gameRoutes);
app.route("/api/birds", birdRoutes);
app.route("/api/daily", dailyRoutes);

export default app;
