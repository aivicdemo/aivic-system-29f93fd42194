import { calculateScalingAndCorrectionCoefficients } from "../../src/logic/it-6-2-1-1";

describe("査定担当者別・工種別・金額帯別の判定精度指標の自動集計と可視化", () => {
  // SCEN-1313: [error] スケーリング係数と補正係数の自動計算 - 初期実績データが不完全または欠損している場合、計算不可エラーを検出する
  test("should throw error when required assessment data fields are missing", () => {
    const incompleteAssessmentDataSet = {
      assessmentId: "ASS-20240115-001",
      assessmentPrice: 1500000,
      marketPrice: undefined, // 欠損フィールド
      surveyDateTime: "2024-01-15T11:00:00Z",
      adjustmentFactor: 1.05,
      dataQualityScore: 95,
      assessmentCount: 120,
      uniformityIndex: 92,
      systemOperationRate: 98.5,
    };

    expect(() =>
      calculateScalingAndCorrectionCoefficients(incompleteAssessmentDataSet)
    ).toThrow(/市場価格/);
  });

  test("should throw error when survey datetime is missing", () => {
    const incompleteAssessmentDataSet = {
      assessmentId: "ASS-20240115-002",
      assessmentPrice: 1600000,
      marketPrice: 1550000,
      surveyDateTime: null, // 欠損フィールド
      adjustmentFactor: 1.03,
      dataQualityScore: 88,
      assessmentCount: 115,
      uniformityIndex: 90,
      systemOperationRate: 99.2,
    };

    expect(() =>
      calculateScalingAndCorrectionCoefficients(incompleteAssessmentDataSet)
    ).toThrow(/調査日時/);
  });

  test("should throw error when assessment price is missing", () => {
    const incompleteAssessmentDataSet = {
      assessmentId: "ASS-20240115-003",
      assessmentPrice: undefined, // 欠損フィールド
      marketPrice: 1480000,
      surveyDateTime: "2024-01-15T14:30:00Z",
      adjustmentFactor: 1.02,
      dataQualityScore: 91,
      assessmentCount: 125,
      uniformityIndex: 94,
      systemOperationRate: 98.8,
    };

    expect(() =>
      calculateScalingAndCorrectionCoefficients(incompleteAssessmentDataSet)
    ).toThrow(/査定価格/);
  });

  test("should throw error when adjustment factor is missing", () => {
    const incompleteAssessmentDataSet = {
      assessmentId: "ASS-20240115-004",
      assessmentPrice: 1700000,
      marketPrice: 1680000,
      surveyDateTime: "2024-01-15T09:15:00Z",
      adjustmentFactor: undefined, // 欠損フィールド
      dataQualityScore: 93,
      assessmentCount: 130,
      uniformityIndex: 91,
      systemOperationRate: 99.1,
    };

    expect(() =>
      calculateScalingAndCorrectionCoefficients(incompleteAssessmentDataSet)
    ).toThrow(/補正係数/);
  });

  test("should throw error when all critical fields are missing", () => {
    const incompleteAssessmentDataSet = {
      assessmentId: "ASS-20240115-005",
      assessmentPrice: undefined,
      marketPrice: undefined,
      surveyDateTime: undefined,
      adjustmentFactor: undefined,
      dataQualityScore: 85,
      assessmentCount: 100,
      uniformityIndex: 88,
      systemOperationRate: 97.5,
    };

    expect(() =>
      calculateScalingAndCorrectionCoefficients(incompleteAssessmentDataSet)
    ).toThrow(/必須データ/);
  });

  test("should successfully calculate scaling and correction coefficients with complete data", () => {
    const completeAssessmentDataSet = {
      assessmentId: "ASS-20240115-006",
      assessmentPrice: 1500000,
      marketPrice: 1450000,
      surveyDateTime: "2024-01-15T11:00:00Z",
      adjustmentFactor: 1.05,
      dataQualityScore: 95,
      assessmentCount: 120,
      uniformityIndex: 92,
      systemOperationRate: 98.5,
    };

    const result = calculateScalingAndCorrectionCoefficients(
      completeAssessmentDataSet
    );

    expect(result).toHaveProperty("scalingCoefficient");
    expect(result).toHaveProperty("correctionCoefficient");
    expect(typeof result.scalingCoefficient).toBe("number");
    expect(typeof result.correctionCoefficient).toBe("number");
    expect(result.scalingCoefficient).toBeGreaterThan(0);
    expect(result.correctionCoefficient).toBeGreaterThan(0);
    expect(result.scalingCoefficient).toBeLessThanOrEqual(2.0);
    expect(result.correctionCoefficient).toBeLessThanOrEqual(2.0);
  });

  test("should calculate correct scaling coefficient from assessment and market prices", () => {
    const assessmentDataSet = {
      assessmentId: "ASS-20240115-007",
      assessmentPrice: 2000000,
      marketPrice: 1600000,
      surveyDateTime: "2024-01-15T13:00:00Z",
      adjustmentFactor: 1.1,
      dataQualityScore: 94,
      assessmentCount: 140,
      uniformityIndex: 93,
      systemOperationRate: 99.0,
    };

    const result = calculateScalingAndCorrectionCoefficients(assessmentDataSet);

    const expectedScalingCoefficient = 2000000 / 1600000;
    expect(result.scalingCoefficient).toBeCloseTo(expectedScalingCoefficient, 5);
  });

  test("should calculate correction coefficient incorporating adjustment factor and data quality", () => {
    const assessmentDataSet = {
      assessmentId: "ASS-20240115-008",
      assessmentPrice: 1800000,
      marketPrice: 1700000,
      surveyDateTime: "2024-01-15T10:30:00Z",
      adjustmentFactor: 1.08,
      dataQualityScore: 92,
      assessmentCount: 135,
      uniformityIndex: 89,
      systemOperationRate: 98.7,
    };

    const result = calculateScalingAndCorrectionCoefficients(assessmentDataSet);

    expect(result.correctionCoefficient).toEqual(
      expect.any(Number)
    );
    expect(result.correctionCoefficient).toBeGreaterThan(0);
  });

  test("should throw error when assessment price is zero", () => {
    const invalidAssessmentDataSet = {
      assessmentId: "ASS-20240115-009",
      assessmentPrice: 0,
      marketPrice: 1500000,
      surveyDateTime: "2024-01-15T12:00:00Z",
      adjustmentFactor: 1.05,
      dataQualityScore: 90,
      assessmentCount: 125,
      uniformityIndex: 91,
      systemOperationRate: 98.9,
    };

    expect(() =>
      calculateScalingAndCorrectionCoefficients(invalidAssessmentDataSet)
    ).toThrow(/査定価格/);
  });

  test("should throw error when market price is zero", () => {
    const invalidAssessmentDataSet = {
      assessmentId: "ASS-20240115-010",
      assessmentPrice: 1550000,
      marketPrice: 0,
      surveyDateTime: "2024-01-15T15:00:00Z",
      adjustmentFactor: 1.02,
      dataQualityScore: 93,
      assessmentCount: 128,
      uniformityIndex: 90,
      systemOperationRate: 99.2,
    };

    expect(() =>
      calculateScalingAndCorrectionCoefficients(invalidAssessmentDataSet)
    ).toThrow(/市場価格/);
  });

  test("should throw error when adjustment factor is negative", () => {
    const invalidAssessmentDataSet = {
      assessmentId: "ASS-20240115-011",
      assessmentPrice: 1650000,
      marketPrice: 1600000,
      surveyDateTime: "2024-01-15T16:00:00Z",
      adjustmentFactor: -0.5,
      dataQualityScore: 91,
      assessmentCount: 130,
      uniformityIndex: 92,
      systemOperationRate: 98.6,
    };

    expect(() =>
      calculateScalingAndCorrectionCoefficients(invalidAssessmentDataSet)
    ).toThrow(/補正係数/);
  });

  test("should include error log details with missing field name and timestamp", () => {
    const incompleteAssessmentDataSet = {
      assessmentId: "ASS-20240115-012",
      assessmentPrice: 1750000,
      marketPrice: undefined,
      surveyDateTime: "2024-01-15T17:30:00Z",
      adjustmentFactor: 1.06,
      dataQualityScore: 94,
      assessmentCount: 132,
      uniformityIndex: 93,
      systemOperationRate: 99.1,
    };

    try {
      calculateScalingAndCorrectionCoefficients(incompleteAssessmentDataSet);
      fail("Expected error to be thrown");
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      if (error instanceof Error) {
        expect(error.message).toMatch(/市場価格/);
      }
    }
  });

  test("should return object with error status when calculation fails", () => {
    const incompleteAssessmentDataSet = {
      assessmentId: "ASS-20240115-013",
      assessmentPrice: undefined,
      marketPrice: 1500000,
      surveyDateTime: "2024-01-15T11:30:00Z",
      adjustmentFactor: 1.04,
      dataQualityScore: 88,
      assessmentCount: 118,
      uniformityIndex: 87,
      systemOperationRate: 98.3,
    };

    expect(() =>
      calculateScalingAndCorrectionCoefficients(incompleteAssessmentDataSet)
    ).toThrow(/査定価格/);
  });

  test("should not calculate coefficients when data is missing", () => {
    const incompleteAssessmentDataSet = {
      assessmentId: "ASS-20240115-014",
      assessmentPrice: 1600000,
      marketPrice: null,
      surveyDateTime: "2024-01-15T14:00:00Z",
      adjustmentFactor: 1.07,
      dataQualityScore: 92,
      assessmentCount: 127,
      uniformityIndex: 91,
      systemOperationRate: 99.0,
    };

    expect(() =>
      calculateScalingAndCorrectionCoefficients(incompleteAssessmentDataSet)
    ).toThrow(/市場価格/);
  });
});