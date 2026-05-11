import app from "./app.js";
import { config } from "./config/env.js";

const port = process.env.PORT || 5000;

const server = app.listen(port, "0.0.0.0", () => {
  console.log(`DataGuard server running on http://localhost:${port}`);
});

process.on('SIGTERM', () => {
  server.close(() => {
    console.log('Process terminated');
  });
});
