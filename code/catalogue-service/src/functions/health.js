const { app } = require("@azure/functions");

app.http("health", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "health",
  handler: async (request, context) => {
    return {
      status: 200,
      jsonBody: { status: "ok", service: "catalogue-service" }
    };
  }
});
