import { validateSalesDataAfterCorrection } from "../../src/logic/it-1781935279444-2-1-1";

describe("営業データ入力時の品質検証ルール定義・実行機能", () => {
  test("SCEN-723: [error] 修正後データ再検証 - 修正後も日付矛盾が残存し不合格判定となる", () => {
    const correctedRecord = {
      salesDataId: "sales_20240601_001",
      startDate: "2024-06-01",
      endDate: "2024-05-31",
      customerId: "cust_A001",
      appointmentCount: 5,
      contractCount: 2,
      customerFeedback: "positive",
      correctionHistory: [
        {
          correctionTimestamp: "2024-06-10T14:30:00Z",
          correctionField: "endDate",
          originalValue: "2024-05-31",
          correctedValue: "2024-06-30",
          correctionReason: "日付修正"
        }
      ]
    };

    const validationResult = validateSalesDataAfterCorrection(correctedRecord);

    expect(validationResult.validationStatus).toBe("不合格");
    expect(validationResult.errorCode).toBe("DATE_INCONSISTENCY");
    expect(validationResult.errorMessage).toBe("開始日付は終了日付以前である必要があります");
    expect(validationResult.failureDetails).toEqual({
      field: "dateRange",
      startDate: "2024-06-01",
      endDate: "2024-05-31",
      violationReason: "開始日付が終了日付より後になっています"
    });
    expect(validationResult.correctionApplied).toBe(true);
    expect(validationResult.requiresManualIntervention).toBe(true);
  });
});