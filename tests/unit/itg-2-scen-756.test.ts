import { validateAssessmentDocumentGeneration } from "../../src/logic/it-6-3-1";

describe("査定結果説明資料の自動生成・配信機能 - 判定根拠検証", () => {
  // SCEN-756: [error] 査定結果説明資料の自動生成・配信機能 - 判定根拠が不完全な場合、生成前に検証エラーが返される
  test("should return validation error when assessment rationale is incomplete", () => {
    const incompleteAssessmentData = {
      assessmentId: "ASS-2024-001",
      quoteId: "QT-2024-12345",
      quotationAmount: 5000000,
      workType: "建築工事",
      region: "東京都",
      assessmentDate: "2024-01-15T10:30:00Z",
      assessorId: "ASSESSOR-001",
      rationale: {
        reason: "", // 判定理由が空値
        basis: "相場データとの比較", // 基準は記入
        judgmentMaterial: "過去案件データ5件参照", // 判断材料は記入
      },
      deviationRate: 12.5,
      deviationAmount: 625000,
      referenceDataCount: 5,
      correctionCoefficient: 1.0,
      judgmentResult: "修正指示",
      approvalStatus: "待機中",
    };

    expect(() =>
      validateAssessmentDocumentGeneration(incompleteAssessmentData)
    ).toThrow(/判定理由/);
  });

  test("should return validation error when basis is missing", () => {
    const missingBasisData = {
      assessmentId: "ASS-2024-002",
      quoteId: "QT-2024-12346",
      quotationAmount: 3500000,
      workType: "土木工事",
      region: "大阪府",
      assessmentDate: "2024-01-16T14:00:00Z",
      assessorId: "ASSESSOR-002",
      rationale: {
        reason: "市場相場を大きく上回る見積", // 理由は記入
        basis: null, // 基準がnull
        judgmentMaterial: "物価本2024年版参照", // 判断材料は記入
      },
      deviationRate: 18.3,
      deviationAmount: 640500,
      referenceDataCount: 8,
      correctionCoefficient: 0.95,
      judgmentResult: "承認",
      approvalStatus: "待機中",
    };

    expect(() =>
      validateAssessmentDocumentGeneration(missingBasisData)
    ).toThrow(/基準/);
  });

  test("should return validation error when judgmentMaterial is empty", () => {
    const missingMaterialData = {
      assessmentId: "ASS-2024-003",
      quoteId: "QT-2024-12347",
      quotationAmount: 2800000,
      workType: "設備工事",
      region: "神奈川県",
      assessmentDate: "2024-01-17T09:15:00Z",
      assessorId: "ASSESSOR-003",
      rationale: {
        reason: "地域別単価差を考慮した修正提案", // 理由は記入
        basis: "地域別相場マスタ", // 基準は記入
        judgmentMaterial: "", // 判断材料が空文字
      },
      deviationRate: -5.2,
      deviationAmount: -145600,
      referenceDataCount: 3,
      correctionCoefficient: 1.05,
      judgmentResult: "修正指示",
      approvalStatus: "待機中",
    };

    expect(() =>
      validateAssessmentDocumentGeneration(missingMaterialData)
    ).toThrow(/判断材料/);
  });

  test("should return validation error when multiple rationale fields are incomplete", () => {
    const multipleIncompleteData = {
      assessmentId: "ASS-2024-004",
      quoteId: "QT-2024-12348",
      quotationAmount: 4200000,
      workType: "改修工事",
      region: "福岡県",
      assessmentDate: "2024-01-18T13:45:00Z",
      assessorId: "ASSESSOR-004",
      rationale: {
        reason: undefined, // 理由が未定義
        basis: "", // 基準が空文字
        judgmentMaterial: null, // 判断材料がnull
      },
      deviationRate: 22.7,
      deviationAmount: 953400,
      referenceDataCount: 6,
      correctionCoefficient: 0.98,
      judgmentResult: "修正指示",
      approvalStatus: "待機中",
    };

    expect(() =>
      validateAssessmentDocumentGeneration(multipleIncompleteData)
    ).toThrow(/判定理由/);
  });

  test("should return validation error when rationale object is null", () => {
    const nullRationaleData = {
      assessmentId: "ASS-2024-005",
      quoteId: "QT-2024-12349",
      quotationAmount: 6100000,
      workType: "防水工事",
      region: "京都府",
      assessmentDate: "2024-01-19T11:20:00Z",
      assessorId: "ASSESSOR-005",
      rationale: null, // 判定根拠全体がnull
      deviationRate: 8.9,
      deviationAmount: 542900,
      referenceDataCount: 4,
      correctionCoefficient: 1.02,
      judgmentResult: "承認",
      approvalStatus: "待機中",
    };

    expect(() =>
      validateAssessmentDocumentGeneration(nullRationaleData)
    ).toThrow(/判定根拠/);
  });

  test("should return validation error with missing field name in error message", () => {
    const partialRationaleData = {
      assessmentId: "ASS-2024-006",
      quoteId: "QT-2024-12350",
      quotationAmount: 3900000,
      workType: "塗装工事",
      region: "埼玉県",
      assessmentDate: "2024-01-20T15:30:00Z",
      assessorId: "ASSESSOR-006",
      rationale: {
        reason: "季節変動を考慮した金額調整", // 理由は記入
        basis: "相場マスタ", // 基準は記入
        judgmentMaterial: "", // 判断材料が空
      },
      deviationRate: -3.1,
      deviationAmount: -120900,
      referenceDataCount: 7,
      correctionCoefficient: 1.01,
      judgmentResult: "修正指示",
      approvalStatus: "待機中",
    };

    const error = new Error();
    try {
      validateAssessmentDocumentGeneration(partialRationaleData);
    } catch (e: any) {
      error.message = e.message;
    }

    expect(error.message).toMatch(/判断材料/);
  });

  test("should succeed when all rationale fields are complete", () => {
    const completeAssessmentData = {
      assessmentId: "ASS-2024-007",
      quoteId: "QT-2024-12351",
      quotationAmount: 4500000,
      workType: "内装工事",
      region: "千葉県",
      assessmentDate: "2024-01-21T10:00:00Z",
      assessorId: "ASSESSOR-007",
      rationale: {
        reason: "相場データに基づく適正金額提案",
        basis: "過去12ヶ月の相場マスタ",
        judgmentMaterial: "類似案件5件、物価本2024年版",
      },
      deviationRate: 2.5,
      deviationAmount: 112500,
      referenceDataCount: 5,
      correctionCoefficient: 1.0,
      judgmentResult: "承認",
      approvalStatus: "待機中",
    };

    const result = validateAssessmentDocumentGeneration(completeAssessmentData);

    expect(result).toEqual({
      isValid: true,
      generationAllowed: true,
      missingFields: [],
      errorMessage: null,
    });
  });

  test("should include all missing field names in error details", () => {
    const allMissingData = {
      assessmentId: "ASS-2024-008",
      quoteId: "QT-2024-12352",
      quotationAmount: 2300000,
      workType: "躯体工事",
      region: "奈良県",
      assessmentDate: "2024-01-22T12:30:00Z",
      assessorId: "ASSESSOR-008",
      rationale: {
        reason: "",
        basis: "",
        judgmentMaterial: "",
      },
      deviationRate: 15.8,
      deviationAmount: 363400,
      referenceDataCount: 2,
      correctionCoefficient: 0.99,
      judgmentResult: "修正指示",
      approvalStatus: "待機中",
    };

    const result = validateAssessmentDocumentGeneration(allMissingData);

    expect(result.isValid).toBe(false);
    expect(result.generationAllowed).toBe(false);
    expect(result.missingFields.length).toBeGreaterThan(0);
    expect(result.missingFields).toContain("判定理由");
    expect(result.missingFields).toContain("基準");
    expect(result.missingFields).toContain("判断材料");
  });

  test("should prevent document generation when validation fails", () => {
    const incompleteData = {
      assessmentId: "ASS-2024-009",
      quoteId: "QT-2024-12353",
      quotationAmount: 5600000,
      workType: "電気工事",
      region: "滋賀県",
      assessmentDate: "2024-01-23T08:45:00Z",
      assessorId: "ASSESSOR-009",
      rationale: {
        reason: "入札相場を参考に提案",
        basis: null,
        judgmentMaterial: "入札情報3件",
      },
      deviationRate: 7.2,
      deviationAmount: 403200,
      referenceDataCount: 3,
      correctionCoefficient: 1.03,
      judgmentResult: "修正指示",
      approvalStatus: "待機中",
    };

    const result = validateAssessmentDocumentGeneration(incompleteData);

    expect(result.generationAllowed).toBe(false);
    expect(result.isValid).toBe(false);
  });
});