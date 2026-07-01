import { validateSalesData } from "../../src/logic/it-1781935279444-2-2-1";

describe("営業データ品質チェック・必須項目検証", () => {
  // SCEN-886: [error] 営業データ品質チェック・必須項目検証 - データ型・範囲が仕様外の場合、『警告』または『エラー』と詳細内容が返される
  test("should detect type and range violations and return error/warning with details", () => {
    const input = {
      appointmentCount: "invalid_string",
      closedDealCount: -5,
      customerReaction: "positive",
      salesRevenue: 50000,
      contactDate: "2024-01-15",
    };

    const result = validateSalesData(input);

    expect(result.status).toBe("error");
    expect(Array.isArray(result.violations)).toBe(true);
    expect(result.violations.length).toBe(2);

    const typeViolation = result.violations.find(
      (v: { type: string; field: string }) => v.type === "type_mismatch"
    );
    expect(typeViolation).toBeDefined();
    expect(typeViolation.field).toBe("appointmentCount");
    expect(typeViolation.expectedType).toBe("number");
    expect(typeViolation.actualValue).toBe("invalid_string");
    expect(typeViolation.message).toMatch(/appointmentCount/);

    const rangeViolation = result.violations.find(
      (v: { type: string; field: string }) => v.type === "range_violation"
    );
    expect(rangeViolation).toBeDefined();
    expect(rangeViolation.field).toBe("closedDealCount");
    expect(rangeViolation.expectedRange).toEqual({ min: 0, max: null });
    expect(rangeViolation.actualValue).toBe(-5);
    expect(rangeViolation.message).toMatch(/closedDealCount/);

    expect(result.violations[0].severity).toBe("error");
    expect(result.violations[1].severity).toBe("warning");
  });
});