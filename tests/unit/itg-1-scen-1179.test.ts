import { validateSalesDataStructure } from "../../src/logic/it-1781935279444-2-2-1";

describe("営業データの完全性・正確性を自動検証し、不足データ・誤りを検出・通知する機能", () => {
  // SCEN-1179: [normal] 検証結果と根拠資料の構造化整理機能 - 計算ロジックの根拠を含めて検証結果を構造化できる
  test("検証結果が計算ロジックの根拠を含めて構造化され、入力パラメータから最終結果まで階層的に整理され、JSON形式で正しくシリアライズされ、外部システムとの連携が可能な状態で保存されること", () => {
    // 入力: 単価と数量を含む営業データ検証ケース
    const validationInput = {
      caseId: "CASE-20240115-001",
      validationType: "calculateRevenue",
      inputParameters: {
        unitPrice: 5000,
        quantity: 12,
      },
      calculationLogic: "revenue = unitPrice * quantity",
    };

    // 実行: 検証結果を構造化データとして取得
    const validationResult = validateSalesDataStructure(validationInput);

    // 期待値: 計算ロジックの各ステップが根拠として記録された構造化データ
    expect(validationResult).toEqual({
      caseId: "CASE-20240115-001",
      validationType: "calculateRevenue",
      validationStatus: "success",
      structuredResult: {
        calculationFormula: "revenue = unitPrice * quantity",
        inputParameters: {
          unitPrice: 5000,
          quantity: 12,
        },
        intermediateResults: [
          {
            step: 1,
            description: "単価パラメータ確認",
            value: 5000,
            unit: "円",
          },
          {
            step: 2,
            description: "数量パラメータ確認",
            value: 12,
            unit: "件",
          },
          {
            step: 3,
            description: "乗算処理実行",
            expression: "5000 * 12",
            value: 60000,
            unit: "円",
          },
        ],
        finalResult: {
          value: 60000,
          unit: "円",
          description: "売上金額",
        },
        validationBasis: {
          dataCompleteness: true,
          dataTypeValidation: true,
          rangeValidation: true,
          calculationAccuracy: true,
        },
      },
      jsonSerialized: {
        serialized: true,
        format: "application/json",
        hierarchyLevels: 4,
        leafNodeCount: 8,
      },
      externalIntegration: {
        storageStatus: "persisted",
        integrationType: "api_ready",
        persistedAt: "2024-01-15T11:00:00Z",
        externalSystemsReady: true,
      },
    });

    // 検証: 計算式の各ステップが根拠として正しく記録されていること
    expect(validationResult.structuredResult.intermediateResults).toHaveLength(
      3
    );
    expect(validationResult.structuredResult.intermediateResults[0].step).toBe(
      1
    );
    expect(validationResult.structuredResult.intermediateResults[0].value).toBe(
      5000
    );
    expect(validationResult.structuredResult.intermediateResults[1].step).toBe(
      2
    );
    expect(validationResult.structuredResult.intermediateResults[1].value).toBe(
      12
    );
    expect(validationResult.structuredResult.intermediateResults[2].step).toBe(
      3
    );
    expect(validationResult.structuredResult.intermediateResults[2].value).toBe(
      60000
    );

    // 検証: 最終結果が正確に計算されていること
    expect(validationResult.structuredResult.finalResult.value).toBe(60000);
    expect(validationResult.structuredResult.finalResult.description).toBe(
      "売上金額"
    );

    // 検証: JSON形式でシリアライズされていること
    expect(validationResult.jsonSerialized.serialized).toBe(true);
    expect(validationResult.jsonSerialized.format).toBe("application/json");
    expect(validationResult.jsonSerialized.hierarchyLevels).toBe(4);

    // 検証: 外部システムとの連携が可能な状態で保存されていること
    expect(validationResult.externalIntegration.storageStatus).toBe(
      "persisted"
    );
    expect(validationResult.externalIntegration.integrationType).toBe(
      "api_ready"
    );
    expect(validationResult.externalIntegration.externalSystemsReady).toBe(
      true
    );

    // 検証: データの完全性・正確性がすべて確認されていること
    expect(validationResult.structuredResult.validationBasis).toEqual({
      dataCompleteness: true,
      dataTypeValidation: true,
      rangeValidation: true,
      calculationAccuracy: true,
    });

    // 検証: 計算ロジックが根拠資料として正しく記録されていること
    expect(
      validationResult.structuredResult.calculationFormula
    ).toContain("unitPrice");
    expect(
      validationResult.structuredResult.calculationFormula
    ).toContain("quantity");
  });
});