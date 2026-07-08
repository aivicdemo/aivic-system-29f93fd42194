import { detectAnomalousProductivity } from "../../src/logic/it-6-2-1-1";

describe("査定員別生産性の異常値自動判定", () => {
  // SCEN-762
  test("統計的外れ値（平均±3σ以上）が正確に検出される", () => {
    // テストデータ準備: 査定員A～Eの過去30日間の日次生産性データ
    const appraiser_a_data = [
      50, 51, 49, 50, 52, 48, 50, 49, 51, 50,
      50, 49, 51, 50, 48, 52, 50, 49, 50, 51,
      50, 50, 49, 51, 50, 48, 50, 49, 50, 51
    ];

    // 平均値計算: 約50件
    const sum_a = appraiser_a_data.reduce((acc, val) => acc + val, 0);
    const mean_a = sum_a / appraiser_a_data.length; // 50.0

    // 標準偏差計算: 約1.05（実際の計算）
    const variance_a = appraiser_a_data.reduce(
      (acc, val) => acc + Math.pow(val - mean_a, 2),
      0
    ) / appraiser_a_data.length;
    const std_dev_a = Math.sqrt(variance_a); // 約1.05

    // 正常範囲: 平均 ± 3σ
    const lower_bound = mean_a - 3 * std_dev_a; // 約46.85
    const upper_bound = mean_a + 3 * std_dev_a; // 約53.15

    // テストケース: 異常値(低), 異常値(高), 正常範囲内のデータ
    const test_low_anomaly = 32; // 平均-3σ以下の異常値
    const test_high_anomaly = 68; // 平均+3σ以上の異常値
    const test_normal_1 = 48; // 正常範囲内
    const test_normal_2 = 52; // 正常範囲内
    const test_normal_3 = 50; // 正常範囲内

    // 入力データ構造
    const input_data = {
      appraiser_id: "appraiser_a",
      daily_productivity_records: [
        { date: "2024-12-01", count: 50 },
        { date: "2024-12-02", count: 51 },
        { date: "2024-12-03", count: 49 },
        { date: "2024-12-04", count: 50 },
        { date: "2024-12-05", count: 52 },
        { date: "2024-12-06", count: 48 },
        { date: "2024-12-07", count: 50 },
        { date: "2024-12-08", count: 49 },
        { date: "2024-12-09", count: 51 },
        { date: "2024-12-10", count: 50 },
        { date: "2024-12-11", count: 50 },
        { date: "2024-12-12", count: 49 },
        { date: "2024-12-13", count: 51 },
        { date: "2024-12-14", count: 50 },
        { date: "2024-12-15", count: 48 },
        { date: "2024-12-16", count: 52 },
        { date: "2024-12-17", count: 50 },
        { date: "2024-12-18", count: 49 },
        { date: "2024-12-19", count: 50 },
        { date: "2024-12-20", count: 51 },
        { date: "2024-12-21", count: 50 },
        { date: "2024-12-22", count: 50 },
        { date: "2024-12-23", count: 49 },
        { date: "2024-12-24", count: 51 },
        { date: "2024-12-25", count: 50 },
        { date: "2024-12-26", count: 48 },
        { date: "2024-12-27", count: 50 },
        { date: "2024-12-28", count: 49 },
        { date: "2024-12-29", count: 50 },
        { date: "2024-12-30", count: 51 }
      ],
      threshold_sigma: 3
    };

    // 異常値(低)テスト: 32件を入力
    const result_low_anomaly = detectAnomalousProductivity({
      ...input_data,
      daily_productivity_records: [
        ...input_data.daily_productivity_records.slice(0, 29),
        { date: "2024-12-31", count: test_low_anomaly }
      ]
    });

    expect(result_low_anomaly.anomalies).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          date: "2024-12-31",
          count: 32,
          is_anomaly: true,
          anomaly_type: "low"
        })
      ])
    );

    // 異常値(高)テスト: 68件を入力
    const result_high_anomaly = detectAnomalousProductivity({
      ...input_data,
      daily_productivity_records: [
        ...input_data.daily_productivity_records.slice(0, 29),
        { date: "2024-12-31", count: test_high_anomaly }
      ]
    });

    expect(result_high_anomaly.anomalies).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          date: "2024-12-31",
          count: 68,
          is_anomaly: true,
          anomaly_type: "high"
        })
      ])
    );

    // 正常範囲内テスト: 48件, 52件, 50件
    const result_normal = detectAnomalousProductivity(input_data);

    // 正常範囲内のデータはすべてis_anomaly: false
    const normal_entries = result_normal.anomalies.filter(
      (item: { is_anomaly: boolean }) => item.is_anomaly === false
    );
    expect(normal_entries.length).toBeGreaterThan(0);

    // 統計値が正確に計算されていることを確認
    expect(result_normal.statistics).toEqual(
      expect.objectContaining({
        mean: expect.any(Number),
        std_dev: expect.any(Number),
        lower_bound: expect.any(Number),
        upper_bound: expect.any(Number)
      })
    );

    // 平均値が約50であることを確認
    expect(result_normal.statistics.mean).toBeCloseTo(50, 1);

    // 標準偏差が約1.05であることを確認
    expect(result_normal.statistics.std_dev).toBeCloseTo(1.05, 1);

    // 正常範囲が正確に計算されていることを確認
    expect(result_normal.statistics.lower_bound).toBeCloseTo(46.85, 1);
    expect(result_normal.statistics.upper_bound).toBeCloseTo(53.15, 1);

    // 外れ値判定の正確性: 平均±3σ以外の値をすべて正常と判定
    const all_within_normal = result_normal.anomalies.every(
      (item: { count: number; is_anomaly: boolean }) => {
        if (item.count < 32 || item.count > 68) {
          return item.is_anomaly === true;
        }
        return item.is_anomaly === false;
      }
    );
    expect(all_within_normal).toBe(true);
  });
});