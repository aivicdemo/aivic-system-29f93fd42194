import { describe, test, expect, beforeEach } from "@jest/globals";
import { generateImprovementResultReport } from "../../src/logic/it-6-2-1-1";

describe("査定担当者別・工種別・金額帯別の判定精度指標の自動集計と可視化", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-1238: [normal] 改善結果レポートの自動生成
  test("改善結果レポートがJSON形式で生成される", () => {
    // Arrange: テスト入力パラメータ
    const input = {
      period_start: "2024-01-01",
      period_end: "2024-01-31",
      target_department: "査定部門A",
      report_type: "improvement_results"
    };

    // Act: レポート生成関数を実行
    const report = generateImprovementResultReport(input);

    // Assert: レポートがオブジェクト型であることを確認
    expect(typeof report).toBe("object");
    expect(report).not.toBeNull();

    // Assert: JSON形式の必須フィールドが存在することを確認
    expect(report).toHaveProperty("improvement_items");
    expect(report).toHaveProperty("execution_datetime");
    expect(report).toHaveProperty("improvement_content");
    expect(report).toHaveProperty("achievements");
    expect(report).toHaveProperty("report_metadata");

    // Assert: improvement_items は配列型
    expect(Array.isArray(report.improvement_items)).toBe(true);

    // Assert: improvement_items の構造を確認
    if (report.improvement_items.length > 0) {
      const item = report.improvement_items[0];
      expect(item).toHaveProperty("item_id");
      expect(item).toHaveProperty("category");
      expect(item).toHaveProperty("description");
      expect(item).toHaveProperty("priority");
    }

    // Assert: execution_datetimeはISO 8601形式の文字列
    expect(typeof report.execution_datetime).toBe("string");
    expect(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z?$/.test(report.execution_datetime)).toBe(true);

    // Assert: improvement_contentはオブジェクト型
    expect(typeof report.improvement_content).toBe("object");
    expect(report.improvement_content).not.toBeNull();
    expect(report.improvement_content).toHaveProperty("learning_data_update");
    expect(report.improvement_content).toHaveProperty("model_retraining");
    expect(report.improvement_content).toHaveProperty("parameter_adjustment");

    // Assert: achievementsは数値メトリクスを含むオブジェクト型
    expect(typeof report.achievements).toBe("object");
    expect(report.achievements).not.toBeNull();
    expect(report.achievements).toHaveProperty("ocr_accuracy_improvement_rate");
    expect(report.achievements).toHaveProperty("judgment_accuracy_improvement_rate");
    expect(report.achievements).toHaveProperty("processing_time_reduction_rate");
    expect(report.achievements).toHaveProperty("quality_uniformity_index");

    // Assert: 改善率は0～100の数値
    expect(typeof report.achievements.ocr_accuracy_improvement_rate).toBe("number");
    expect(report.achievements.ocr_accuracy_improvement_rate).toBeGreaterThanOrEqual(0);
    expect(report.achievements.ocr_accuracy_improvement_rate).toBeLessThanOrEqual(100);

    expect(typeof report.achievements.judgment_accuracy_improvement_rate).toBe("number");
    expect(report.achievements.judgment_accuracy_improvement_rate).toBeGreaterThanOrEqual(0);
    expect(report.achievements.judgment_accuracy_improvement_rate).toBeLessThanOrEqual(100);

    expect(typeof report.achievements.processing_time_reduction_rate).toBe("number");
    expect(report.achievements.processing_time_reduction_rate).toBeGreaterThanOrEqual(0);
    expect(report.achievements.processing_time_reduction_rate).toBeLessThanOrEqual(100);

    expect(typeof report.achievements.quality_uniformity_index).toBe("number");
    expect(report.achievements.quality_uniformity_index).toBeGreaterThanOrEqual(0);
    expect(report.achievements.quality_uniformity_index).toBeLessThanOrEqual(100);

    // Assert: report_metadataはレポート情報を含むオブジェクト型
    expect(typeof report.report_metadata).toBe("object");
    expect(report.report_metadata).not.toBeNull();
    expect(report.report_metadata).toHaveProperty("report_id");
    expect(report.report_metadata).toHaveProperty("period_start");
    expect(report.report_metadata).toHaveProperty("period_end");
    expect(report.report_metadata).toHaveProperty("target_department");
    expect(report.report_metadata).toHaveProperty("generated_at");
    expect(report.report_metadata).toHaveProperty("status");

    // Assert: metadataの値が正確であることを確認
    expect(report.report_metadata.period_start).toBe("2024-01-01");
    expect(report.report_metadata.period_end).toBe("2024-01-31");
    expect(report.report_metadata.target_department).toBe("査定部門A");
    expect(typeof report.report_metadata.report_id).toBe("string");
    expect(report.report_metadata.report_id.length).toBeGreaterThan(0);

    // Assert: generated_atはISO 8601形式の文字列
    expect(typeof report.report_metadata.generated_at).toBe("string");
    expect(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z?$/.test(report.report_metadata.generated_at)).toBe(true);

    // Assert: statusはvalid statusのいずれか
    expect(["success", "partial", "pending"]).toContain(report.report_metadata.status);

    // Assert: JSON.stringifyで正しくシリアライズ可能（有効なJSON形式）
    const json_string = JSON.stringify(report);
    expect(typeof json_string).toBe("string");
    const parsed = JSON.parse(json_string);
    expect(parsed).toEqual(report);
  });
});