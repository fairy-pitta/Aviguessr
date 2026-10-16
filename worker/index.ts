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
app.use("/api/*", withPlayer);

app.get("/api/health", (c) => c.json({ status: "ok" }));

app.route("/api/game", gameRoutes);
app.route("/api/birds", birdRoutes);
app.route("/api/daily", dailyRoutes);
app.route("/api/player", playerRoutes);
app.route("/api/life-list", lifeListRoutes);

export default app;
