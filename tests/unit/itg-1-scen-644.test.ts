import { validateReportGenerationParameters } from "../../src/logic/it-1781935279444-1-1-1";

describe("営業データ項目のメタデータ管理機能", () => {
  test("SCEN-644: レポート生成パラメータ検証機能 - 契約期間外の日付パラメータが設定された場合に検証エラーが発生する", () => {
    // 契約期間の定義
    const contractStartDate = new Date("2024-01-01T00:00:00Z");
    const contractEndDate = new Date("2024-12-31T23:59:59Z");

    // ケース 1: 開始日が契約期間より前の場合
    const invalidStartParam = {
      reportStartDate: new Date("2023-12-15T00:00:00Z"),
      reportEndDate: new Date("2024-06-30T23:59:59Z"),
      contractStartDate: contractStartDate,
      contractEndDate: contractEndDate,
    };

    expect(() =>
      validateReportGenerationParameters(invalidStartParam)
    ).toThrow(/契約期間外/);

    // ケース 2: 終了日が契約期間より後の場合
    const invalidEndParam = {
      reportStartDate: new Date("2024-06-01T00:00:00Z"),
      reportEndDate: new Date("2025-01-15T23:59:59Z"),
      contractStartDate: contractStartDate,
      contractEndDate: contractEndDate,
    };

    expect(() =>
      validateReportGenerationParameters(invalidEndParam)
    ).toThrow(/契約期間外/);

    // ケース 3: 両方とも契約期間外の場合
    const invalidBothParam = {
      reportStartDate: new Date("2023-12-01T00:00:00Z"),
      reportEndDate: new Date("2025-02-01T23:59:59Z"),
      contractStartDate: contractStartDate,
      contractEndDate: contractEndDate,
    };

    expect(() =>
      validateReportGenerationParameters(invalidBothParam)
    ).toThrow(/契約期間外/);

    // ケース 4: 正常系 - 契約期間内の日付パラメータ
    const validParam = {
      reportStartDate: new Date("2024-01-15T00:00:00Z"),
      reportEndDate: new Date("2024-12-15T23:59:59Z"),
      contractStartDate: contractStartDate,
      contractEndDate: contractEndDate,
    };

    // 正常系は結果が true を返すまたはエラーを投げない
    const result = validateReportGenerationParameters(validParam);
    expect(result).toBe(true);

    // ケース 5: 開始日と終了日が契約期間の境界値と一致する場合
    const boundaryParam = {
      reportStartDate: contractStartDate,
      reportEndDate: contractEndDate,
      contractStartDate: contractStartDate,
      contractEndDate: contractEndDate,
    };

    const boundaryResult = validateReportGenerationParameters(boundaryParam);
    expect(boundaryResult).toBe(true);

    // ケース 6: 報告期間の開始日が終了日より後の場合（日付順序エラー）
    const invalidOrderParam = {
      reportStartDate: new Date("2024-12-15T00:00:00Z"),
      reportEndDate: new Date("2024-01-15T23:59:59Z"),
      contractStartDate: contractStartDate,
      contractEndDate: contractEndDate,
    };

    expect(() =>
      validateReportGenerationParameters(invalidOrderParam)
    ).toThrow(/日付順序/);
  });
});