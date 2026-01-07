const { app } = require("@azure/functions");

let loans = [
  {
    loanId: "loan-001",
    deviceId: "lap-001",
    studentId: "S1234567",
    startDate: "2026-01-07",
    dueDate: "2026-01-14",
    status: "active"
  }
];

app.http("loans", {
  methods: ["GET", "POST"],
  authLevel: "anonymous",
  route: "loans",
  handler: async (request, context) => {
    if (request.method === "GET") {
      return { status: 200, jsonBody: { loans } };
    }

    // POST
    const body = await request.json().catch(() => null);
    if (!body || !body.deviceId || !body.studentId || !body.dueDate) {
      return {
        status: 400,
        jsonBody: { error: "deviceId, studentId, dueDate are required" }
      };
    }

    const newLoan = {
      loanId: `loan-${String(loans.length + 1).padStart(3, "0")}`,
      deviceId: body.deviceId,
      studentId: body.studentId,
      startDate: body.startDate || new Date().toISOString().slice(0, 10),
      dueDate: body.dueDate,
      status: "active"
    };

    loans.push(newLoan);

    return { status: 201, jsonBody: newLoan };
  }
});
