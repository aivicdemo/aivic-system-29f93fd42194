import { validateCrmImplementationFeasibility } from "../../src/logic/it-1781935279444-1-1-1";

describe("営業データ項目メタデータ管理 - CRM実装可能性判定", () => {
  test("SCEN-1337: 複雑な計算ロジックが CRM プロダクトで実装不可能な場合にエラーが返される", () => {
    // 手順1: 仕様書から計算ロジック要件を読み込む
    // （複雑な条件分岐、外部API連携、カスタム関数等を含む）
    const specificationData = {
      specificationId: "SPEC-001",
      dataItemId: "item-revenue-calc",
      dataItemName: "売上計算ロジック",
      calculationLogic:
        "IF(service_type='enterprise' AND month=12, base_revenue * 1.5 * EXTERNAL_API_CALL(customer_id), IF(previous_month_revenue > 100000, base_revenue * 0.95, base_revenue))",
      requiredFeatures: [
        "conditional_branching",
        "external_api_integration",
        "custom_date_functions",
        "nested_conditions",
      ],
      complexity: "high",
    };

    // 手順2: 対象CRMプロダクトの機能制限情報を取得する
    const crmProductCapabilities = {
      crmProductId: "crm-standard-2024",
      supportedFeatures: [
        "conditional_branching",
        "basic_arithmetic",
        "date_functions",
      ],
      unsupportedFeatures: ["external_api_integration", "custom_date_functions"],
      maxComplexityLevel: "medium",
    };

    // 手順3: 計算ロジックがCRMプロダクトで実装可能か判定ロジックを実行する
    const result = validateCrmImplementationFeasibility({
      specification: specificationData,
      crmProduct: crmProductCapabilities,
    });

    // 手順4-5: 実装不可能と判定されたロジック項目を確認する
    // 手順6: エラーハンドラーがトリガーされることを確認する
    expect(() => {
      if (!result.isImplementable) {
        throw new Error(result.errorCode);
      }
    }).toThrow(/実装不可能/);

    // 手順7: 返却されるエラーオブジェクトの構造を検証する
    expect(result).toHaveProperty("errorCode");
    expect(result).toHaveProperty("errorMessage");
    expect(result).toHaveProperty("details");
    expect(result).toHaveProperty("affectedSpecificationItems");

    // 手順8: エラーメッセージに実装不可能な理由が含まれていることを確認する
    expect(result.errorMessage).toMatch(/external_api_integration/);
    expect(result.errorMessage).toMatch(/custom_date_functions/);

    // 手順9: エラーオブジェクトの詳細検証
    expect(result.isImplementable).toBe(false);
    expect(result.errorCode).toBe("CRM_IMPLEMENTATION_NOT_FEASIBLE");
    expect(result.details).toHaveProperty("unsupportedFeatures");
    expect(result.details.unsupportedFeatures).toContain(
      "external_api_integration"
    );
    expect(result.details.unsupportedFeatures).toContain(
      "custom_date_functions"
    );
    expect(result.details.maxComplexityMismatch).toBe(true);
    expect(result.details.detectedComplexityLevel).toBe("high");
    expect(result.details.crmMaxComplexityLevel).toBe("medium");

    // 手順10: 対象となる仕様書項目の特定情報が含まれることを確認する
    expect(result.affectedSpecificationItems).toEqual({
      specificationId: "SPEC-001",
      dataItemId: "item-revenue-calc",
      dataItemName: "売上計算ロジック",
    });

    // 手順11: システムが以降の処理を適切に中断または代替処理へ遷移することを確認する
    expect(result.recommendedAction).toBe("STOP_IMPLEMENTATION");
    expect(result).toHaveProperty("alternativeOptions");
    expect(result.alternativeOptions).toContain(
      "simplify_calculation_logic"
    );
    expect(result.alternativeOptions).toContain("request_crm_custom_development");
  });
});