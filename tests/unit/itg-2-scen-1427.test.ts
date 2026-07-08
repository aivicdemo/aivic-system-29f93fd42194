import { determineProductionApplicability } from "../../src/logic/it-6-2-2-1";

describe("本番環境適用可否判定機能", () => {
  // SCEN-1427
  test("修正内容が検証項目の一部で不合格の場合に差し戻しと判定される", () => {
    const modification_data = {
      modification_id: "MOD-2024-001",
      applied_date: "2024-01-15T10:30:00Z",
      modified_items: [
        {
          item_id: "ITEM-001",
          field_name: "OCR_read_accuracy",
          previous_value: "82.5",
          updated_value: "85.0",
          modification_reason: "学習データ追加によるOCR精度向上"
        },
        {
          item_id: "ITEM-002",
          field_name: "AI_judgment_accuracy",
          previous_value: "78.3",
          updated_value: "79.5",
          modification_reason: "モデル再学習による判定精度改善"
        },
        {
          item_id: "ITEM-003",
          field_name: "processing_time_seconds",
          previous_value: "45",
          updated_value: "42",
          modification_reason: "パラメータ調整による処理時間短縮"
        }
      ]
    };

    const validation_items = [
      {
        validation_id: "VAL-001",
        validation_name: "OCR読取精度基準",
        target_threshold: 85.0,
        acceptable_range: { min: 84.0, max: 100.0 },
        critical_flag: true
      },
      {
        validation_id: "VAL-002",
        validation_name: "AI判定精度基準",
        target_threshold: 80.0,
        acceptable_range: { min: 78.0, max: 100.0 },
        critical_flag: true
      },
      {
        validation_id: "VAL-003",
        validation_name: "処理時間短縮率",
        target_threshold: 10,
        acceptable_range: { min: 5, max: 100 },
        critical_flag: false
      },
      {
        validation_id: "VAL-004",
        validation_name: "品質均一化指標",
        target_threshold: 90.0,
        acceptable_range: { min: 85.0, max: 100.0 },
        critical_flag: true
      }
    ];

    const validation_results = [
      {
        validation_id: "VAL-001",
        validation_name: "OCR読取精度基準",
        expected_value: 85.0,
        actual_value: 85.0,
        status: "PASS",
        remarks: "基準値と一致"
      },
      {
        validation_id: "VAL-002",
        validation_name: "AI判定精度基準",
        expected_value: 80.0,
        actual_value: 79.5,
        status: "FAIL",
        remarks: "基準値未達：期待値80.0に対して実績79.5"
      },
      {
        validation_id: "VAL-003",
        validation_name: "処理時間短縮率",
        expected_value: 10,
        actual_value: 6.67,
        status: "PASS",
        remarks: "短縮率6.67%で許容範囲内"
      },
      {
        validation_id: "VAL-004",
        validation_name: "品質均一化指標",
        expected_value: 90.0,
        actual_value: 87.5,
        status: "FAIL",
        remarks: "品質均一化指標87.5%で基準未達"
      }
    ];

    const result = determineProductionApplicability({
      modification_data: modification_data,
      validation_items: validation_items,
      validation_results: validation_results
    });

    expect(result.applicability_decision).toBe("差し戻し");
    expect(result.status).toBe("NG");
    expect(result.failed_validations).toHaveLength(2);
    expect(result.failed_validations[0].validation_id).toBe("VAL-002");
    expect(result.failed_validations[0].validation_name).toBe("AI判定精度基準");
    expect(result.failed_validations[0].status).toBe("FAIL");
    expect(result.failed_validations[0].remarks).toBe("基準値未達：期待値80.0に対して実績79.5");
    expect(result.failed_validations[1].validation_id).toBe("VAL-004");
    expect(result.failed_validations[1].validation_name).toBe("品質均一化指標");
    expect(result.failed_validations[1].status).toBe("FAIL");
    expect(result.failed_validations[1].remarks).toBe("品質均一化指標87.5%で基準未達");
    expect(result.pass_count).toBe(2);
    expect(result.fail_count).toBe(2);
    expect(result.can_apply_to_production).toBe(false);
    expect(result.detailed_reason).toContain("AI判定精度基準");
    expect(result.detailed_reason).toContain("品質均一化指標");
  });
});