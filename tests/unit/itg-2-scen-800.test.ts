import { calculateMonthlyAccuracyMetrics } from "../../src/logic/it-6-2-1-1";

describe("査定担当者別・工種別・金額帯別の判定精度指標の自動集計と可視化", () => {
  test("SCEN-800: 月次査定精度指標自動集計機能 - 相場乖離の正確性・査定時間・修正率の3指標がすべて計算される", () => {
    // テストデータ: 過去1ヶ月間の査定記録（10件以上）
    const assessment_records = [
      {
        assessment_id: "ASS001",
        assessment_date: "2024-01-05T10:00:00Z",
        assessment_amount: 1000000,
        actual_transaction_amount: 950000,
        assessment_time_minutes: 25,
        revised_after_assessment: false,
      },
      {
        assessment_id: "ASS002",
        assessment_date: "2024-01-08T14:30:00Z",
        assessment_amount: 1500000,
        actual_transaction_amount: 1480000,
        assessment_time_minutes: 30,
        revised_after_assessment: true,
      },
      {
        assessment_id: "ASS003",
        assessment_date: "2024-01-10T09:15:00Z",
        assessment_amount: 2000000,
        actual_transaction_amount: 1950000,
        assessment_time_minutes: 22,
        revised_after_assessment: false,
      },
      {
        assessment_id: "ASS004",
        assessment_date: "2024-01-12T11:45:00Z",
        assessment_amount: 1200000,
        actual_transaction_amount: 1220000,
        assessment_time_minutes: 28,
        revised_after_assessment: true,
      },
      {
        assessment_id: "ASS005",
        assessment_date: "2024-01-15T13:20:00Z",
        assessment_amount: 1800000,
        actual_transaction_amount: 1790000,
        assessment_time_minutes: 26,
        revised_after_assessment: false,
      },
      {
        assessment_id: "ASS006",
        assessment_date: "2024-01-18T10:00:00Z",
        assessment_amount: 950000,
        actual_transaction_amount: 960000,
        assessment_time_minutes: 24,
        revised_after_assessment: true,
      },
      {
        assessment_id: "ASS007",
        assessment_date: "2024-01-20T15:30:00Z",
        assessment_amount: 2100000,
        actual_transaction_amount: 2050000,
        assessment_time_minutes: 31,
        revised_after_assessment: false,
      },
      {
        assessment_id: "ASS008",
        assessment_date: "2024-01-22T12:00:00Z",
        assessment_amount: 1600000,
        actual_transaction_amount: 1610000,
        assessment_time_minutes: 27,
        revised_after_assessment: true,
      },
      {
        assessment_id: "ASS009",
        assessment_date: "2024-01-25T14:45:00Z",
        assessment_amount: 1350000,
        actual_transaction_amount: 1330000,
        assessment_time_minutes: 23,
        revised_after_assessment: false,
      },
      {
        assessment_id: "ASS010",
        assessment_date: "2024-01-28T11:15:00Z",
        assessment_amount: 1700000,
        actual_transaction_amount: 1680000,
        assessment_time_minutes: 29,
        revised_after_assessment: true,
      },
    ];

    // 月次査定精度指標自動集計機能を実行
    const result = calculateMonthlyAccuracyMetrics(assessment_records);

    // 相場乖離指標の検証
    // 乖離率 = |査定額 - 実際取引額| / 実際取引額 * 100
    // ASS001: |1000000 - 950000| / 950000 * 100 = 5.26%
    // ASS002: |1500000 - 1480000| / 1480000 * 100 = 1.35%
    // ASS003: |2000000 - 1950000| / 1950000 * 100 = 2.56%
    // ASS004: |1200000 - 1220000| / 1220000 * 100 = 1.64%
    // ASS005: |1800000 - 1790000| / 1790000 * 100 = 0.56%
    // ASS006: |950000 - 960000| / 960000 * 100 = 1.04%
    // ASS007: |2100000 - 2050000| / 2050000 * 100 = 2.44%
    // ASS008: |1600000 - 1610000| / 1610000 * 100 = 0.62%
    // ASS009: |1350000 - 1330000| / 1330000 * 100 = 1.50%
    // ASS010: |1700000 - 1680000| / 1680000 * 100 = 1.19%
    // 平均: (5.26 + 1.35 + 2.56 + 1.64 + 0.56 + 1.04 + 2.44 + 0.62 + 1.50 + 1.19) / 10 = 18.16 / 10 = 1.816%
    // 四捨五入して小数第2位: 1.82

    expect(result.price_deviation_accuracy).toBeDefined();
    expect(typeof result.price_deviation_accuracy).toBe("number");
    expect(result.price_deviation_accuracy).toBeGreaterThanOrEqual(0);
    expect(result.price_deviation_accuracy).toBeLessThanOrEqual(100);
    expect(result.price_deviation_accuracy).toBeCloseTo(1.82, 1);

    // 平均査定時間指標の検証
    // 平均査定時間 = (25 + 30 + 22 + 28 + 26 + 24 + 31 + 27 + 23 + 29) / 10 = 265 / 10 = 26.5分
    expect(result.average_assessment_time_minutes).toBeDefined();
    expect(typeof result.average_assessment_time_minutes).toBe("number");
    expect(result.average_assessment_time_minutes).toBeGreaterThan(0);
    expect(result.average_assessment_time_minutes).toBe(26.5);

    // 修正率指標の検証
    // 修正率 = 修正があった件数 / 総件数 * 100
    // 修正あり: ASS002, ASS004, ASS006, ASS008, ASS010 = 5件
    // 修正率 = 5 / 10 * 100 = 50%
    expect(result.revision_rate).toBeDefined();
    expect(typeof result.revision_rate).toBe("number");
    expect(result.revision_rate).toBeGreaterThanOrEqual(0);
    expect(result.revision_rate).toBeLessThanOrEqual(100);
    expect(result.revision_rate).toBe(50);

    // 3つの指標がすべて同時に出力されていることを確認
    expect(Object.keys(result)).toContain("price_deviation_accuracy");
    expect(Object.keys(result)).toContain("average_assessment_time_minutes");
    expect(Object.keys(result)).toContain("revision_rate");
    expect(Object.keys(result).length).toBe(3);

    // 各指標が妥当な範囲内であることを確認
    expect(result.price_deviation_accuracy).toBeLessThanOrEqual(100);
    expect(result.average_assessment_time_minutes).toBeGreaterThan(0);
    expect(result.revision_rate).toBeLessThanOrEqual(100);

    // 結果オブジェクトが正確に計算されていることを確認
    expect(result).toEqual({
      price_deviation_accuracy: expect.any(Number),
      average_assessment_time_minutes: expect.any(Number),
      revision_rate: expect.any(Number),
    });
  });
});