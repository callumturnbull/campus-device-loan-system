const { app } = require("@azure/functions");

app.http("devices", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "devices",
  handler: async (request, context) => {
    const devices = [
      { id: "lap-001", brand: "Dell", model: "Latitude 5420", category: "Laptop", totalCount: 60, availableCount: 6 },
      { id: "tab-001", brand: "Apple", model: "iPad 9th Gen", category: "Tablet", totalCount: 8, availableCount: 2 },
      { id: "cam-001", brand: "Canon", model: "EOS 250D", category: "Camera", totalCount: 4, availableCount: 1 }
    ];

    return {
      status: 200,
      jsonBody: { devices }
    };
  }
});
