import { detectSalesDataAnomalies } from "../../src/logic/it-1781935279444-2-2-1";

describe("営業データ異常値の自動検出", () => {
  // SCEN-891
  test("営業データの値がちょうど許容範囲の上限値である場合、チェック結果『正常』が返される", () => {
    const salesData = {
      appointmentCount: 100,
      contractCount: 50,
      customerReactionScore: 10,
      serviceType: "standard",
      transactionAmount: 500000,
    };

    const validationRules = {
      appointmentCount: { min: 0, max: 100 },
      contractCount: { min: 0, max: 50 },
      customerReactionScore: { min: 0, max: 10 },
      transactionAmount: { min: 0, max: 500000 },
    };

    const result = detectSalesDataAnomalies(salesData, validationRules);

    expect(result.status).toBe("normal");
    expect(result.hasAnomalies).toBe(false);
    expect(result.anomalyDetails).toEqual([]);
  });
});