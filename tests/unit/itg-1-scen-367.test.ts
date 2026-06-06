import { validateProductionOrderReceiptResponse } from '../../src/logic/it-1';

describe("製品仕様・納期・工程・資材・担当者情報を統合して標準化された生産指示書を自動生成する機能", () => {
  test("指定時間ジャストに受領確認が行われた場合に正常完了となる", () => {
    // SCEN-367
    const distributionTimestamp = new Date("2024-01-15T13:00:00Z");
    const responseTimestamp = new Date("2024-01-15T14:00:00Z");
    const requiredResponseMinutes = 60;
    const workerId = "WORKER001";

    const result = validateProductionOrderReceiptResponse(
      distributionTimestamp,
      responseTimestamp,
      requiredResponseMinutes,
      workerId
    );

    expect(result.isValidResponse).toBe(true);
    expect(result.responseStatus).toBe("時間内応答");
    expect(result.escalationRequired).toBe(false);
    expect(result.responseDelayMinutes).toBe(60);
  });
});