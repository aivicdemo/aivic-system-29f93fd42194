import { describe, test, expect } from "@jest/globals";
import { extractAbilityDifferenceMetrics } from "../../src/logic/it-6-2-1-1";

describe("査定担当者別・工種別・金額帯別の判定精度指標の自動集計と可視化", () => {
  // SCEN-1070: [error] 能力差定量指標の自動抽出 - 査定員が1人以下の場合、エラーを返す
  test("should return error when assessors are 0 or 1", () => {
    // 査定員が0人のデータセット
    const zeroAssessorsDataset = {
      assessors: [],
      judgmentResults: [],
      processingTimes: [],
      qualityMetrics: [],
    };

    // 査定員が0人の場合、エラーを返す
    expect(() => extractAbilityDifferenceMetrics(zeroAssessorsDataset)).toThrow(
      /査定員/
    );

    // 査定員が1人のデータセット
    const oneAssessorDataset = {
      assessors: [
        {
          assessor_id: "A001",
          name: "査定員A",
          experience_level: "intermediate",
        },
      ],
      judgmentResults: [
        {
          assessment_id: "ASS001",
          assessor_id: "A001",
          quote_id: "Q001",
          judgment: "approval",
          variance_rate: 0.05,
          variance_amount: 50000,
        },
      ],
      processingTimes: [
        {
          assessor_id: "A001",
          processing_time_minutes: 15,
          assessment_date: "2024-01-15",
        },
      ],
      qualityMetrics: [
        {
          assessor_id: "A001",
          accuracy_rate: 0.95,
          judgment_variation_rate: 0.03,
        },
      ],
    };

    // 査定員が1人の場合、エラーを返す
    expect(() => extractAbilityDifferenceMetrics(oneAssessorDataset)).toThrow(
      /査定員/
    );
  });

  // SCEN-1070追加: 査定員が2人以上の場合、正常に能力差定量指標を計算して返す
  test("should calculate ability difference metrics when assessors are 2 or more", () => {
    const multipleAssessorsDataset = {
      assessors: [
        {
          assessor_id: "A001",
          name: "新人査定員",
          experience_level: "novice",
        },
        {
          assessor_id: "A002",
          name: "経験者査定員",
          experience_level: "expert",
        },
      ],
      judgmentResults: [
        {
          assessment_id: "ASS001",
          assessor_id: "A001",
          quote_id: "Q001",
          judgment: "approval",
          variance_rate: 0.12,
          variance_amount: 120000,
        },
        {
          assessment_id: "ASS002",
          assessor_id: "A002",
          quote_id: "Q001",
          judgment: "approval",
          variance_rate: 0.03,
          variance_amount: 30000,
        },
        {
          assessment_id: "ASS003",
          assessor_id: "A001",
          quote_id: "Q002",
          judgment: "rejection",
          variance_rate: 0.18,
          variance_amount: 180000,
        },
        {
          assessment_id: "ASS004",
          assessor_id: "A002",
          quote_id: "Q002",
          judgment: "rejection",
          variance_rate: 0.05,
          variance_amount: 50000,
        },
      ],
      processingTimes: [
        {
          assessor_id: "A001",
          processing_time_minutes: 25,
          assessment_date: "2024-01-15",
        },
        {
          assessor_id: "A002",
          processing_time_minutes: 12,
          assessment_date: "2024-01-15",
        },
      ],
      qualityMetrics: [
        {
          assessor_id: "A001",
          accuracy_rate: 0.85,
          judgment_variation_rate: 0.15,
        },
        {
          assessor_id: "A002",
          accuracy_rate: 0.96,
          judgment_variation_rate: 0.04,
        },
      ],
    };

    const result = extractAbilityDifferenceMetrics(multipleAssessorsDataset);

    expect(result).toHaveProperty("ability_difference_metrics");
    expect(result.ability_difference_metrics).toHaveProperty("novice_assessor");
    expect(result.ability_difference_metrics).toHaveProperty("expert_assessor");

    // 新人査定員の指標
    expect(
      result.ability_difference_metrics.novice_assessor.accuracy_rate
    ).toBe(0.85);
    expect(result.ability_difference_metrics.novice_assessor.average_variance_rate).toBe(0.15);
    expect(result.ability_difference_metrics.novice_assessor.average_processing_time_minutes).toBe(25);

    // 経験者査定員の指標
    expect(
      result.ability_difference_metrics.expert_assessor.accuracy_rate
    ).toBe(0.96);
    expect(result.ability_difference_metrics.expert_assessor.average_variance_rate).toBe(0.04);
    expect(result.ability_difference_metrics.expert_assessor.average_processing_time_minutes).toBe(12);

    // 能力差を定量化
    expect(result.ability_difference_metrics).toHaveProperty("ability_gap_score");
    expect(result.ability_difference_metrics.ability_gap_score).toBe(
      (0.96 - 0.85) * 100
    ); // 精度差を%で表現: 11%
  });
});