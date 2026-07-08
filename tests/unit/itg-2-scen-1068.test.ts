import { calculateAbilityDifferenceScore } from "../../src/logic/it-6-2-2-2";

describe("査定員別の判定精度・乖離パターン分析ダッシュボード", () => {
  test("SCEN-1068: 能力差定量指標の自動抽出 - 新人と経験者の能力差スコアが0～100の範囲で算出される", () => {
    // テストケース1: 新人と経験者の基本的な能力差スコア計算
    const novice_profile_1 = {
      appraiser_id: "A001",
      appraiser_name: "新人査定者太郎",
      years_of_experience: 0.5,
      average_appraisal_time_minutes: 45,
      judgement_accuracy_rate: 0.72,
      deviation_pattern_consistency: 0.65,
      processing_count_per_month: 80,
    };

    const expert_profile_1 = {
      appraiser_id: "B001",
      appraiser_name: "経験者査定者花子",
      years_of_experience: 8,
      average_appraisal_time_minutes: 25,
      judgement_accuracy_rate: 0.95,
      deviation_pattern_consistency: 0.92,
      processing_count_per_month: 220,
    };

    const score_1 = calculateAbilityDifferenceScore(
      novice_profile_1,
      expert_profile_1
    );

    expect(score_1).toBeGreaterThanOrEqual(0);
    expect(score_1).toBeLessThanOrEqual(100);
    expect(typeof score_1).toBe("number");

    // テストケース2: 別の新人・経験者ペア
    const novice_profile_2 = {
      appraiser_id: "A002",
      appraiser_name: "新人査定者次郎",
      years_of_experience: 1.2,
      average_appraisal_time_minutes: 38,
      judgement_accuracy_rate: 0.78,
      deviation_pattern_consistency: 0.70,
      processing_count_per_month: 110,
    };

    const expert_profile_2 = {
      appraiser_id: "B002",
      appraiser_name: "経験者査定者美咲",
      years_of_experience: 10,
      average_appraisal_time_minutes: 20,
      judgement_accuracy_rate: 0.97,
      deviation_pattern_consistency: 0.94,
      processing_count_per_month: 280,
    };

    const score_2 = calculateAbilityDifferenceScore(
      novice_profile_2,
      expert_profile_2
    );

    expect(score_2).toBeGreaterThanOrEqual(0);
    expect(score_2).toBeLessThanOrEqual(100);
    expect(typeof score_2).toBe("number");

    // テストケース3: 能力差が小さいペア（比較的近い能力レベル）
    const novice_profile_3 = {
      appraiser_id: "A003",
      appraiser_name: "新人査定者三郎",
      years_of_experience: 2,
      average_appraisal_time_minutes: 28,
      judgement_accuracy_rate: 0.88,
      deviation_pattern_consistency: 0.85,
      processing_count_per_month: 160,
    };

    const expert_profile_3 = {
      appraiser_id: "B003",
      appraiser_name: "経験者査定者由美",
      years_of_experience: 6,
      average_appraisal_time_minutes: 22,
      judgement_accuracy_rate: 0.93,
      deviation_pattern_consistency: 0.90,
      processing_count_per_month: 240,
    };

    const score_3 = calculateAbilityDifferenceScore(
      novice_profile_3,
      expert_profile_3
    );

    expect(score_3).toBeGreaterThanOrEqual(0);
    expect(score_3).toBeLessThanOrEqual(100);
    expect(typeof score_3).toBe("number");

    // テストケース4: 能力差が極大のペア
    const novice_profile_4 = {
      appraiser_id: "A004",
      appraiser_name: "新人査定者四郎",
      years_of_experience: 0.3,
      average_appraisal_time_minutes: 55,
      judgement_accuracy_rate: 0.60,
      deviation_pattern_consistency: 0.55,
      processing_count_per_month: 50,
    };

    const expert_profile_4 = {
      appraiser_id: "B004",
      appraiser_name: "経験者査定者智美",
      years_of_experience: 12,
      average_appraisal_time_minutes: 18,
      judgement_accuracy_rate: 0.98,
      deviation_pattern_consistency: 0.96,
      processing_count_per_month: 300,
    };

    const score_4 = calculateAbilityDifferenceScore(
      novice_profile_4,
      expert_profile_4
    );

    expect(score_4).toBeGreaterThanOrEqual(0);
    expect(score_4).toBeLessThanOrEqual(100);
    expect(typeof score_4).toBe("number");

    // 全てのスコアが正常な範囲内であることを確認
    const all_scores = [score_1, score_2, score_3, score_4];
    all_scores.forEach((score) => {
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    });

    // スコアの大小関係が妥当であることを確認（極大差ペアが最も大きなスコアを持つはず）
    expect(score_4).toBeGreaterThan(score_3);
  });
});