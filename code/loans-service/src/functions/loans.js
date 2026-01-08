const { app } = require("@azure/functions");

// imports Auth0 helper 
const { requireAuth } = require("../shared/auth.js");

// memory demo data
const loans = [
  {
    loanId: "loan-001",
    deviceId: "lap-001",
    studentId: "S1234567",
    startDate: "2026-01-07",
    dueDate: "2026-01-14",
    status: "active",
    collectedAt: null,
    returnedAt: null,
  },
];

//simple in memory lock to reduce race conditions for reservations
const reservationLocks = new Map();

function isoDateOnly(d) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function addDays(date, days) {
  const d = new Date(date.getTime());
  d.setDate(d.getDate() + days);
  return d;
}

function respond(status, body, extraHeaders = {}) {
  return {
    status,
    headers: {
      "content-type": "application/json",
      ...extraHeaders,
    },
    jsonBody: body,
  };
}

// GET /api/loans  (allows any authenticated user to view OR keep public)
// will require login (student or staff).
app.http("loans", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "loans",
  handler: async (request) => {
    try {
      await requireAuth(request, ["student", "staff"]);
      return respond(200, { loans });
    } catch (err) {
      return respond(err.status || 500, { error: err.message });
    }
  },
});

// POST /api/reservations  { deviceId, studentId }  (registered users)
app.http("reservations", {
  methods: ["POST"],
  authLevel: "anonymous",
  route: "reservations",
  handler: async (request) => {
    try {
      await requireAuth(request, ["student", "staff"]);

      let payload;
      try {
        payload = await request.json();
      } catch {
        return respond(400, { error: "Invalid JSON body" });
      }

      const deviceId = String(payload?.deviceId || "").trim();
      const studentId = String(payload?.studentId || "").trim();

      if (!deviceId || !studentId) {
        return respond(400, { error: "deviceId and studentId are required" });
      }

      // basic concurrency guard
      if (reservationLocks.get(deviceId)) {
        return respond(409, { error: "Reservation in progress for this device. Try again." });
      }
      reservationLocks.set(deviceId, true);

      try {
        const existing = loans.find(
          (l) =>
            l.deviceId === deviceId &&
            (l.status === "reserved" || l.status === "active" || l.status === "collected")
        );
        if (existing) {
          return respond(409, { error: "Device already reserved/loaned", existingLoan: existing });
        }

        const now = new Date();
        const startDate = isoDateOnly(now);
        const dueDate = isoDateOnly(addDays(now, 2)); // required a 2 day loan duration

        const loanId = `loan-${String(loans.length + 1).padStart(3, "0")}`;

        const newLoan = {
          loanId,
          deviceId,
          studentId,
          startDate,
          dueDate,
          status: "reserved",
          collectedAt: null,
          returnedAt: null,
        };

        loans.push(newLoan);
        return respond(201, { loan: newLoan });
      } finally {
        reservationLocks.delete(deviceId);
      }
    } catch (err) {
      return respond(err.status || 500, { error: err.message });
    }
  },
});

// POST /api/loans/{loanId}/collected   (staff only)
app.http("loanCollect", {
  methods: ["POST"],
  authLevel: "anonymous",
  route: "loans/{loanId}/collected",
  handler: async (request) => {
    try {
      await requireAuth(request, ["staff"]);

      const loanId = request.params.loanId;
      const loan = loans.find((l) => l.loanId === loanId);

      if (!loan) return respond(404, { error: "Loan not found" });

      if (loan.status === "returned") {
        return respond(409, { error: "Loan already returned" });
      }
      if (loan.status === "collected") {
        return respond(409, { error: "Loan already collected" });
      }

      loan.status = "collected";
      loan.collectedAt = new Date().toISOString();

      return respond(200, { loan });
    } catch (err) {
      return respond(err.status || 500, { error: err.message });
    }
  },
});

// POST /api/loans/{loanId}/returned   (staff only)
app.http("loanReturn", {
  methods: ["POST"],
  authLevel: "anonymous",
  route: "loans/{loanId}/returned",
  handler: async (request) => {
    try {
      await requireAuth(request, ["staff"]);

      const loanId = request.params.loanId;
      const loan = loans.find((l) => l.loanId === loanId);

      if (!loan) return respond(404, { error: "Loan not found" });

      if (loan.status === "returned") {
        return respond(409, { error: "Loan already returned" });
      }

      loan.status = "returned";
      loan.returnedAt = new Date().toISOString();

      return respond(200, { loan, event: "device_returned" });
    } catch (err) {
      return respond(err.status || 500, { error: err.message });
    }
  },
});
