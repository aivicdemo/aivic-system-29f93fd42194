import {
  detectNewExceptionCases,
  checkExceptionCaseInManual,
  determineManualUpdateNecessity,
} from "../../src/logic/it-1781935279444-1-1-1";

describe("営業データ項目のメタデータ管理機能 - 請求ルール例外ケース検出と手順書更新判定", () => {
  // SCEN-974: [normal] 請求ルール例外ケース検出と手順書更新判定 - 顧客異議から検出された新しい例外ケースが手順書に存在せず、手順書更新の必要性が判定される
  test("顧客異議から検出された新規例外ケースが手順書に存在しない場合、更新必要フラグが立てられる", () => {
    // 入力: 顧客からの異議データ
    const customerObjectionData = {
      objectId: "OBJ-20240215-001",
      customerId: "CUST-A001",
      objectType: "billing_amount_discrepancy",
      objectDescription:
        "請求額が契約時の割引率を反映していない。割引率50%で契約したが、請求額は割引なしで計算されている",
      detectedDate: "2024-02-15T09:30:00Z",
      objectionStatus: "pending_investigation",
    };

    // 既存の手順書に含まれる例外ケース
    const existingManualCases = [
      {
        caseId: "EC-001",
        caseDescription: "複数契約顧客の割引ルール適用",
        appliedRules: "基本割引率 * 複数契約ボーナス割引率",
      },
      {
        caseId: "EC-002",
        caseDescription: "キャンペーン期間中の割引併用",
        appliedRules: "MAX(基本割引率, キャンペーン割引率)",
      },
    ];

    // 手順書内に検索対象の例外ケースが存在しないことを確認
    const newExceptionCaseDescription =
      "単一契約顧客の割引率未反映ケース - 請求データ生成時に割引フラグが未反映される";
    const existsInManual = checkExceptionCaseInManual(
      newExceptionCaseDescription,
      existingManualCases
    );
    expect(existsInManual).toBe(false);

    // 顧客異議から新規例外ケースを検出
    const detectedNewCases = detectNewExceptionCases(
      customerObjectionData,
      existingManualCases
    );
    expect(detectedNewCases).toHaveLength(1);
    expect(detectedNewCases[0]).toEqual({
      newCaseId: "EC-003",
      caseDescription: "単一契約顧客の割引率未反映ケース",
      rootCause: "請求データ生成時に割引フラグが未反映される",
      affectedCustomers: 1,
      severity: "high",
      recommendedFix: "割引フラグの検証ロジックを請求データ生成直前に追加",
    });

    // 新規検出ケースに対して手順書更新必要性を判定
    const updateNecessityResult = determineManualUpdateNecessity(
      detectedNewCases[0],
      existingManualCases
    );

    // 期待結果: 手順書更新が必要
    expect(updateNecessityResult.updateRequired).toBe(true);
    expect(updateNecessityResult.updateStatus).toBe("更新必要");
    expect(updateNecessityResult.targetCaseId).toBe("EC-003");
    expect(updateNecessityResult.exceptionCaseDetail).toEqual({
      caseId: "EC-003",
      caseDescription: "単一契約顧客の割引率未反映ケース",
      rootCauseAnalysis:
        "請求データ生成時に割引フラグが未反映される - 顧客異議データから検出",
      impactAssessment: {
        affectedRecordCount: 1,
        severityLevel: "high",
        businessImpact: "請求額計算誤り、顧客信頼喪失の可能性",
      },
      reportingSource: customerObjectionData.objectId,
      reportingDate: "2024-02-15T09:30:00Z",
    });
    expect(updateNecessityResult.suggestedManualUpdate).toEqual({
      sectionToInsert: "例外ケース管理",
      newCaseEntry: {
        caseId: "EC-003",
        caseDescription: "単一契約顧客の割引率未反映ケース",
        triggerCondition: "請求対象顧客が割引契約を持つ場合",
        checkProcess:
          "請求データ生成時に割引フラグ値を確認し、契約マスタの割引率と一致することを検証",
        correctionMethod: "割引フラグが未反映の場合、契約マスタから割引率を再取得して適用",
        preventionMeasure:
          "請求ロジックに割引フラグの検証ステップを追加し、自動化処理の直前に検査",
      },
      priority: "immediate",
      estimatedUpdateTime: "2024-02-15",
    });

    // 手順書更新が不要なケース (既存マニュアルに記載済み) も検証
    const alreadyDocumentedCase = {
      caseId: "EC-001",
      caseDescription: "複数契約顧客の割引ルール適用",
      rootCause: "マニュアルに既に記載済み",
      affectedCustomers: 0,
      severity: "low",
      recommendedFix: "既存手順書に従う",
    };

    const updateNecessityForDocumented = determineManualUpdateNecessity(
      alreadyDocumentedCase,
      existingManualCases
    );
    expect(updateNecessityForDocumented.updateRequired).toBe(false);
    expect(updateNecessityForDocumented.updateStatus).toBe("更新不要");
  });
});