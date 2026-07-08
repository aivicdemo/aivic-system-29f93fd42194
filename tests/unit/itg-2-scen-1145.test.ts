import { detectPrecisionDeclineRootCauses } from "../../src/logic/it-1-br-6-2-1";

describe("査定員別判定ばらつき率と相場乖離傾向の自動集計・分析", () => {
  // SCEN-1145
  test("精度低下兆候検知機能 - 精度低下の根本原因候補が正確に特定される", () => {
    const assessmentDataset = {
      assessmentRecords: [
        {
          assessmentId: "ASSESS-001",
          estimateItemId: "ITEM-001",
          estimatedAmount: 1500000,
          referenceDataCount: 3,
          divergenceRate: 12.5,
          divergenceAmount: 187500,
          assessmentDate: "2024-01-15",
          region: "Tokyo",
          constructionType: "Building",
          season: "Winter",
        },
        {
          assessmentId: "ASSESS-002",
          estimateItemId: "ITEM-002",
          estimatedAmount: 2000000,
          referenceDataCount: 2,
          divergenceRate: 18.0,
          divergenceAmount: 360000,
          assessmentDate: "2024-01-16",
          region: "Osaka",
          constructionType: "Road",
          season: "Winter",
        },
        {
          assessmentId: "ASSESS-003",
          estimateItemId: "ITEM-001",
          estimatedAmount: 1600000,
          referenceDataCount: 1,
          divergenceRate: 25.0,
          divergenceAmount: 400000,
          assessmentDate: "2024-01-17",
          region: "Hokkaido",
          constructionType: "Building",
          season: "Winter",
        },
      ],
      ocrAccuracyPreviousMonth: 92.5,
      ocrAccuracyCurrentMonth: 85.0,
      aiJudgmentAccuracyPreviousMonth: 88.0,
      aiJudgmentAccuracyCurrentMonth: 78.5,
      pricebookVersion: "2023-12",
      pricebookUpdateDate: "2023-12-01",
      currentDate: "2024-01-17",
      seasonalDataAvailability: {
        Spring: true,
        Summer: true,
        Autumn: true,
        Winter: false,
      },
      learningDataCoverageByRegion: {
        Tokyo: 85,
        Osaka: 60,
        Hokkaido: 20,
      },
      learningDataCoverageByConstructionType: {
        Building: 80,
        Road: 45,
      },
    };

    const result = detectPrecisionDeclineRootCauses(assessmentDataset);

    expect(result).toEqual({
      detectionResult: "detected",
      rootCauseCandidates: [
        {
          causeCategory: "insufficient_learning_data",
          confidenceScore: 85,
          affectedItems: ["ASSESS-003"],
          affectedRegions: ["Hokkaido"],
          affectedConstructionTypes: ["Building"],
          estimatedImpactOnAccuracy: -6.5,
          priority: "high",
          recommendedAction: "追加学習データの収集と整備",
        },
        {
          causeCategory: "pricebook_not_reflected",
          confidenceScore: 72,
          affectedItems: ["ASSESS-001", "ASSESS-002"],
          affectedRegions: ["Tokyo", "Osaka"],
          affectedConstructionTypes: ["Building", "Road"],
          estimatedImpactOnAccuracy: -4.8,
          priority: "medium",
          recommendedAction: "物価本の最新版への更新",
        },
        {
          causeCategory: "seasonal_variation_not_addressed",
          confidenceScore: 78,
          affectedItems: ["ASSESS-001", "ASSESS-002", "ASSESS-003"],
          affectedRegions: ["Tokyo", "Osaka", "Hokkaido"],
          affectedConstructionTypes: ["Building", "Road"],
          estimatedImpactOnAccuracy: -3.7,
          priority: "medium",
          recommendedAction: "冬季データの追加と季節調整係数の適用",
        },
      ],
      ocrAccuracyDeclineRate: 7.5,
      aiJudgmentAccuracyDeclineRate: 9.5,
      alertThresholdExceeded: true,
      detailedReport: {
        reportGeneratedAt: "2024-01-17T00:00:00Z",
        analysisMethod: "学習データ偏り分析・物価本鮮度確認・季節変動カバレッジ診断",
        summaryOfFindings:
          "OCR精度が前月比-7.5%、AI判定精度が前月比-9.5%低下。学習データ不足（特に北海道）、物価本の未更新（2023-12版で古い）、冬季データの欠落が複合的に影響。",
        remediationPriority: [
          {
            rank: 1,
            causeCategory: "insufficient_learning_data",
            action: "北海道・Road工種の過去案件データ追加収集（最低50件）",
            estimatedCompletionDays: 7,
          },
          {
            rank: 2,
            causeCategory: "seasonal_variation_not_addressed",
            action: "冬季（12月～2月）の参考案件データ追加、季節補正係数の再計算",
            estimatedCompletionDays: 5,
          },
          {
            rank: 3,
            causeCategory: "pricebook_not_reflected",
            action: "2024年版物価本への更新、AI判定ロジックの再学習",
            estimatedCompletionDays: 3,
          },
        ],
        nextReviewDate: "2024-02-17",
      },
      multipleRootCausesDetected: true,
      allRootCausesIdentified: true,
    });

    expect(result.rootCauseCandidates.length).toBe(3);
    expect(result.rootCauseCandidates[0].causeCategory).toBe(
      "insufficient_learning_data"
    );
    expect(result.rootCauseCandidates[0].confidenceScore).toBe(85);
    expect(result.rootCauseCandidates[1].causeCategory).toBe(
      "pricebook_not_reflected"
    );
    expect(result.rootCauseCandidates[1].confidenceScore).toBe(72);
    expect(result.rootCauseCandidates[2].causeCategory).toBe(
      "seasonal_variation_not_addressed"
    );
    expect(result.rootCauseCandidates[2].confidenceScore).toBe(78);
    expect(result.ocrAccuracyDeclineRate).toBe(7.5);
    expect(result.aiJudgmentAccuracyDeclineRate).toBe(9.5);
    expect(result.alertThresholdExceeded).toBe(true);
    expect(result.multipleRootCausesDetected).toBe(true);
    expect(result.allRootCausesIdentified).toBe(true);
    expect(result.detailedReport).toBeDefined();
    expect(result.detailedReport.remediationPriority.length).toBe(3);
    expect(result.detailedReport.remediationPriority[0].rank).toBe(1);
    expect(result.detailedReport.remediationPriority[0].estimatedCompletionDays).toBe(7);
  });
});