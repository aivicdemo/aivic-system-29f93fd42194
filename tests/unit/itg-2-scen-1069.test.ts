import { describe, test, expect } from "@jest/globals";
import { calculateAssessorVarianceTendencyScore } from "../../src/logic/it-1-br-6-2-1";

describe("査定員別判定ばらつき率と相場乖離傾向の自動集計・分析", () => {
  // SCEN-1069: [normal] 能力差定量指標の自動抽出 - 相場乖離傾向の差が定量スコアとして正しく計算される
  test("相場乖離傾向の差が定量スコアとして正確に計算される", () => {
    // テストデータ: 複数の査定案件（相場価格と査定価格に異なる乖離を含む）
    const assessmentCases = [
      {
        case_id: "case_001",
        assessor_id: "assessor_A",
        market_price: 1000000,
        assessed_price: 1100000,
        assessment_date: "2024-01-15",
      },
      {
        case_id: "case_002",
        assessor_id: "assessor_A",
        market_price: 2000000,
        assessed_price: 2200000,
        assessment_date: "2024-01-16",
      },
      {
        case_id: "case_003",
        assessor_id: "assessor_A",
        market_price: 1500000,
        assessed_price: 1650000,
        assessment_date: "2024-01-17",
      },
      {
        case_id: "case_004",
        assessor_id: "assessor_B",
        market_price: 1000000,
        assessed_price: 950000,
        assessment_date: "2024-01-15",
      },
      {
        case_id: "case_005",
        assessor_id: "assessor_B",
        market_price: 2000000,
        assessed_price: 1900000,
        assessment_date: "2024-01-16",
      },
      {
        case_id: "case_006",
        assessor_id: "assessor_B",
        market_price: 1500000,
        assessed_price: 1425000,
        assessment_date: "2024-01-17",
      },
      {
        case_id: "case_007",
        assessor_id: "assessor_C",
        market_price: 1000000,
        assessed_price: 1000000,
        assessment_date: "2024-01-15",
      },
      {
        case_id: "case_008",
        assessor_id: "assessor_C",
        market_price: 2000000,
        assessed_price: 2010000,
        assessment_date: "2024-01-16",
      },
      {
        case_id: "case_009",
        assessor_id: "assessor_C",
        market_price: 1500000,
        assessed_price: 1485000,
        assessment_date: "2024-01-17",
      },
    ];

    // 手動計算による検証用データ
    // assessor_A: 高め傾向（各案件で+10%）
    // case_001: (1100000 - 1000000) / 1000000 * 100 = +10.0%
    // case_002: (2200000 - 2000000) / 2000000 * 100 = +10.0%
    // case_003: (1650000 - 1500000) / 1500000 * 100 = +10.0%
    // 平均: +10.0%

    // assessor_B: 低め傾向（各案件で-5%）
    // case_004: (950000 - 1000000) / 1000000 * 100 = -5.0%
    // case_005: (1900000 - 2000000) / 2000000 * 100 = -5.0%
    // case_006: (1425000 - 1500000) / 1500000 * 100 = -5.0%
    // 平均: -5.0%

    // assessor_C: 中立傾向（±1%以内）
    // case_007: (1000000 - 1000000) / 1000000 * 100 = 0.0%
    // case_008: (2010000 - 2000000) / 2000000 * 100 = +0.5%
    // case_009: (1485000 - 1500000) / 1500000 * 100 = -1.0%
    // 平均: -0.167%

    const result = calculateAssessorVarianceTendencyScore(assessmentCases);

    // 戻り値の型確認
    expect(result).toBeDefined();
    expect(typeof result).toBe("object");

    // assessor_A: 高め傾向スコア検証
    expect(result.assessor_A).toBeDefined();
    expect(typeof result.assessor_A.mean_deviation_rate).toBe("number");
    expect(result.assessor_A.mean_deviation_rate).toBeCloseTo(10.0, 1);
    expect(typeof result.assessor_A.variance).toBe("number");
    expect(result.assessor_A.variance).toBeCloseTo(0, 1);
    expect(typeof result.assessor_A.tendency_score).toBe("number");
    // 傾向スコア: 高め傾向を示すため正の値（例：+10.0に基づいて）
    expect(result.assessor_A.tendency_score).toBeGreaterThan(0);
    expect(result.assessor_A.tendency_score).toBeLessThanOrEqual(100);

    // assessor_B: 低め傾向スコア検証
    expect(result.assessor_B).toBeDefined();
    expect(typeof result.assessor_B.mean_deviation_rate).toBe("number");
    expect(result.assessor_B.mean_deviation_rate).toBeCloseTo(-5.0, 1);
    expect(typeof result.assessor_B.variance).toBe("number");
    expect(result.assessor_B.variance).toBeCloseTo(0, 1);
    expect(typeof result.assessor_B.tendency_score).toBe("number");
    // 傾向スコア: 低め傾向を示すため負の値
    expect(result.assessor_B.tendency_score).toBeLessThan(0);
    expect(result.assessor_B.tendency_score).toBeGreaterThanOrEqual(-100);

    // assessor_C: 中立傾向スコア検証
    expect(result.assessor_C).toBeDefined();
    expect(typeof result.assessor_C.mean_deviation_rate).toBe("number");
    expect(result.assessor_C.mean_deviation_rate).toBeCloseTo(-0.167, 1);
    expect(typeof result.assessor_C.variance).toBe("number");
    expect(result.assessor_C.variance).toBeLessThan(1);
    expect(typeof result.assessor_C.tendency_score).toBe("number");
    // 傾向スコア: 中立傾向を示すためゼロに近い値
    expect(Math.abs(result.assessor_C.tendency_score)).toBeLessThan(5);
    expect(result.assessor_C.tendency_score).toBeGreaterThanOrEqual(-100);
    expect(result.assessor_C.tendency_score).toBeLessThanOrEqual(100);

    // スコアが統計的に妥当な値の範囲内に収まっているか確認
    const all_tendency_scores = [
      result.assessor_A.tendency_score,
      result.assessor_B.tendency_score,
      result.assessor_C.tendency_score,
    ];
    all_tendency_scores.forEach((score) => {
      expect(score).toBeGreaterThanOrEqual(-100);
      expect(score).toBeLessThanOrEqual(100);
    });

    // 査定員間の傾向スコアの大小関係が正しいか検証
    // assessor_A（高め） > assessor_C（中立） > assessor_B（低め）
    expect(result.assessor_A.tendency_score).toBeGreaterThan(
      result.assessor_C.tendency_score
    );
    expect(result.assessor_C.tendency_score).toBeGreaterThan(
      result.assessor_B.tendency_score
    );

    // ばらつき指標の差を検証：分散が小さいほど一貫性がある
    expect(result.assessor_A.variance).toBeLessThan(1);
    expect(result.assessor_B.variance).toBeLessThan(1);
    expect(result.assessor_C.variance).toBeLessThan(1);

    // 異なる乖離パターンでスコア算出結果を検証
    // assessor_A と assessor_B のスコア差が明確に異なっていることを確認
    const score_difference = Math.abs(
      result.assessor_A.tendency_score - result.assessor_B.tendency_score
    );
    expect(score_difference).toBeGreaterThan(5);
  });
});