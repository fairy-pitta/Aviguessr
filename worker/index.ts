import { Hono } from "hono";
import { cors } from "hono/cors";
import type { Env } from "./types";
import { withPlayer } from "./middleware/player";
import { gameRoutes } from "./routes/game";
import { birdRoutes } from "./routes/birds";
import { dailyRoutes } from "./routes/daily";
import { playerRoutes } from "./routes/player";
import { lifeListRoutes } from "./routes/life-list";

const app = new Hono<Env>();

app.use("/api/*", cors());

// Only where a player is needed. Establishing one writes a row, so in front
// of the health check and the image route an uptime monitor or a hotlinked
// photograph would have written one on every call.
// Both forms of each: "/x/*" does not match the bare "/x", and /api/daily
// and /api/life-list are endpoints in their own right.
app.use("/api/game/*", withPlayer);
app.use("/api/daily", withPlayer);
app.use("/api/daily/*", withPlayer);
app.use("/api/life-list", withPlayer);
app.use("/api/life-list/*", withPlayer);

app.get("/api/health", (c) => c.json({ status: "ok" }));

app.route("/api/game", gameRoutes);
app.route("/api/birds", birdRoutes);
app.route("/api/daily", dailyRoutes);
app.route("/api/player", playerRoutes);
app.route("/api/life-list", lifeListRoutes);

export default app;
