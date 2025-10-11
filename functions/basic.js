exports.handler = async (event, context) => {
  console.log("Basic function called:", event.path, event.httpMethod);
  
  // Handle different endpoints
  if (event.path === "/api/health") {
    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        status: "ok",
        timestamp: new Date().toISOString(),
        environment: "production",
      }),
    };
  }
  
  if (event.path === "/api/admin/users" && event.httpMethod === "POST") {
    try {
      const body = JSON.parse(event.body || "{}");
      console.log("User creation request received:", body);
      
      return {
        statusCode: 200,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: "User creation endpoint reached!",
          receivedData: body,
          timestamp: new Date().toISOString(),
          uid: "test-uid-123",
          uniqueId: body.uniqueId || "test-id",
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
    statusCode: 200,
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message: "Basic function is working!",
      path: event.path,
      method: event.httpMethod,
      timestamp: new Date().toISOString(),
    }),
  };
};
