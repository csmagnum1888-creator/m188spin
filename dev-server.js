import express from "express";
import { createServer as createViteServer } from "vite";

const app = express();
const port = Number(process.env.PORT || 5173);

app.use(express.json());

const apiModules = {
  "/api/auth-login": () => import("./api/auth-login.js"),
  "/api/auth-me": () => import("./api/auth-me.js"),
  "/api/admin-data": () => import("./api/admin-data.js"),
  "/api/admin-action": () => import("./api/admin-action.js"),
  "/api/redeem-voucher": () => import("./api/redeem-voucher.js"),
  "/api/public-settings": () => import("./api/public-settings.js"),
  "/api/visitor-log": () => import("./api/visitor-log.js"),
  "/api/admin/login": () => import("./api/admin/login.js"),
  "/api/admin/logout": () => import("./api/admin/logout.js"),
  "/api/voucher/redeem": () => import("./api/voucher/redeem.js"),
  "/api/admin/vouchers/generate": () => import("./api/admin/vouchers/generate.js")
};

for (const [path, loader] of Object.entries(apiModules)) {
  app.all(path, async (req, res) => {
    try {
      const mod = await loader();
      await mod.default(req, res);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Server lokal bermasalah." });
    }
  });
}

const vite = await createViteServer({ server: { middlewareMode: true }, appType: "spa" });
app.use(vite.middlewares);

app.listen(port, "127.0.0.1", () => {
  console.log(`Lucky Arcade dev server: http://127.0.0.1:${port}`);
});
