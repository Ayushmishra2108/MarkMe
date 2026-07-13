import serverless from "serverless-http";
import { createServer } from "../../server";

// Create the server instance
const app = createServer();

// Add debugging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Wrap with serverless-http
export const handler = serverless(app, {
  binary: false,
  request: (request: any, event: any, context: any) => {
    console.log("Request received:", { method: request.method, path: request.path });
    return request;
  },
  response: (response: any, event: any, context: any) => {
    console.log("Response sent:", { statusCode: response.statusCode });
    return response;
  }
});
