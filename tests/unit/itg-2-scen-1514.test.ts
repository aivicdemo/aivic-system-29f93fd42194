import { describe, test, expect } from "@jest/globals";
import { analyzePrePostImprovementDivergencePatterns } from "../../src/logic/it-1-br-6-2-1";

describe("査定員別判定ばらつき率と相場乖離傾向の自動集計・分析", () => {
  // SCEN-1514: [error] 改善前後乖離パターン比較分析 - 改善前後の比較対象データが揃っていない場合、分析不可エラーを返却
  test("should return error when post-improvement pattern classification data is missing", () => {
    const preImprovementDataset = {
      assessmentData: [
        {
          assessmentId: "ASSESS-001",
          estimatedAmount: 1000000,
          assessedAmount: 950000,
          divergenceRate: -5.0,
          assessor: "ASSESSOR-A",
          assessmentDate: "2024-01-15",
        },
        {
          assessmentId: "ASSESS-002",
          estimatedAmount: 2000000,
          assessedAmount: 2100000,
          divergenceRate: 5.0,
          assessor: "ASSESSOR-B",
          assessmentDate: "2024-01-16",
        },
      ],
      patternClassification: {
        underprice: 1,
        overprice: 1,
        standard: 0,
      },
      qualityMetrics: {
        consistencyScore: 78.5,
        dataCompleteness: 100,
        sampleSize: 2,
      },
    };

    const postImprovementDataset = {
      assessmentData: [
        {
          assessmentId: "ASSESS-003",
          estimatedAmount: 1500000,
          assessedAmount: 1480000,
          divergenceRate: -1.33,
          assessor: "ASSESSOR-C",
          assessmentDate: "2024-02-15",
        },
        {
          assessmentId: "ASSESS-004",
          estimatedAmount: 2500000,
          assessedAmount: 2520000,
          divergenceRate: 0.8,
          assessor: "ASSESSOR-D",
          assessmentDate: "2024-02-16",
        },
      ],
      patternClassification: null,
      qualityMetrics: {
        consistencyScore: 85.2,
        dataCompleteness: 100,
        sampleSize: 2,
      },
    };

    expect(() =>
      analyzePrePostImprovementDivergencePatterns(
        preImprovementDataset,
        postImprovementDataset
      )
    ).toThrow(/欠落データ|揃っていない|完全性/);
  });
});