import { validateSalesDataAccuracy } from "../../src/logic/it-1781935279444-2-2-1";

describe("営業データ正確性検証 - 接触日時とアポ確定日時の矛盾検出", () => {
  test("SCEN-697: 接触日時がアポ確定日時より前になっている矛盾を検出する", () => {
    // 入力データ: 接触日時09:30、アポ確定日時10:00 → 矛盾あり
    const salesRecord = {
      recordId: "SLR-2024-0001",
      customerId: "CUST-A001",
      contactDateTime: new Date("2024-01-15T09:30:00Z"),
      appointmentConfirmedDateTime: new Date("2024-01-15T10:00:00Z"),
      appointmentQuantity: 1,
      contractedQuantity: 1,
      serviceType: "営業代行",
    };

    // validateSalesDataAccuracy を呼び出し
    const result = validateSalesDataAccuracy(salesRecord);

    // 期待結果: エラーが検出される
    expect(result.isValid).toBe(false);
    expect(result.errorCount).toBe(1);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toMatchObject({
      recordId: "SLR-2024-0001",
      fieldName: "接触日時",
      severity: "error",
      message: expect.stringMatching(/接触日時|アポ確定日時/),
    });
    expect(result.errors[0].message).toMatch(
      /接触日時.*アポ確定日時|矛盾|後ろ|前/
    );

    // 矛盾内容の詳細確認
    expect(result.errors[0]).toHaveProperty("expectedConstraint");
    expect(result.errors[0].expectedConstraint).toContain("アポ確定日時");
  });

  test("SCEN-697-HAPPY: 接触日時がアポ確定日時より後ろになっている正常系を許可する", () => {
    // 入力データ: 接触日時10:00、アポ確定日時09:30 → 正常
    const salesRecord = {
      recordId: "SLR-2024-0002",
      customerId: "CUST-A001",
      contactDateTime: new Date("2024-01-15T10:00:00Z"),
      appointmentConfirmedDateTime: new Date("2024-01-15T09:30:00Z"),
      appointmentQuantity: 1,
      contractedQuantity: 1,
      serviceType: "営業代行",
    };

    const result = validateSalesDataAccuracy(salesRecord);

    // 期待結果: エラーなし
    expect(result.isValid).toBe(true);
    expect(result.errorCount).toBe(0);
    expect(result.errors).toHaveLength(0);
  });

  test("SCEN-697-BOUNDARY: 接触日時とアポ確定日時が同じ時刻の場合は正常", () => {
    const salesRecord = {
      recordId: "SLR-2024-0003",
      customerId: "CUST-A001",
      contactDateTime: new Date("2024-01-15T10:00:00Z"),
      appointmentConfirmedDateTime: new Date("2024-01-15T10:00:00Z"),
      appointmentQuantity: 1,
      contractedQuantity: 1,
      serviceType: "営業代行",
    };

    const result = validateSalesDataAccuracy(salesRecord);

    // 期待結果: エラーなし（同一時刻は矛盾ではない）
    expect(result.isValid).toBe(true);
    expect(result.errorCount).toBe(0);
  });

  test("SCEN-697-MULTI: 複数の矛盾が存在する場合、すべて検出する", () => {
    // 複数の矛盾を含むデータ
    const salesRecord = {
      recordId: "SLR-2024-0004",
      customerId: "CUST-A001",
      contactDateTime: new Date("2024-01-15T09:30:00Z"), // 矛盾1: アポ確定日時より前
      appointmentConfirmedDateTime: new Date("2024-01-15T10:00:00Z"),
      appointmentQuantity: 0, // 矛盾2: アポ数が0
      contractedQuantity: 1,
      serviceType: "営業代行",
    };

    const result = validateSalesDataAccuracy(salesRecord);

    // 期待結果: 複数エラー検出
    expect(result.isValid).toBe(false);
    expect(result.errorCount).toBeGreaterThanOrEqual(1);
    expect(result.errors.some((e) => e.fieldName === "接触日時")).toBe(true);
  });
});