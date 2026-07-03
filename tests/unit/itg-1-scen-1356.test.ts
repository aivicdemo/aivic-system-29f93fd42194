import { describe, test, expect } from "@jest/globals";
import {
  validateSalesDataCompatibility,
} from "../../src/logic/it-1781935279444-1-1-1";

describe("営業データ項目のメタデータ管理機能", () => {
  test("SCEN-1356: 営業システムとの連携互換性検証 - 標準フォーマットデータが連携仕様と完全一致する場合、変換ルール不要と判定される", () => {
    // ============ Precondition: 営業システムからの標準フォーマットデータ ============
    const salesSystemDataItem = {
      item_id: "sales_apocount_001",
      item_name: "アポ件数",
      unit: "件",
      data_type: "integer",
      calculation_logic: "COUNT(appointment_records WHERE status='confirmed')",
      report_mapping: "monthly_summary.appointments_count",
    };

    // ============ Precondition: 連携仕様書で定義されたメタデータ ============
    const integrationSpecificationMetadata = {
      item_id: "sales_apocount_001",
      item_name: "アポ件数",
      unit: "件",
      data_type: "integer",
      calculation_logic: "COUNT(appointment_records WHERE status='confirmed')",
      report_mapping: "monthly_summary.appointments_count",
    };

    // ============ Trigger: 連携互換性検証機能を実行 ============
    const validationResult = validateSalesDataCompatibility({
      incomingDataItem: salesSystemDataItem,
      specificationMetadata: integrationSpecificationMetadata,
    });

    // ============ Outcome: 検証結果の確認 ============
    // 1. 互換性検証が成功し、一致状態を判定
    expect(validationResult.is_compatible).toBe(true);

    // 2. 変換ルール要否判定: 標準フォーマットと完全一致しているため『不要』と判定
    expect(validationResult.transformation_rule_required).toBe(false);

    // 3. 差分がないことを確認
    expect(validationResult.differences).toEqual([]);

    // 4. データ処理フロー判定: 変換処理をスキップして直接請求自動化へ進む
    expect(validationResult.processing_flow).toBe("skip_transformation");

    // ============ 追加検証: 複数データ項目の連携 ============
    // シナリオ拡張: 複数の営業データ項目が連携仕様と全て一致する場合
    const multipleDataItems = [
      {
        item_id: "sales_contractcount_001",
        item_name: "成約件数",
        unit: "件",
        data_type: "integer",
        calculation_logic: "COUNT(contracts WHERE status='closed')",
        report_mapping: "monthly_summary.contracts_count",
      },
      {
        item_id: "sales_revenue_001",
        item_name: "売上金額",
        unit: "円",
        data_type: "decimal",
        calculation_logic: "SUM(contract_amounts WHERE status='closed')",
        report_mapping: "monthly_summary.revenue_total",
      },
    ];

    const specificationMetadataList = [
      {
        item_id: "sales_contractcount_001",
        item_name: "成約件数",
        unit: "件",
        data_type: "integer",
        calculation_logic: "COUNT(contracts WHERE status='closed')",
        report_mapping: "monthly_summary.contracts_count",
      },
      {
        item_id: "sales_revenue_001",
        item_name: "売上金額",
        unit: "円",
        data_type: "decimal",
        calculation_logic: "SUM(contract_amounts WHERE status='closed')",
        report_mapping: "monthly_summary.revenue_total",
      },
    ];

    const batchValidationResult = validateSalesDataCompatibility({
      incomingDataItem: multipleDataItems,
      specificationMetadata: specificationMetadataList,
    });

    // 複数データ項目がすべて互換性あり
    expect(batchValidationResult.is_compatible).toBe(true);
    expect(batchValidationResult.transformation_rule_required).toBe(false);
    expect(batchValidationResult.processing_flow).toBe("skip_transformation");

    // ============ エラーケース: 一部データ型が異なる場合 ============
    const incompatibleDataItem = {
      item_id: "sales_apocount_001",
      item_name: "アポ件数",
      unit: "件",
      data_type: "string", // 仕様では integer, 実際は string
      calculation_logic: "COUNT(appointment_records WHERE status='confirmed')",
      report_mapping: "monthly_summary.appointments_count",
    };

    const incompatibilityValidation = validateSalesDataCompatibility({
      incomingDataItem: incompatibleDataItem,
      specificationMetadata: integrationSpecificationMetadata,
    });

    // 互換性なしと判定
    expect(incompatibilityValidation.is_compatible).toBe(false);
    // 変換ルール必要と判定
    expect(incompatibilityValidation.transformation_rule_required).toBe(true);
    // 差分内容を確認
    expect(incompatibilityValidation.differences.length).toBeGreaterThan(0);
    expect(incompatibilityValidation.differences[0]).toMatchObject({
      field: "data_type",
      expected: "integer",
      actual: "string",
    });
    // データ処理フロー判定: 変換処理が必要
    expect(incompatibilityValidation.processing_flow).toBe(
      "apply_transformation"
    );

    // ============ エラーケース: 計算ロジックが異なる場合 ============
    const differentCalculationItem = {
      item_id: "sales_apocount_001",
      item_name: "アポ件数",
      unit: "件",
      data_type: "integer",
      calculation_logic:
        "COUNT(appointment_records WHERE status='completed')", // 仕様と異なる
      report_mapping: "monthly_summary.appointments_count",
    };

    const calculationDiffValidation = validateSalesDataCompatibility({
      incomingDataItem: differentCalculationItem,
      specificationMetadata: integrationSpecificationMetadata,
    });

    expect(calculationDiffValidation.is_compatible).toBe(false);
    expect(calculationDiffValidation.transformation_rule_required).toBe(true);
    expect(calculationDiffValidation.differences.length).toBeGreaterThan(0);

    // ============ 境界値検証: 項目定義が部分的に欠落している場合 ============
    const partialDataItem = {
      item_id: "sales_apocount_001",
      item_name: "アポ件数",
      unit: "件",
      // data_type と calculation_logic と report_mapping が欠落
    };

    const partialValidation = validateSalesDataCompatibility({
      incomingDataItem: partialDataItem,
      specificationMetadata: integrationSpecificationMetadata,
    });

    expect(partialValidation.is_compatible).toBe(false);
    expect(partialValidation.transformation_rule_required).toBe(true);

    // ============ エラーケース: item_id が異なる場合（最も重大な不整合） ============
    expect(() => {
      validateSalesDataCompatibility({
        incomingDataItem: {
          item_id: "sales_revenue_002", // 仕様と異なる
          item_name: "アポ件数",
          unit: "件",
          data_type: "integer",
          calculation_logic:
            "COUNT(appointment_records WHERE status='confirmed')",
          report_mapping: "monthly_summary.appointments_count",
        },
        specificationMetadata: integrationSpecificationMetadata,
      });
    }).toThrow(/item_id/);

    // ============ 確認: 連携仕様が null の場合 ============
    expect(() => {
      validateSalesDataCompatibility({
        incomingDataItem: salesSystemDataItem,
        specificationMetadata: null,
      });
    }).toThrow(/仕様書/);
  });
});