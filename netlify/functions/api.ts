import serverless from "serverless-http";
import { createServer } from "../../server";

// Create the server instance
const app = createServer();

// Wrap with serverless-http
export const handler = serverless(app, {
  binary: false,
  request: (request, event, context) => {
    // Add any request preprocessing here if needed
    return request;
  },
  response: (response, event, context) => {
    // Add any response postprocessing here if needed
    return response;
  }
});
