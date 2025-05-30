import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import serverless from "serverless-http";

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }
      log(logLine);
    }
  });

  next();
});

// 异步初始化：注册路由、错误处理中间件、以及根据环境设置 Vite 或静态文件服务
const appInit = (async () => {
  // 注册其他路由
  await registerRoutes(app);

  // 错误处理中间件
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    log(`Error: ${message}`);
  });

  if (app.get("env") === "development") {
    // 开发环境下设置 Vite 中间件
    await setupVite(app, undefined);
  } else {
    // 生产环境下提供静态文件服务
    serveStatic(app);
  }
})();

// 用 serverless-http 包装 Express 应用
const handler = serverless(app);

// 导出一个异步函数，确保初始化完成后再处理请求
export default async (req: Request, res: Response) => {
  await appInit;
  return handler(req, res);
};
