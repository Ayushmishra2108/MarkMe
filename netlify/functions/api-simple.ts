import { Handler } from "@netlify/functions";

export const handler: Handler = async (event, context) => {
  console.log("API function called:", event.path, event.httpMethod);
  
  // Handle health check
  if (event.path === "/api/health") {
    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        status: "ok",
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || "production",
      }),
    };
  }
  
  // Handle admin users endpoint
  if (event.path === "/api/admin/users" && event.httpMethod === "POST") {
    try {
      const body = JSON.parse(event.body || "{}");
      console.log("User creation request:", body);
      
      return {
        statusCode: 200,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: "User creation endpoint reached!",
          receivedData: body,
          timestamp: new Date().toISOString(),
        }),
      };
    } catch (error) {
      return {
        statusCode: 400,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          error: "Invalid JSON in request body",
        }),
      };
    }
  }
  
  // Default response
  return {
    statusCode: 404,
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      error: "Endpoint not found",
      path: event.path,
      method: event.httpMethod,
    }),
  };
};
