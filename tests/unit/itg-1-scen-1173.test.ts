import { validateReportAccuracy } from "../../src/logic/it-1781935279444-2-1-1";

describe("営業データ入力時の品質検証ルール定義・実行機能", () => {
  test("SCEN-1173: レポート数値の正確性合否判定機能 - 一致したレポート数値を正確として合格判定できる", () => {
    // テストデータ: レポート数値と基準値が完全に一致するデータセット
    const reportData = {
      customerId: "CUST-001",
      serviceId: "SVC-A",
      reportApoCount: 15,
      reportContractCount: 3,
      reportCustomerResponse: 8,
      reportAmount: 450000,
      reportPeriod: "2024-01",
    };

    const sourceData = {
      customerId: "CUST-001",
      serviceId: "SVC-A",
      sourceApoCount: 15,
      sourceContractCount: 3,
      sourceCustomerResponse: 8,
      sourceAmount: 450000,
      sourcePeriod: "2024-01",
    };

    const toleranceConfig = {
      apoCountTolerance: 0,
      contractCountTolerance: 0,
      customerResponseTolerance: 0,
      amountTolerance: 0,
    };

    // レポート数値の正確性合否判定機能を実行
    const result = validateReportAccuracy(reportData, sourceData, toleranceConfig);

    // 判定結果の検証
    expect(result.status).toBe("PASS");
    expect(result.message).toContain("数値が正確に一致しています");
    expect(result.isAccurate).toBe(true);
    expect(result.apoCountMatch).toBe(true);
    expect(result.contractCountMatch).toBe(true);
    expect(result.customerResponseMatch).toBe(true);
    expect(result.amountMatch).toBe(true);
    expect(result.details).toEqual({
      apoCountDifference: 0,
      contractCountDifference: 0,
      customerResponseDifference: 0,
      amountDifference: 0,
      allFieldsMatch: true,
    });
  });
});