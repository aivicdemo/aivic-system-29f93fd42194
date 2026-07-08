import { detectAndRecordDivergence } from "../../src/logic/it-6-3-1";

describe("査定判定ロジックの適用履歴と根拠の記録・検索機能", () => {
  test("SCEN-1333: 見積金額乖離検出・異常値通知機能 - 乖離率が0%（完全一致）の場合も異常値フラグが不要として適切に記録される", () => {
    // 乖離率0%（完全一致）のテストケース
    const estimatedAmount = 1000000;
    const assessedAmount = 1000000;
    const projectCode = "PRJ-2024-001";
    const region = "東京";
    const workType = "基礎工事";
    const recordedAt = new Date("2024-01-15T10:30:00Z");

    const result = detectAndRecordDivergence({
      estimatedAmount,
      assessedAmount,
      projectCode,
      region,
      workType,
      recordedAt,
    });

    // 乖離率が正確に0%で計算されることを確認
    expect(result.divergenceRate).toBe(0);

    // 異常値フラグがfalseで記録されることを確認
    expect(result.isAnomalousValue).toBe(false);

    // 異常値通知フラグがfalseで記録されることを確認
    expect(result.shouldNotifyAnomaly).toBe(false);

    // 完全一致を示すデータが正常に記録されることを確認
    expect(result.divergenceAmount).toBe(0);
    expect(result.status).toBe("normal");

    // 記録されたメタデータが正確であることを確認
    expect(result.projectCode).toBe("PRJ-2024-001");
    expect(result.region).toBe("東京");
    expect(result.workType).toBe("基礎工事");
    expect(result.recordedAt).toEqual(new Date("2024-01-15T10:30:00Z"));

    // 異常値フラグが不適切に設定されていないことを確認
    expect(result.isAnomalousValue).not.toBe(true);
    expect(result.shouldNotifyAnomaly).not.toBe(true);
  });
});