exports.handler = async (event, context) => {
  console.log("Basic function called:", event.path);
  
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
