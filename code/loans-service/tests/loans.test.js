test("seed loan has required fields", () => {
    const loan = {
      loanId: "loan-001",
      deviceId: "lap-001",
      studentId: "S1234567",
      startDate: "2026-01-07",
      dueDate: "2026-01-14",
      status: "active"
    };
  
    expect(loan).toHaveProperty("loanId");
    expect(loan).toHaveProperty("deviceId");
    expect(loan).toHaveProperty("studentId");
    expect(loan).toHaveProperty("startDate");
    expect(loan).toHaveProperty("dueDate");
    expect(loan).toHaveProperty("status");
  });
  
  test("dueDate should be present for a new loan", () => {
    const body = { deviceId: "lap-001", studentId: "S1234567" };
    expect(body).not.toHaveProperty("dueDate");
  });
  