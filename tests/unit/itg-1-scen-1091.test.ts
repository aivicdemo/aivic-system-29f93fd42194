import { evaluateStaffCompetency } from "../../src/logic/it-1-2-1";

describe("新入スタッフ到達度評価判定 - 請求書作成のみ不合格", () => {
  // SCEN-1091
  test("請求書作成のみ不合格の場合、追加指導判定となること", () => {
    const staffId = "staff_001";
    const evaluationData = {
      staffId,
      salesDataQuality: {
        score: 95,
        passed: true,
      },
      billingAutomation: {
        score: 90,
        passed: true,
      },
      invoiceCreation: {
        score: 60,
        passed: false,
      },
    };

    const result = evaluateStaffCompetency(evaluationData);

    expect(result.judgement).toBe("追加指導判定");
    expect(result.passed).toBe(false);
    expect(result.failureReasons).toEqual(["請求書作成"]);
    expect(result.message).toMatch(/請求書作成/);
    expect(result.staffId).toBe(staffId);
    expect(result.requiresAdditionalTraining).toBe(true);
  });

  // SCEN-1091: エラーケース - 評価データが不完全な場合
  test("評価データが不完全な場合、エラーをスロー", () => {
    const incompleteData = {
      staffId: "staff_002",
      salesDataQuality: {
        score: 85,
        passed: true,
      },
      billingAutomation: {
        score: 88,
        passed: true,
      },
      // invoiceCreation が欠落
    };

    expect(() => evaluateStaffCompetency(incompleteData as any)).toThrow(
      /評価項目/
    );
  });

  // SCEN-1091: エラーケース - スコアが範囲外の場合
  test("スコアが範囲外の場合、エラーをスロー", () => {
    const invalidData = {
      staffId: "staff_003",
      salesDataQuality: {
        score: 150,
        passed: true,
      },
      billingAutomation: {
        score: 90,
        passed: true,
      },
      invoiceCreation: {
        score: 70,
        passed: true,
      },
    };

    expect(() => evaluateStaffCompetency(invalidData)).toThrow(/スコア/);
  });

  // SCEN-1091: 成功ケース - すべて合格の場合
  test("すべて合格の場合、即戦力判定となること", () => {
    const allPassedData = {
      staffId: "staff_004",
      salesDataQuality: {
        score: 92,
        passed: true,
      },
      billingAutomation: {
        score: 88,
        passed: true,
      },
      invoiceCreation: {
        score: 85,
        passed: true,
      },
    };

    const result = evaluateStaffCompetency(allPassedData);

    expect(result.judgement).toBe("即戦力判定");
    expect(result.passed).toBe(true);
    expect(result.failureReasons).toEqual([]);
    expect(result.requiresAdditionalTraining).toBe(false);
  });

  // SCEN-1091: 境界値ケース - 複数項目不合格の場合
  test("複数項目不合格の場合、追加指導判定となること", () => {
    const multipleFailureData = {
      staffId: "staff_005",
      salesDataQuality: {
        score: 75,
        passed: false,
      },
      billingAutomation: {
        score: 65,
        passed: false,
      },
      invoiceCreation: {
        score: 55,
        passed: false,
      },
    };

    const result = evaluateStaffCompetency(multipleFailureData);

    expect(result.judgement).toBe("追加指導判定");
    expect(result.passed).toBe(false);
    expect(result.failureReasons).toEqual([
      "営業データ品質",
      "請求自動化処理",
      "請求書作成",
    ]);
    expect(result.requiresAdditionalTraining).toBe(true);
  });

  // SCEN-1091: 境界値ケース - 営業データ品質のみ不合格の場合
  test("営業データ品質のみ不合格の場合、追加指導判定となること", () => {
    const salesQualityFailureData = {
      staffId: "staff_006",
      salesDataQuality: {
        score: 60,
        passed: false,
      },
      billingAutomation: {
        score: 92,
        passed: true,
      },
      invoiceCreation: {
        score: 88,
        passed: true,
      },
    };

    const result = evaluateStaffCompetency(salesQualityFailureData);

    expect(result.judgement).toBe("追加指導判定");
    expect(result.passed).toBe(false);
    expect(result.failureReasons).toEqual(["営業データ品質"]);
  });

  // SCEN-1091: 境界値ケース - 請求自動化処理のみ不合格の場合
  test("請求自動化処理のみ不合格の場合、追加指導判定となること", () => {
    const billingAutomationFailureData = {
      staffId: "staff_007",
      salesDataQuality: {
        score: 90,
        passed: true,
      },
      billingAutomation: {
        score: 58,
        passed: false,
      },
      invoiceCreation: {
        score: 89,
        passed: true,
      },
    };

    const result = evaluateStaffCompetency(billingAutomationFailureData);

    expect(result.judgement).toBe("追加指導判定");
    expect(result.passed).toBe(false);
    expect(result.failureReasons).toEqual(["請求自動化処理"]);
  });
});