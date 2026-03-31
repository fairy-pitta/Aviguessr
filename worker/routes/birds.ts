import { Hono } from "hono";
import type { Bindings } from "../types";

export const birdRoutes = new Hono<{ Bindings: Bindings }>();

birdRoutes.get("/:id/image", async (c) => {
  const birdId = c.req.param("id");

  const bird = await c.env.DB.prepare(
    "SELECT image_key FROM birds WHERE id = ?"
  )
    .bind(birdId)
    .first<{ image_key: string }>();

  if (!bird) {
    return c.json({ error: "Bird not found" }, 404);
  }

  const object = await c.env.IMAGES.get(bird.image_key);
  if (!object) {
    return c.json({ error: "Image not found" }, 404);
  }

  const headers = new Headers();
  headers.set("Content-Type", object.httpMetadata?.contentType ?? "image/jpeg");
  headers.set("Cache-Control", "public, max-age=86400");

  return new Response(object.body, { headers });
});
