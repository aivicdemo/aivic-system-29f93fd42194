import { describe, test, expect } from "@jest/globals";
import { aggregateAssessmentPrecisionByDimensions } from "../../src/logic/it-6-2-1-1";

describe("査定担当者別・工種別・金額帯別の判定精度指標の自動集計と可視化", () => {
  // SCEN-1085: [error] 月次人員配置計画の策定 - 能力レベルデータが不足している場合、エラーを返す
  test("should return error when ability level data is insufficient for monthly staffing plan", () => {
    const assessorId_001 = "ASR-001";
    const assessorId_002 = "ASR-002";
    const assessorId_003 = "ASR-003";

    const assessmentResults = [
      {
        assessorId: assessorId_001,
        workType: "土木",
        amountBand: "1000万以上",
        deviationRate: 5.2,
        deviationAmount: 520000,
        referenceDataCount: 45,
        processingTimeMinutes: 28,
        judgmentAccuracy: 94.5,
        assessmentDate: "2024-01-15",
      },
      {
        assessorId: assessorId_002,
        workType: "建築",
        amountBand: "500万～1000万",
        deviationRate: 8.7,
        deviationAmount: 435000,
        referenceDataCount: 32,
        processingTimeMinutes: 35,
        judgmentAccuracy: 89.2,
        assessmentDate: "2024-01-16",
      },
      {
        assessorId: assessorId_003,
        workType: "設備",
        amountBand: "100万～500万",
        deviationRate: 12.1,
        deviationAmount: 605000,
        referenceDataCount: 18,
        processingTimeMinutes: 42,
        judgmentAccuracy: 85.8,
        assessmentDate: "2024-01-17",
      },
    ];

    const assessorAbilityData = [
      {
        assessorId: assessorId_001,
        name: "田中太郎",
        experienceYears: 8,
        abilityLevel: "senior",
        certificationStatus: "qualified",
        monthlyCapacity: 150,
      },
      {
        assessorId: assessorId_002,
        name: "鈴木花子",
        experienceYears: 3,
        abilityLevel: "junior",
        certificationStatus: "qualified",
        monthlyCapacity: 100,
      },
    ];

    const targetMonth = "2024-01";
    const requiredAbilityLevelFields = [
      "assessorId",
      "abilityLevel",
      "certificationStatus",
      "monthlyCapacity",
    ];

    const result = aggregateAssessmentPrecisionByDimensions({
      assessmentResults,
      assessorAbilityData,
      targetMonth,
      requiredAbilityLevelFields,
    });

    expect(result).toHaveProperty("error");
    expect(result.error).toBeTruthy();
    expect(result.error).toMatch(/能力レベル/);
    expect(result).toHaveProperty("missingAssessors");
    expect(result.missingAssessors).toContain(assessorId_003);
    expect(result).toHaveProperty("status");
    expect(result.status).toBe("error");
    expect(result).toHaveProperty("errorLog");
    expect(result.errorLog).toMatch(/ASR-003/);
  });
});