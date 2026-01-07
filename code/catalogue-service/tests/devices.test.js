test("devices data has required fields", () => {
    const devices = [
      { id: "lap-001", brand: "Dell", model: "Latitude 5420", category: "Laptop", totalCount: 10, availableCount: 6 },
      { id: "tab-001", brand: "Apple", model: "iPad 9th Gen", category: "Tablet", totalCount: 8, availableCount: 2 },
      { id: "cam-001", brand: "Canon", model: "EOS 250D", category: "Camera", totalCount: 4, availableCount: 1 }
    ];
  
    for (const d of devices) {
      expect(d).toHaveProperty("id");
      expect(d).toHaveProperty("brand");
      expect(d).toHaveProperty("model");
      expect(d).toHaveProperty("category");
      expect(d).toHaveProperty("totalCount");
      expect(d).toHaveProperty("availableCount");
    }
  });
  
  test("availableCount is valid", () => {
    const devices = [
      { totalCount: 10, availableCount: 6 },
      { totalCount: 8, availableCount: 2 },
      { totalCount: 4, availableCount: 1 }
    ];
  
    for (const d of devices) {
      expect(d.availableCount).toBeGreaterThanOrEqual(0);
      expect(d.availableCount).toBeLessThanOrEqual(d.totalCount);
    }
  });
  