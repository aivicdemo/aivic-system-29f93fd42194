import { validateProductionOrderReceiptResponse } from '../../src/logic/it-1';

describe("製品仕様・納期・工程・資材・担当者情報を統合して標準化された生産指示書を自動生成する機能", () => {
  test("指定時間が0以下の場合にエラーが発生する", () => {
    // SCEN-369
    const distributionTimestamp = new Date("2024-01-15T10:00:00Z");
    const responseTimestamp = new Date("2024-01-15T10:30:00Z");
    const workerId = "worker001";

    // 指定時間が0の場合
    expect(() => {
      validateProductionOrderReceiptResponse(
        distributionTimestamp,
        responseTimestamp,
        0,
        workerId
      );
    }).toThrow(/必須応答時間/);

    // 指定時間が負の値の場合
    expect(() => {
      validateProductionOrderReceiptResponse(
        distributionTimestamp,
        responseTimestamp,
        -1,
        workerId
      );
    }).toThrow(/必須応答時間/);
  });
});