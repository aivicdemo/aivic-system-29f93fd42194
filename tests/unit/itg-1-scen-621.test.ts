import { describe, test, expect } from "@jest/globals";
import {
  updateSalesDataItemMetadata,
  calculateAmountByMetadata,
  generateReportByMetadata,
} from "../../src/logic/it-1781935279444-1-1-1";

describe("営業データ項目メタデータ管理機能", () => {
  // SCEN-621: [normal] 営業データ項目メタデータ管理 - メタデータ更新時の金額計算とレポート生成
  test("営業データ項目メタデータが更新された場合、新しい定義に基づいて金額計算とレポート生成が実行される", () => {
    // === 前提条件: 既存のメタデータ定義を記録 ===
    const originalMetadataItem = {
      item_id: "META-001",
      item_name: "商品単価",
      unit: "円",
      data_type: "number",
      calculation_formula: "price * quantity",
      report_mapping_key: "unit_price",
      version: 1,
      updated_at: new Date("2024-01-01T09:00:00Z"),
    };

    const originalQuantityMetadata = {
      item_id: "META-002",
      item_name: "数量",
      unit: "個",
      data_type: "number",
      calculation_formula: "quantity",
      report_mapping_key: "quantity",
      version: 1,
      updated_at: new Date("2024-01-01T09:00:00Z"),
    };

    const originalDiscountMetadata = {
      item_id: "META-003",
      item_name: "割引率",
      unit: "%",
      data_type: "number",
      calculation_formula: "(price * quantity) * (discount_rate / 100)",
      report_mapping_key: "discount_amount",
      version: 1,
      updated_at: new Date("2024-01-01T09:00:00Z"),
    };

    // === トリガー: メタデータ定義を更新 ===
    const updatedMetadataItem = {
      item_id: "META-001",
      item_name: "商品単価",
      unit: "円",
      data_type: "number",
      calculation_formula: "price * quantity * (1 - discount_rate / 100)",
      report_mapping_key: "unit_price_after_discount",
      version: 2,
      updated_at: new Date("2024-01-15T11:00:00Z"),
    };

    const updatedQuantityMetadata = {
      item_id: "META-002",
      item_name: "数量",
      unit: "個",
      data_type: "number",
      calculation_formula: "quantity",
      report_mapping_key: "quantity",
      version: 1,
      updated_at: new Date("2024-01-15T11:00:00Z"),
    };

    const updatedDiscountMetadata = {
      item_id: "META-003",
      item_name: "割引率",
      unit: "%",
      data_type: "number",
      calculation_formula: "discount_rate",
      report_mapping_key: "discount_rate_percent",
      version: 2,
      updated_at: new Date("2024-01-15T11:00:00Z"),
    };

    // メタデータを更新し、更新イベントが記録されることを確認
    const updateResult = updateSalesDataItemMetadata({
      metadata_items: [
        updatedMetadataItem,
        updatedQuantityMetadata,
        updatedDiscountMetadata,
      ],
      updated_by: "admin_user_001",
      updated_at: new Date("2024-01-15T11:00:00Z"),
    });

    expect(updateResult.success).toBe(true);
    expect(updateResult.metadata_version).toBe(2);
    expect(updateResult.items_updated).toBe(3);
    expect(updateResult.update_event_logged).toBe(true);
    expect(updateResult.event_timestamp).toEqual(
      new Date("2024-01-15T11:00:00Z")
    );

    // === 実行: 更新されたメタデータに基づいて金額計算を実行 ===
    const salesDataRecords = [
      {
        record_id: "REC-001",
        customer_id: "CUST-001",
        service_id: "SVC-001",
        price: 1000,
        quantity: 10,
        discount_rate: 10,
      },
      {
        record_id: "REC-002",
        customer_id: "CUST-002",
        service_id: "SVC-002",
        price: 2000,
        quantity: 5,
        discount_rate: 5,
      },
      {
        record_id: "REC-003",
        customer_id: "CUST-001",
        service_id: "SVC-003",
        price: 500,
        quantity: 20,
        discount_rate: 15,
      },
    ];

    const calculationResult = calculateAmountByMetadata({
      sales_data_records: salesDataRecords,
      metadata_items: [
        updatedMetadataItem,
        updatedQuantityMetadata,
        updatedDiscountMetadata,
      ],
      calculation_context: {
        metadata_version: 2,
        execution_date: new Date("2024-01-15T11:00:00Z"),
      },
    });

    // === 検証: 計算結果が新しいメタデータ定義に基づいているか確認 ===
    // REC-001: 1000 * 10 * (1 - 10/100) = 1000 * 10 * 0.9 = 9000
    expect(calculationResult.calculated_records).toHaveLength(3);
    expect(calculationResult.calculated_records[0].record_id).toBe("REC-001");
    expect(calculationResult.calculated_records[0].calculated_amount).toBe(9000);
    expect(calculationResult.calculated_records[0].unit_price_after_discount).toBe(
      9000
    );
    expect(calculationResult.calculated_records[0].discount_rate_percent).toBe(
      10
    );

    // REC-002: 2000 * 5 * (1 - 5/100) = 2000 * 5 * 0.95 = 9500
    expect(calculationResult.calculated_records[1].record_id).toBe("REC-002");
    expect(calculationResult.calculated_records[1].calculated_amount).toBe(9500);
    expect(calculationResult.calculated_records[1].unit_price_after_discount).toBe(
      9500
    );
    expect(calculationResult.calculated_records[1].discount_rate_percent).toBe(5);

    // REC-003: 500 * 20 * (1 - 15/100) = 500 * 20 * 0.85 = 8500
    expect(calculationResult.calculated_records[2].record_id).toBe("REC-003");
    expect(calculationResult.calculated_records[2].calculated_amount).toBe(8500);
    expect(calculationResult.calculated_records[2].unit_price_after_discount).toBe(
      8500
    );
    expect(calculationResult.calculated_records[2].discount_rate_percent).toBe(
      15
    );

    expect(calculationResult.metadata_applied_version).toBe(2);
    expect(calculationResult.calculation_success).toBe(true);
    expect(calculationResult.total_records_calculated).toBe(3);

    // === 実行: レポート生成機能を実行 ===
    const reportGenerationResult = generateReportByMetadata({
      calculated_data: calculationResult.calculated_records,
      metadata_items: [
        updatedMetadataItem,
        updatedQuantityMetadata,
        updatedDiscountMetadata,
      ],
      report_template: {
        template_id: "RPT-TEMPLATE-001",
        report_type: "monthly_sales_summary",
        include_fields: [
          "record_id",
          "customer_id",
          "unit_price_after_discount",
          "quantity",
          "discount_rate_percent",
          "calculated_amount",
        ],
      },
      report_execution_date: new Date("2024-01-15T11:00:00Z"),
    });

    // === 検証: レポート生成結果がメタデータ定義に基づいているか確認 ===
    expect(reportGenerationResult.report_generated).toBe(true);
    expect(reportGenerationResult.report_id).toBeDefined();
    expect(reportGenerationResult.metadata_version_applied).toBe(2);
    expect(reportGenerationResult.report_records).toHaveLength(3);

    // レポートの第1レコード検証 (REC-001)
    expect(reportGenerationResult.report_records[0]).toMatchObject({
      record_id: "REC-001",
      customer_id: "CUST-001",
      unit_price_after_discount: 9000,
      quantity: 10,
      discount_rate_percent: 10,
      calculated_amount: 9000,
    });

    // レポートの第2レコード検証 (REC-002)
    expect(reportGenerationResult.report_records[1]).toMatchObject({
      record_id: "REC-002",
      customer_id: "CUST-002",
      unit_price_after_discount: 9500,
      quantity: 5,
      discount_rate_percent: 5,
      calculated_amount: 9500,
    });

    // レポートの第3レコード検証 (REC-003)
    expect(reportGenerationResult.report_records[2]).toMatchObject({
      record_id: "REC-003",
      customer_id: "CUST-001",
      unit_price_after_discount: 8500,
      quantity: 20,
      discount_rate_percent: 15,
      calculated_amount: 8500,
    });

    // === 検証: 集計値が新しい定義に基づいているか確認 ===
    // 総額 = 9000 + 9500 + 8500 = 27000
    expect(reportGenerationResult.report_summary).toMatchObject({
      total_amount: 27000,
      total_records: 3,
      average_discount_rate: 10,
    });

    // === 検証: データの一貫性を確認 ===
    const salesDataLookup = new Map(
      salesDataRecords.map((r) => [r.record_id, r])
    );

    for (const reportRecord of reportGenerationResult.report_records) {
      const sourceData = salesDataLookup.get(reportRecord.record_id);
      expect(sourceData).toBeDefined();

      // 計算ロジックの検証: price * quantity * (1 - discount_rate / 100)
      const expectedAmount =
        (sourceData?.price || 0) *
        (sourceData?.quantity || 0) *
        (1 - ((sourceData?.discount_rate || 0) / 100));
      expect(reportRecord.calculated_amount).toBe(expectedAmount);
      expect(reportRecord.unit_price_after_discount).toBe(expectedAmount);
      expect(reportRecord.discount_rate_percent).toBe(
        sourceData?.discount_rate
      );
    }

    // === 検証: メタデータ更新のトレーサビリティがログに記録されているか確認 ===
    expect(updateResult.metadata_audit_trail).toBeDefined();
    expect(updateResult.metadata_audit_trail?.length).toBeGreaterThanOrEqual(1);

    if (updateResult.metadata_audit_trail) {
      const auditLog = updateResult.metadata_audit_trail[0];
      expect(auditLog.action_type).toBe("METADATA_UPDATE");
      expect(auditLog.updated_by).toBe("admin_user_001");
      expect(auditLog.previous_version).toBe(1);
      expect(auditLog.new_version).toBe(2);
      expect(auditLog.timestamp).toEqual(new Date("2024-01-15T11:00:00Z"));
    }

    expect(reportGenerationResult.report_generation_log).toBeDefined();
    if (reportGenerationResult.report_generation_log) {
      expect(reportGenerationResult.report_generation_log.metadata_version).toBe(
        2
      );
      expect(reportGenerationResult.report_generation_log.generation_timestamp).toEqual(
        new Date("2024-01-15T11:00:00Z")
      );
    }
  });
});