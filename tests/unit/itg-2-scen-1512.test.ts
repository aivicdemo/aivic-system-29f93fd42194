import {
  aggregateJudgmentAccuracyByAssessor,
} from "../../src/logic/it-6-2-1-1";

const fetchMock = require("jest-fetch-mock");

describe("査定担当者別・工種別・金額帯別の判定精度指標の自動集計と可視化", () => {
  beforeEach(() => {
    fetchMock.enableMocks();
    fetchMock.resetMocks();
  });

  afterEach(() => {
    fetchMock.disableMocks();
  });

  // SCEN-1512
  test("改善前後乖離パターン比較分析 - 改善前後のデータ蓄積期間が1週間で相場乖離パターンの変化を定量的に判定し改善有効性を自動判定", async () => {
    // 改善前のデータ蓄積期間を1週間で設定する
    const pre_improvement_start_date = "2024-01-01";
    const pre_improvement_end_date = "2024-01-07";

    // 改善前期間における相場乖離パターンを抽出し、乖離率の分布を記録する
    const pre_improvement_assessments = [
      {
        assessor_id: "A001",
        construction_type: "建築工事",
        amount_band: "1000万～3000万",
        quote_amount: 2000,
        market_price: 2100,
        deviation_rate: 4.76,
        deviation_amount: 100,
        assessment_date: "2024-01-01",
      },
      {
        assessor_id: "A001",
        construction_type: "建築工事",
        amount_band: "1000万～3000万",
        quote_amount: 2200,
        market_price: 2100,
        deviation_rate: -4.55,
        deviation_amount: -100,
        assessment_date: "2024-01-02",
      },
      {
        assessor_id: "A001",
        construction_type: "建築工事",
        amount_band: "1000万～3000万",
        quote_amount: 2050,
        market_price: 2100,
        deviation_rate: 2.38,
        deviation_amount: 50,
        assessment_date: "2024-01-03",
      },
      {
        assessor_id: "A002",
        construction_type: "土木工事",
        amount_band: "500万～1000万",
        quote_amount: 800,
        market_price: 800,
        deviation_rate: 0.0,
        deviation_amount: 0,
        assessment_date: "2024-01-04",
      },
      {
        assessor_id: "A002",
        construction_type: "土木工事",
        amount_band: "500万～1000万",
        quote_amount: 820,
        market_price: 800,
        deviation_rate: -2.44,
        deviation_amount: -20,
        assessment_date: "2024-01-05",
      },
      {
        assessor_id: "A003",
        construction_type: "電気工事",
        amount_band: "3000万以上",
        quote_amount: 5000,
        market_price: 4800,
        deviation_rate: -3.85,
        deviation_amount: -200,
        assessment_date: "2024-01-06",
      },
      {
        assessor_id: "A003",
        construction_type: "電気工事",
        amount_band: "3000万以上",
        quote_amount: 5100,
        market_price: 4800,
        deviation_rate: -5.88,
        deviation_amount: -300,
        assessment_date: "2024-01-07",
      },
    ];

    // 改善実施後のデータ蓄積期間を1週間で設定する
    const post_improvement_start_date = "2024-01-08";
    const post_improvement_end_date = "2024-01-14";

    // 改善後期間における相場乖離パターンを抽出し、乖離率の分布を記録する
    const post_improvement_assessments = [
      {
        assessor_id: "A001",
        construction_type: "建築工事",
        amount_band: "1000万～3000万",
        quote_amount: 2100,
        market_price: 2100,
        deviation_rate: 0.0,
        deviation_amount: 0,
        assessment_date: "2024-01-08",
      },
      {
        assessor_id: "A001",
        construction_type: "建築工事",
        amount_band: "1000万～3000万",
        quote_amount: 2095,
        market_price: 2100,
        deviation_rate: 0.24,
        deviation_amount: 5,
        assessment_date: "2024-01-09",
      },
      {
        assessor_id: "A001",
        construction_type: "建築工事",
        amount_band: "1000万～3000万",
        quote_amount: 2105,
        market_price: 2100,
        deviation_rate: -0.24,
        deviation_amount: -5,
        assessment_date: "2024-01-10",
      },
      {
        assessor_id: "A002",
        construction_type: "土木工事",
        amount_band: "500万～1000万",
        quote_amount: 800,
        market_price: 800,
        deviation_rate: 0.0,
        deviation_amount: 0,
        assessment_date: "2024-01-11",
      },
      {
        assessor_id: "A002",
        construction_type: "土木工事",
        amount_band: "500万～1000万",
        quote_amount: 805,
        market_price: 800,
        deviation_rate: -0.62,
        deviation_amount: -5,
        assessment_date: "2024-01-12",
      },
      {
        assessor_id: "A003",
        construction_type: "電気工事",
        amount_band: "3000万以上",
        quote_amount: 4800,
        market_price: 4800,
        deviation_rate: 0.0,
        deviation_amount: 0,
        assessment_date: "2024-01-13",
      },
      {
        assessor_id: "A003",
        construction_type: "電気工事",
        amount_band: "3000万以上",
        quote_amount: 4810,
        market_price: 4800,
        deviation_rate: -0.21,
        deviation_amount: -10,
        assessment_date: "2024-01-14",
      },
    ];

    // API呼び出しをモック: 改善前データ取得
    fetchMock.mockResponseOnce(JSON.stringify(pre_improvement_assessments), {
      status: 200,
    });

    // API呼び出しをモック: 改善後データ取得
    fetchMock.mockResponseOnce(JSON.stringify(post_improvement_assessments), {
      status: 200,
    });

    // 改善前後の乖離パターンを比較分析する
    const result = await aggregateJudgmentAccuracyByAssessor({
      pre_improvement_start_date,
      pre_improvement_end_date,
      post_improvement_start_date,
      post_improvement_end_date,
    });

    // 改善前の平均乖離率と改善後の平均乖離率を計算する
    // 改善前: |4.76| + |-4.55| + |2.38| + |0.0| + |-2.44| + |-3.85| + |-5.88| = 23.86
    // 改善前平均: 23.86 / 7 = 3.41%
    const pre_avg_deviation_rate = 3.41;

    // 改善後: |0.0| + |0.24| + |-0.24| + |0.0| + |-0.62| + |0.0| + |-0.21| = 1.31
    // 改善後平均: 1.31 / 7 = 0.19%
    const post_avg_deviation_rate = 0.19;

    // 乖離率の標準偏差を改善前後で計算する
    // 改善前データ: [4.76, -4.55, 2.38, 0.0, -2.44, -3.85, -5.88]
    // 平均: (4.76 - 4.55 + 2.38 + 0.0 - 2.44 - 3.85 - 5.88) / 7 = -1.51 / 7 = -0.216
    // 分散計算後、標準偏差 ≈ 3.85
    const pre_std_deviation = 3.85;

    // 改善後データ: [0.0, 0.24, -0.24, 0.0, -0.62, 0.0, -0.21]
    // 平均: (0.0 + 0.24 - 0.24 + 0.0 - 0.62 + 0.0 - 0.21) / 7 = -0.83 / 7 = -0.119
    // 分散計算後、標準偏差 ≈ 0.31
    const post_std_deviation = 0.31;

    // 改善前後の乖離パターン変化を定量的に判定する
    // 改善率 = (改善前平均 - 改善後平均) / 改善前平均 * 100
    // = (3.41 - 0.19) / 3.41 * 100 = 3.22 / 3.41 * 100 ≈ 94.43%
    const improvement_rate = 94.43;

    // 標準偏差改善率 = (改善前標準偏差 - 改善後標準偏差) / 改善前標準偏差 * 100
    // = (3.85 - 0.31) / 3.85 * 100 = 3.54 / 3.85 * 100 ≈ 91.95%
    const std_improvement_rate = 91.95;

    // 改善有効性の自動判定ロジックを実行する
    // 条件: 改善率 >= 50% AND 標準偏差改善率 >= 30% ならば改善有効
    const is_improvement_effective = true;

    // 判定結果を検証する
    expect(result).toEqual({
      pre_improvement_period: {
        start_date: "2024-01-01",
        end_date: "2024-01-07",
        assessments_count: 7,
        avg_deviation_rate: 3.41,
        std_deviation: 3.85,
      },
      post_improvement_period: {
        start_date: "2024-01-08",
        end_date: "2024-01-14",
        assessments_count: 7,
        avg_deviation_rate: 0.19,
        std_deviation: 0.31,
      },
      comparison: {
        improvement_rate: 94.43,
        std_improvement_rate: 91.95,
        deviation_pattern_change: "安定性が大幅に向上",
      },
      effectiveness_judgment: {
        is_effective: is_improvement_effective,
        judgment_criteria: {
          improvement_rate_threshold: 50,
          std_improvement_rate_threshold: 30,
          improvement_rate_achieved: 94.43,
          std_improvement_rate_achieved: 91.95,
        },
        judgment_result: "改善有効",
      },
    });

    expect(result.pre_improvement_period.avg_deviation_rate).toBe(3.41);
    expect(result.post_improvement_period.avg_deviation_rate).toBe(0.19);
    expect(result.comparison.improvement_rate).toBe(94.43);
    expect(result.comparison.std_improvement_rate).toBe(91.95);
    expect(result.effectiveness_judgment.is_effective).toBe(true);
    expect(result.effectiveness_judgment.judgment_result).toBe("改善有効");
  });
});