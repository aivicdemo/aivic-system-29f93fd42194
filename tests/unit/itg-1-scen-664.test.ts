import { describe, test, expect, beforeEach } from "@jest/globals";
import { computeMetadataFields } from "../../src/logic/it-1781935279444-1-1-1";

describe("営業データ項目メタデータ一元管理機能", () => {
  // SCEN-664: [error] 営業データ項目メタデータ一元管理機能 - 計算ロジックが未定義の項目は計算がスキップされる
  test("計算ロジック未定義の項目は計算がスキップされ、ログに記録される", () => {
    // Arrange: 計算ロジックが未定義の営業データ項目メタデータを準備
    const metadata_items = [
      {
        item_id: "META_001",
        item_name: "月間アポ数",
        data_type: "INTEGER",
        unit: "件",
        is_required: true,
        calculation_logic: "SUM(daily_appointments)",
        report_mapping: "report_kpi_001",
        status: "ACTIVE",
      },
      {
        item_id: "META_002",
        item_name: "顧客反応スコア",
        data_type: "DECIMAL",
        unit: "点",
        is_required: false,
        calculation_logic: null, // 計算ロジック未定義
        report_mapping: "report_kpi_002",
        status: "ACTIVE",
      },
      {
        item_id: "META_003",
        item_name: "成約率",
        data_type: "DECIMAL",
        unit: "%",
        is_required: true,
        calculation_logic: "(成約数 / アポ数) * 100",
        report_mapping: "report_kpi_003",
        status: "ACTIVE",
      },
    ];

    const source_data = {
      daily_appointments: [5, 3, 7, 4, 6],
      deals_count: 12,
      appointment_count: 30,
      customer_feedback: 45,
    };

    // Act: 計算ロジックが未定義の項目を含めて計算処理を実行
    const result = computeMetadataFields({
      metadata_items: metadata_items,
      source_data: source_data,
    });

    // Assert: 計算結果の検証
    // META_001: 計算ロジック定義あり → 合計 25 件（5+3+7+4+6）
    expect(result.computed_values).toEqual(
      expect.objectContaining({
        META_001: 25,
      })
    );

    // META_002: 計算ロジック未定義 → 計算スキップ、値なし
    expect(result.computed_values).toEqual(
      expect.objectContaining({
        META_002: undefined,
      })
    );

    // META_003: 計算ロジック定義あり → 成約率 40%（12/30*100）
    expect(result.computed_values).toEqual(
      expect.objectContaining({
        META_003: 40,
      })
    );

    // ログにスキップ通知が記録されていることを確認
    expect(result.execution_logs).toContainEqual(
      expect.objectContaining({
        item_id: "META_002",
        status: "SKIPPED",
        message: expect.stringMatching(/計算ロジック/),
      })
    );

    // 計算対象外の項目ステータスが正しく標識されていることを確認
    expect(result.item_status_mapping).toEqual(
      expect.objectContaining({
        META_001: "CALCULATED",
        META_002: "EXCLUDED",
        META_003: "CALCULATED",
      })
    );

    // 全体の処理ステータスが正常完了であることを確認
    expect(result.overall_status).toBe("COMPLETED");

    // エラーが発生していないことを確認
    expect(result.errors).toHaveLength(0);
  });
});