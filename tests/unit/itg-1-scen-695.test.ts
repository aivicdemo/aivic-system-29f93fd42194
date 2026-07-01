import { validateSalesDataComplete } from "../../src/logic/it-1781935279444-2-2-1";

describe("営業データの完全性・正確性を自動検証し、不足データ・誤りを検出・通知する機能", () => {
  // SCEN-695
  test("保存済みの営業データにおいてデータ型の不整合を自動検出し不備内容を表示する", () => {
    const invalidSalesData = {
      recordId: "REC-20240115-001",
      customerId: "CUST-A001",
      contactDate: "2024-01-15",
      appointmentCount: "5", // 期待型: number、実際の型: string
      closedDeals: 3,
      serviceType: "営業支援",
      revenue: "150000", // 期待型: number、実際の型: string
    };

    const result = validateSalesDataComplete(invalidSalesData);

    expect(result.isValid).toBe(false);
    expect(result.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          fieldName: "appointmentCount",
          expectedType: "number",
          actualType: "string",
          recordId: "REC-20240115-001",
          message: expect.stringMatching(/appointmentCount/),
        }),
        expect.objectContaining({
          fieldName: "revenue",
          expectedType: "number",
          actualType: "string",
          recordId: "REC-20240115-001",
          message: expect.stringMatching(/revenue/),
        }),
      ])
    );
    expect(result.errors.length).toBe(2);
    expect(result.errors[0]).toHaveProperty("fieldName");
    expect(result.errors[0]).toHaveProperty("expectedType");
    expect(result.errors[0]).toHaveProperty("actualType");
    expect(result.errors[0]).toHaveProperty("recordId");
  });
});