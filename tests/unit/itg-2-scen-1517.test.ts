import { describe, test, expect } from "@jest/globals";
import {
  generateMonthlyImprovementReport,
  type MonthlyReportInput,
  type MonthlyReportOutput,
} from "../../src/logic/it-1-br-2-2-2-1";

describe("改善実績月次レポート自動集計", () => {
  // SCEN-1517: [error] 改善実績月次レポート自動集計 - 必須の精度指標データが存在しない場合、レポート生成エラーを返却
  test("必須の精度指標データが欠落している場合、エラーを返却", () => {
    const input: MonthlyReportInput = {
      yearMonth: "2024-01",
      assessorMetrics: [
        {
          assessorId: "assessor_001",
          assessmentCount: 150,
          averageProcessingTimeMinutes: 8.5,
          accuracyRate: 94.2,
          uniformityIndex: 0.87,
        },
        {
          assessorId: "assessor_002",
          assessmentCount: 145,
          averageProcessingTimeMinutes: 9.1,
          // accuracyRate が欠落（必須フィールド）
          uniformityIndex: 0.84,
        },
      ],
      systemUptimePercentage: 99.8,
      ocrAccuracyRate: 96.3,
      aiJudgmentAccuracyRate: 92.1,
    };

    expect(() => generateMonthlyImprovementReport(input)).toThrow(
      /精度指標/
    );
  });

  test("複数の必須精度指標が欠落している場合、エラーを返却", () => {
    const input: MonthlyReportInput = {
      yearMonth: "2024-02",
      assessorMetrics: [
        {
          assessorId: "assessor_003",
          assessmentCount: 160,
          averageProcessingTimeMinutes: 8.2,
          // accuracyRate と uniformityIndex が欠落
        },
      ],
      systemUptimePercentage: undefined,
      // ocrAccuracyRate が欠落（必須フィールド）
      aiJudgmentAccuracyRate: 91.5,
    };

    expect(() => generateMonthlyImprovementReport(input)).toThrow(
      /精度指標/
    );
  });

  test("査定員メトリクスが空配列の場合、エラーを返却", () => {
    const input: MonthlyReportInput = {
      yearMonth: "2024-03",
      assessorMetrics: [],
      systemUptimePercentage: 99.9,
      ocrAccuracyRate: 95.8,
      aiJudgmentAccuracyRate: 93.2,
    };

    expect(() => generateMonthlyImprovementReport(input)).toThrow(
      /精度指標/
    );
  });

  test("全必須精度指標が揃っている場合、レポートを生成する", () => {
    const input: MonthlyReportInput = {
      yearMonth: "2024-01",
      assessorMetrics: [
        {
          assessorId: "assessor_001",
          assessmentCount: 150,
          averageProcessingTimeMinutes: 8.5,
          accuracyRate: 94.2,
          uniformityIndex: 0.87,
        },
        {
          assessorId: "assessor_002",
          assessmentCount: 145,
          averageProcessingTimeMinutes: 9.1,
          accuracyRate: 92.8,
          uniformityIndex: 0.84,
        },
      ],
      systemUptimePercentage: 99.8,
      ocrAccuracyRate: 96.3,
      aiJudgmentAccuracyRate: 92.1,
    };

    const result: MonthlyReportOutput =
      generateMonthlyImprovementReport(input);

    expect(result).toBeDefined();
    expect(result.yearMonth).toBe("2024-01");
    expect(result.generatedAt).toBeDefined();
    expect(result.reportStatus).toBe("success");
    expect(result.assessorCount).toBe(2);
    expect(result.totalAssessmentCount).toBe(295);
    expect(result.averageAccuracyRate).toBeCloseTo(93.5, 1);
    expect(result.averageUniformityIndex).toBeCloseTo(0.855, 2);
    expect(result.systemUptimePercentage).toBe(99.8);
    expect(result.ocrAccuracyRate).toBe(96.3);
    expect(result.aiJudgmentAccuracyRate).toBe(92.1);
    expect(Array.isArray(result.assessorDetails)).toBe(true);
    expect(result.assessorDetails.length).toBe(2);
  });

  test("システム稼働率が欠落している場合、エラーを返却", () => {
    const input: MonthlyReportInput = {
      yearMonth: "2024-04",
      assessorMetrics: [
        {
          assessorId: "assessor_004",
          assessmentCount: 155,
          averageProcessingTimeMinutes: 8.8,
          accuracyRate: 93.5,
          uniformityIndex: 0.86,
        },
      ],
      systemUptimePercentage: undefined,
      ocrAccuracyRate: 95.2,
      aiJudgmentAccuracyRate: 91.8,
    };

    expect(() => generateMonthlyImprovementReport(input)).toThrow(
      /精度指標/
    );
  });

  test("OCR精度率が欠落している場合、エラーを返却", () => {
    const input: MonthlyReportInput = {
      yearMonth: "2024-05",
      assessorMetrics: [
        {
          assessorId: "assessor_005",
          assessmentCount: 152,
          averageProcessingTimeMinutes: 8.6,
          accuracyRate: 94.1,
          uniformityIndex: 0.85,
        },
      ],
      systemUptimePercentage: 99.7,
      ocrAccuracyRate: undefined,
      aiJudgmentAccuracyRate: 92.5,
    };

    expect(() => generateMonthlyImprovementReport(input)).toThrow(
      /精度指標/
    );
  });

  test("AI判定精度率が欠落している場合、エラーを返却", () => {
    const input: MonthlyReportInput = {
      yearMonth: "2024-06",
      assessorMetrics: [
        {
          assessorId: "assessor_006",
          assessmentCount: 158,
          averageProcessingTimeMinutes: 8.3,
          accuracyRate: 93.9,
          uniformityIndex: 0.88,
        },
      ],
      systemUptimePercentage: 99.9,
      ocrAccuracyRate: 96.5,
      aiJudgmentAccuracyRate: undefined,
    };

    expect(() => generateMonthlyImprovementReport(input)).toThrow(
      /精度指標/
    );
  });
});