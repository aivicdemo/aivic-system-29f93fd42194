import { calculateReferenceDataTrustScore, sortReferenceDataByCandidatePriority } from "../../src/logic/it-6-2-1-1";

describe("査定担当者別・工種別・金額帯別の判定精度指標の自動集計と可視化", () => {
  test("SCEN-994: 最適参照候補データの優先度付け表示", () => {
    // 前提: 過去案件データと物価本の照合が完了し、複数の参照候補データが存在する
    // トリガー: 最適参照候補データの一覧表示画面を確認する
    // 期待結果: 信頼度スコアが最も高い候補データが最初に表示される

    // テスト用の参照候補データセット
    const reference_candidate_01 = {
      candidate_id: "REF_20240115_001",
      project_name: "A地域_RC造_2024年1月",
      past_project_count: 12,
      data_age_months: 2,
      region_match_score: 95,
      construction_type_match_score: 90,
      time_period_match_score: 88,
      confidence_score: 0,
    };

    const reference_candidate_02 = {
      candidate_id: "REF_20240115_002",
      project_name: "A地域_RC造_2023年12月",
      past_project_count: 8,
      data_age_months: 3,
      region_match_score: 92,
      construction_type_match_score: 85,
      time_period_match_score: 82,
      confidence_score: 0,
    };

    const reference_candidate_03 = {
      candidate_id: "REF_20240115_003",
      project_name: "B地域_RC造_2024年1月",
      past_project_count: 6,
      data_age_months: 4,
      region_match_score: 80,
      construction_type_match_score: 88,
      time_period_match_score: 75,
      confidence_score: 0,
    };

    // 各候補の信頼度スコアを計算
    // formula: trust_score = (region_match × 0.4) + (construction_type_match × 0.35) + (time_period_match × 0.15) + (data_freshness × 0.1)
    // data_freshness = max(0, 100 - age_months × 5)
    
    const data_freshness_01 = Math.max(0, 100 - 2 * 5); // = 90
    const expected_score_01 =
      (95 * 0.4) + (90 * 0.35) + (88 * 0.15) + (data_freshness_01 * 0.1);
    // = 38 + 31.5 + 13.2 + 9 = 91.7

    const data_freshness_02 = Math.max(0, 100 - 3 * 5); // = 85
    const expected_score_02 =
      (92 * 0.4) + (85 * 0.35) + (82 * 0.15) + (data_freshness_02 * 0.1);
    // = 36.8 + 29.75 + 12.3 + 8.5 = 87.35

    const data_freshness_03 = Math.max(0, 100 - 4 * 5); // = 80
    const expected_score_03 =
      (80 * 0.4) + (88 * 0.35) + (75 * 0.15) + (data_freshness_03 * 0.1);
    // = 32 + 30.8 + 11.25 + 8 = 82.05

    // 信頼度スコア計算関数をテスト
    const calculated_candidate_01 = calculateReferenceDataTrustScore(reference_candidate_01);
    expect(calculated_candidate_01.confidence_score).toBeCloseTo(expected_score_01, 2);

    const calculated_candidate_02 = calculateReferenceDataTrustScore(reference_candidate_02);
    expect(calculated_candidate_02.confidence_score).toBeCloseTo(expected_score_02, 2);

    const calculated_candidate_03 = calculateReferenceDataTrustScore(reference_candidate_03);
    expect(calculated_candidate_03.confidence_score).toBeCloseTo(expected_score_03, 2);

    // 複数候補データの配列を準備
    const reference_candidates = [
      calculated_candidate_02, // score = 87.35
      calculated_candidate_03, // score = 82.05
      calculated_candidate_01, // score = 91.7
    ];

    // 信頼度スコア降順でソート
    const sorted_candidates = sortReferenceDataByCandidatePriority(reference_candidates);

    // 期待結果: 信頼度スコアが最も高い候補が最初に表示される
    expect(sorted_candidates.length).toBe(3);
    expect(sorted_candidates[0].candidate_id).toBe("REF_20240115_001");
    expect(sorted_candidates[0].confidence_score).toBeCloseTo(91.7, 2);

    // 2番目に高いスコアの候補
    expect(sorted_candidates[1].candidate_id).toBe("REF_20240115_002");
    expect(sorted_candidates[1].confidence_score).toBeCloseTo(87.35, 2);

    // 最後の候補
    expect(sorted_candidates[2].candidate_id).toBe("REF_20240115_003");
    expect(sorted_candidates[2].confidence_score).toBeCloseTo(82.05, 2);

    // スコアが降順に並んでいることを検証
    for (let i = 0; i < sorted_candidates.length - 1; i++) {
      expect(sorted_candidates[i].confidence_score).toBeGreaterThanOrEqual(
        sorted_candidates[i + 1].confidence_score
      );
    }
  });
});