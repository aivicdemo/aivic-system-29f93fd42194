import { describe, test, expect, beforeEach } from "@jest/globals";
import { validateCrmVendorImplementationFeasibility } from "../../src/logic/it-1-br-1781935279444-1-2-1";

describe("月次サマリーテンプレートの定義・管理機能 - CRMベンダー実装可能性判定", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("SCEN-1336: CRMベンダー実装可能性判定 - 営業データ標準化仕様書が実装要件に適合し実装可能と判定される", () => {
    // 営業データ標準化仕様書の定義
    const operationDataSpecification = {
      version: "1.0.0",
      dataSchema: {
        items: [
          {
            fieldId: "appo_count",
            fieldName: "アポ数",
            dataType: "INTEGER",
            unit: "件",
            required: true,
          },
          {
            fieldId: "contract_count",
            fieldName: "成約数",
            dataType: "INTEGER",
            unit: "件",
            required: true,
          },
          {
            fieldId: "revenue_amount",
            fieldName: "売上金額",
            dataType: "DECIMAL",
            unit: "円",
            required: true,
          },
        ],
      },
      apiInterface: {
        endpoints: [
          {
            method: "GET",
            path: "/api/v1/operation-data",
            requestFormat: "JSON",
            responseFormat: "JSON",
          },
        ],
        authentication: "OAuth2",
        rateLimit: 1000,
        timeout: 30,
      },
      dataMapping: {
        items: [
          {
            sourceField: "appo_count",
            targetField: "monthly_appo",
            transformRule: "direct",
          },
          {
            sourceField: "contract_count",
            targetField: "monthly_contract",
            transformRule: "direct",
          },
          {
            sourceField: "revenue_amount",
            targetField: "monthly_revenue",
            transformRule: "sum_by_customer",
          },
        ],
      },
      customizationScope: {
        requiredCustomizations: [
          "data_validation_rule",
          "report_template_customization",
        ],
        estimatedEffort: 80,
      },
      performanceRequirement: {
        maxProcessingTime: 300,
        maxDataVolume: 1000000,
        concurrentUsers: 50,
      },
    };

    // CRMベンダー実装要件チェックリスト
    const vendorRequirementChecklist = {
      supportedDataTypes: [
        "INTEGER",
        "DECIMAL",
        "STRING",
        "DATE",
        "BOOLEAN",
      ],
      supportedApis: ["GET", "POST", "PUT", "DELETE"],
      supportedAuthMethods: ["OAuth2", "API_KEY", "BASIC"],
      supportedIntegrationMethods: ["REST", "WEBHOOK", "BATCH"],
      maxCustomizationEffort: 120,
      systemCapacity: {
        maxDataVolume: 5000000,
        maxConcurrentUsers: 200,
        maxProcessingTime: 60,
      },
      supportTeam: {
        available: true,
        responseTimeHours: 24,
        supportLanguages: ["ja", "en"],
      },
      deliveryDays: 45,
    };

    // 実装可能性判定の実行
    const result = validateCrmVendorImplementationFeasibility({
      operationDataSpecification,
      vendorRequirementChecklist,
    });

    // 期待値の検証
    expect(result.isImplementationFeasible).toBe(true);
    expect(result.totalCheckItems).toBe(8);
    expect(result.passedCheckItems).toBe(8);
    expect(result.failedCheckItems).toBe(0);

    // 各検証項目の詳細確認
    const schemaCheckResult = result.validationResults.find(
      (v: { checkItem: string }) => v.checkItem === "dataSchemaCompatibility"
    );
    expect(schemaCheckResult).toBeDefined();
    expect(schemaCheckResult.passed).toBe(true);
    expect(schemaCheckResult.details).toBe(
      "All data types (INTEGER, DECIMAL) are supported by vendor"
    );

    const apiCheckResult = result.validationResults.find(
      (v: { checkItem: string }) => v.checkItem === "apiInterfaceCompatibility"
    );
    expect(apiCheckResult).toBeDefined();
    expect(apiCheckResult.passed).toBe(true);
    expect(apiCheckResult.details).toContain("OAuth2");

    const mappingCheckResult = result.validationResults.find(
      (v: { checkItem: string }) =>
        v.checkItem === "dataMappingImplementability"
    );
    expect(mappingCheckResult).toBeDefined();
    expect(mappingCheckResult.passed).toBe(true);

    const customizationCheckResult = result.validationResults.find(
      (v: { checkItem: string }) => v.checkItem === "customizationScopeCheck"
    );
    expect(customizationCheckResult).toBeDefined();
    expect(customizationCheckResult.passed).toBe(true);
    expect(customizationCheckResult.details).toBe(
      "Required effort (80) is within vendor capacity (120)"
    );

    const performanceCheckResult = result.validationResults.find(
      (v: { checkItem: string }) => v.checkItem === "performanceRequirement"
    );
    expect(performanceCheckResult).toBeDefined();
    expect(performanceCheckResult.passed).toBe(true);
    expect(performanceCheckResult.details).toContain("Processing time: 300s");

    const supportCheckResult = result.validationResults.find(
      (v: { checkItem: string }) => v.checkItem === "supportTeamAvailability"
    );
    expect(supportCheckResult).toBeDefined();
    expect(supportCheckResult.passed).toBe(true);
    expect(supportCheckResult.details).toBe(
      "Support team available with 24-hour response time"
    );

    const deliveryCheckResult = result.validationResults.find(
      (v: { checkItem: string }) => v.checkItem === "deliveryFeasibility"
    );
    expect(deliveryCheckResult).toBeDefined();
    expect(deliveryCheckResult.passed).toBe(true);
    expect(deliveryCheckResult.details).toBe("Delivery within 45 days");

    const capacityCheckResult = result.validationResults.find(
      (v: { checkItem: string }) => v.checkItem === "systemCapacityValidation"
    );
    expect(capacityCheckResult).toBeDefined();
    expect(capacityCheckResult.passed).toBe(true);
    expect(capacityCheckResult.details).toContain(
      "Data volume: 1000000 / 5000000"
    );

    // 実装判定結果の記録内容確認
    expect(result.judgmentRecord).toBeDefined();
    expect(result.judgmentRecord.judgedAt).toBeDefined();
    expect(result.judgmentRecord.judgedBy).toBe("CRM_VENDOR_SYSTEM");
    expect(result.judgmentRecord.specificationVersion).toBe("1.0.0");
    expect(result.judgmentRecord.feasibilityStatus).toBe("FEASIBLE");
    expect(result.judgmentRecord.estimatedStartDate).toBeDefined();
    expect(result.judgmentRecord.estimatedCompletionDate).toBeDefined();

    // 推奨実装優先度の確認
    expect(result.recommendedImplementationPriority).toBe("HIGH");
    expect(result.riskAssessment.overallRisk).toBe("LOW");
    expect(result.riskAssessment.identifiedRisks).toHaveLength(0);

    // サマリーメッセージの確認
    expect(result.summary).toContain("すべての検証項目をクリア");
    expect(result.summary).toContain("実装可能");
  });
});