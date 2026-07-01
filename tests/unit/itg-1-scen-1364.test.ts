import { describe, test, expect, beforeEach } from "@jest/globals";
import {
  finalizeDataSpecification,
} from "../../src/logic/it-1781935279444-2-1-1";

describe("営業データ標準化仕様書確定機能", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-1364
  test("[normal] CRMベンダー実装可能性確認後、データ項目定義・計算ロジック・レポートマッピング・品質検証ルールが統合された最終仕様が確定される", () => {
    const specificationId = "SPEC-20240115-001";
    const vendorConfirmationStatus = "confirmed";
    const dataItemDefinitions = [
      {
        itemId: "ITEM-APO-001",
        itemName: "アポ数",
        unit: "件",
        dataType: "integer",
        required: true,
      },
      {
        itemId: "ITEM-DEAL-001",
        itemName: "成約数",
        unit: "件",
        dataType: "integer",
        required: true,
      },
      {
        itemId: "ITEM-FEEDBACK-001",
        itemName: "顧客反応",
        unit: "スコア",
        dataType: "number",
        required: false,
      },
    ];
    const calculationLogics = [
      {
        logicId: "CALC-001",
        sourceItems: ["ITEM-APO-001"],
        formula: "sum(ITEM-APO-001)",
        description: "月間アポ数合計",
      },
      {
        logicId: "CALC-002",
        sourceItems: ["ITEM-DEAL-001"],
        formula: "sum(ITEM-DEAL-001)",
        description: "月間成約数合計",
      },
    ];
    const reportMappings = [
      {
        mappingId: "MAP-001",
        reportFieldName: "monthly_appointments",
        itemId: "ITEM-APO-001",
        transformRule: "direct",
      },
      {
        mappingId: "MAP-002",
        reportFieldName: "monthly_deals",
        itemId: "ITEM-DEAL-001",
        transformRule: "direct",
      },
      {
        mappingId: "MAP-003",
        reportFieldName: "deal_rate",
        calculationLogicId: "CALC-002",
        transformRule: "calculated",
      },
    ];
    const validationRules = [
      {
        ruleId: "VAL-001",
        itemId: "ITEM-APO-001",
        ruleType: "required",
        constraint: "not_null",
      },
      {
        ruleId: "VAL-002",
        itemId: "ITEM-APO-001",
        ruleType: "range",
        minValue: 0,
        maxValue: 1000,
      },
      {
        ruleId: "VAL-003",
        itemId: "ITEM-DEAL-001",
        ruleType: "required",
        constraint: "not_null",
      },
      {
        ruleId: "VAL-004",
        itemId: "ITEM-FEEDBACK-001",
        ruleType: "datatype",
        expectedDataType: "number",
      },
    ];
    const confirmationDialog = true;

    const result = finalizeDataSpecification({
      specificationId,
      vendorConfirmationStatus,
      dataItemDefinitions,
      calculationLogics,
      reportMappings,
      validationRules,
      confirmationDialog,
    });

    expect(result.specificationId).toBe("SPEC-20240115-001");
    expect(result.status).toBe("finalized");
    expect(result.isEditable).toBe(false);
    expect(result.dataItemDefinitions).toHaveLength(3);
    expect(result.dataItemDefinitions[0]).toEqual({
      itemId: "ITEM-APO-001",
      itemName: "アポ数",
      unit: "件",
      dataType: "integer",
      required: true,
    });
    expect(result.dataItemDefinitions[1]).toEqual({
      itemId: "ITEM-DEAL-001",
      itemName: "成約数",
      unit: "件",
      dataType: "integer",
      required: true,
    });
    expect(result.dataItemDefinitions[2]).toEqual({
      itemId: "ITEM-FEEDBACK-001",
      itemName: "顧客反応",
      unit: "スコア",
      dataType: "number",
      required: false,
    });
    expect(result.calculationLogics).toHaveLength(2);
    expect(result.calculationLogics[0]).toEqual({
      logicId: "CALC-001",
      sourceItems: ["ITEM-APO-001"],
      formula: "sum(ITEM-APO-001)",
      description: "月間アポ数合計",
    });
    expect(result.calculationLogics[1]).toEqual({
      logicId: "CALC-002",
      sourceItems: ["ITEM-DEAL-001"],
      formula: "sum(ITEM-DEAL-001)",
      description: "月間成約数合計",
    });
    expect(result.reportMappings).toHaveLength(3);
    expect(result.reportMappings[0]).toEqual({
      mappingId: "MAP-001",
      reportFieldName: "monthly_appointments",
      itemId: "ITEM-APO-001",
      transformRule: "direct",
    });
    expect(result.reportMappings[1]).toEqual({
      mappingId: "MAP-002",
      reportFieldName: "monthly_deals",
      itemId: "ITEM-DEAL-001",
      transformRule: "direct",
    });
    expect(result.reportMappings[2]).toEqual({
      mappingId: "MAP-003",
      reportFieldName: "deal_rate",
      calculationLogicId: "CALC-002",
      transformRule: "calculated",
    });
    expect(result.validationRules).toHaveLength(4);
    expect(result.validationRules[0]).toEqual({
      ruleId: "VAL-001",
      itemId: "ITEM-APO-001",
      ruleType: "required",
      constraint: "not_null",
    });
    expect(result.validationRules[1]).toEqual({
      ruleId: "VAL-002",
      itemId: "ITEM-APO-001",
      ruleType: "range",
      minValue: 0,
      maxValue: 1000,
    });
    expect(result.validationRules[2]).toEqual({
      ruleId: "VAL-003",
      itemId: "ITEM-DEAL-001",
      ruleType: "required",
      constraint: "not_null",
    });
    expect(result.validationRules[3]).toEqual({
      ruleId: "VAL-004",
      itemId: "ITEM-FEEDBACK-001",
      ruleType: "datatype",
      expectedDataType: "number",
    });
    expect(result.notificationMessage).toBe("仕様書確定が完了しました");
    expect(result.finalizedAt).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/
    );
    expect(result.vendorConfirmationStatus).toBe("confirmed");
  });
});