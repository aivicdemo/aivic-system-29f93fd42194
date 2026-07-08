import { describe, it, expect, beforeEach } from "@jest/globals";
import { identifyDeviationPatterns } from "../../src/logic/it-6-2-2-2";

describe("査定員別の判定精度・乖離パターン分析ダッシュボード", () => {
  // SCEN-856: [error] 判定逸脱パターン特定機能 - 判定基準マスタが未設定の場合にエラーを返却する
  it("should throw error when judgment criteria master is not set", () => {
    const input = {
      assessorId: "ASS001",
      periodStart: "2024-01-01",
      periodEnd: "2024-01-31",
      judgmentCriteriaMasterId: null,
      deviationThresholdPercent: 10,
    };

    expect(() => identifyDeviationPatterns(input)).toThrow(
      /判定基準マスタ/
    );
  });

  // 追加: 判定基準マスタID が空文字列の場合
  it("should throw error when judgment criteria master ID is empty string", () => {
    const input = {
      assessorId: "ASS001",
      periodStart: "2024-01-01",
      periodEnd: "2024-01-31",
      judgmentCriteriaMasterId: "",
      deviationThresholdPercent: 10,
    };

    expect(() => identifyDeviationPatterns(input)).toThrow(
      /判定基準マスタ/
    );
  });

  // 追加: 正常系 - 判定基準マスタが設定されており、逸脱パターンが特定される場合
  it("should successfully identify deviation patterns when judgment criteria master is set", () => {
    const input = {
      assessorId: "ASS001",
      periodStart: "2024-01-01",
      periodEnd: "2024-01-31",
      judgmentCriteriaMasterId: "JCM001",
      deviationThresholdPercent: 10,
      assessmentResults: [
        {
          assessmentId: "ASS_RES_001",
          quotationAmount: 1000000,
          assessorJudgment: 950000,
          autoJudgment: 980000,
          deviationPercent: 3.1,
        },
        {
          assessmentId: "ASS_RES_002",
          quotationAmount: 2000000,
          assessorJudgment: 1800000,
          autoJudgment: 1950000,
          deviationPercent: 7.7,
        },
        {
          assessmentId: "ASS_RES_003",
          quotationAmount: 1500000,
          assessorJudgment: 1250000,
          autoJudgment: 1480000,
          deviationPercent: 15.5,
        },
      ],
    };

    const result = identifyDeviationPatterns(input);

    expect(result).toEqual({
      assessorId: "ASS001",
      periodStart: "2024-01-01",
      periodEnd: "2024-01-31",
      judgmentCriteriaMasterId: "JCM001",
      totalAssessments: 3,
      conformingCount: 2,
      deviatingCount: 1,
      deviationRate: 33.33,
      deviationPatterns: [
        {
          assessmentId: "ASS_RES_003",
          quotationAmount: 1500000,
          assessorJudgment: 1250000,
          autoJudgment: 1480000,
          deviationPercent: 15.5,
          deviationCategory: "high",
          severity: "warning",
        },
      ],
      analysisTimestamp: "2024-01-31T23:59:59Z",
    });
  });

  // 追加: 複数の逸脱パターンが検出される場合
  it("should identify multiple deviation patterns when threshold is exceeded", () => {
    const input = {
      assessorId: "ASS002",
      periodStart: "2024-02-01",
      periodEnd: "2024-02-29",
      judgmentCriteriaMasterId: "JCM001",
      deviationThresholdPercent: 8,
      assessmentResults: [
        {
          assessmentId: "ASS_RES_004",
          quotationAmount: 3000000,
          assessorJudgment: 2700000,
          autoJudgment: 2850000,
          deviationPercent: 5.3,
        },
        {
          assessmentId: "ASS_RES_005",
          quotationAmount: 2500000,
          assessorJudgment: 2100000,
          autoJudgment: 2400000,
          deviationPercent: 12.5,
        },
        {
          assessmentId: "ASS_RES_006",
          quotationAmount: 1800000,
          assessorJudgment: 1500000,
          autoJudgment: 1750000,
          deviationPercent: 14.3,
        },
      ],
    };

    const result = identifyDeviationPatterns(input);

    expect(result.totalAssessments).toBe(3);
    expect(result.deviatingCount).toBe(2);
    expect(result.conformingCount).toBe(1);
    expect(result.deviationRate).toBe(66.67);
    expect(result.deviationPatterns).toHaveLength(2);
    expect(result.deviationPatterns[0].assessmentId).toBe("ASS_RES_005");
    expect(result.deviationPatterns[1].assessmentId).toBe("ASS_RES_006");
  });

  // 追加: 逸脱パターンが検出されない場合
  it("should return empty deviation patterns when all assessments are within threshold", () => {
    const input = {
      assessorId: "ASS003",
      periodStart: "2024-03-01",
      periodEnd: "2024-03-31",
      judgmentCriteriaMasterId: "JCM001",
      deviationThresholdPercent: 15,
      assessmentResults: [
        {
          assessmentId: "ASS_RES_007",
          quotationAmount: 1200000,
          assessorJudgment: 1150000,
          autoJudgment: 1180000,
          deviationPercent: 2.6,
        },
        {
          assessmentId: "ASS_RES_008",
          quotationAmount: 1600000,
          assessorJudgment: 1550000,
          autoJudgment: 1580000,
          deviationPercent: 1.9,
        },
      ],
    };

    const result = identifyDeviationPatterns(input);

    expect(result.totalAssessments).toBe(2);
    expect(result.deviatingCount).toBe(0);
    expect(result.conformingCount).toBe(2);
    expect(result.deviationRate).toBe(0);
    expect(result.deviationPatterns).toHaveLength(0);
  });
});