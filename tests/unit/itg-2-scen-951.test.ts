import { calculateMonthlyProcessingCapacityWithOutlierRemoval } from "../../src/logic/it-6-2-1-1";

describe("査定担当者別・工種別・金額帯別の判定精度指標の自動集計と可視化", () => {
  test("SCEN-951: 月次処理能力の算出（外れ値除外・補正） - 正常な処理時間データから統計的外れ値を除外して平均値を算出する", () => {
    // 準備: 正常な処理時間データセット（10件）+ 統計的外れ値（2件）
    // 正常データ: 25, 28, 26, 29, 27, 30, 24, 26, 25, 28（単位：分）
    // 外れ値: 90（極端に大きい値）, 5（極端に小さい値）
    const processing_times_minutes = [25, 28, 26, 29, 27, 30, 24, 26, 25, 28, 90, 5];
    
    const input = {
      assessor_id: "assessor_001",
      work_type: "RC_STRUCTURE",
      amount_band: "5M_10M",
      processing_records: processing_times_minutes.map((time, index) => ({
        record_id: `record_${index}`,
        processing_time_minutes: time,
        assessment_date: "2024-01-15",
      })),
    };

    const result = calculateMonthlyProcessingCapacityWithOutlierRemoval(input);

    // 期待値の計算
    // 正常データ: [25, 28, 26, 29, 27, 30, 24, 26, 25, 28]
    // ソート: [24, 25, 25, 26, 26, 27, 28, 28, 29, 30]
    // Q1（第1四分位数）= 25.25, Q3（第3四分位数）= 28.75
    // IQR = 28.75 - 25.25 = 3.5
    // 外れ値判定基準: 下限 = 25.25 - 1.5 * 3.5 = 19.0, 上限 = 28.75 + 1.5 * 3.5 = 34.0
    // データ: [25, 28, 26, 29, 27, 30, 24, 26, 25, 28, 90, 5]
    // 外れ値: 90（上限34.0 > 90）, 5（下限19.0 > 5）
    // 正常データ（外れ値除外後）: [25, 28, 26, 29, 27, 30, 24, 26, 25, 28]
    // 平均値 = (25 + 28 + 26 + 29 + 27 + 30 + 24 + 26 + 25 + 28) / 10 = 268 / 10 = 26.8

    expect(result.average_processing_time_minutes).toBe(26.8);
    expect(result.total_records).toBe(12);
    expect(result.outlier_removed_count).toBe(2);
    expect(result.valid_records_count).toBe(10);
    
    // 除外されたレコードの詳細検証
    expect(result.outliers_removed).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          record_id: "record_10",
          processing_time_minutes: 90,
          removal_reason: "UPPER_OUTLIER",
        }),
        expect.objectContaining({
          record_id: "record_11",
          processing_time_minutes: 5,
          removal_reason: "LOWER_OUTLIER",
        }),
      ])
    );
    expect(result.outliers_removed.length).toBe(2);

    // 統計量の検証
    expect(result.q1).toBe(25.25);
    expect(result.q3).toBe(28.75);
    expect(result.iqr).toBe(3.5);
    expect(result.lower_bound).toBe(19.0);
    expect(result.upper_bound).toBe(34.0);

    // トレーサビリティ情報の検証
    expect(result.assessor_id).toBe("assessor_001");
    expect(result.work_type).toBe("RC_STRUCTURE");
    expect(result.amount_band).toBe("5M_10M");
    expect(result.calculation_timestamp).toBeDefined();
    expect(typeof result.calculation_timestamp).toBe("string");
  });
});