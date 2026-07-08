import { describe, test, expect, beforeEach } from "@jest/globals";
import {
  calculateAccuracyImprovementDegree,
} from "../../src/logic/it-6-2-1-1";

describe("モデル更新前後精度計測・比較機能", () => {
  test("SCEN-1117: 精度改善度を数値とグラフで可視化し運用者に提示できる", () => {
    // モデル更新前の精度メトリクス
    const baseline_ocr_accuracy = 92.5;
    const baseline_ai_judgment_accuracy = 88.3;
    const baseline_processing_time_seconds = 240;

    // モデル更新後の精度メトリクス
    const updated_ocr_accuracy = 95.8;
    const updated_ai_judgment_accuracy = 91.7;
    const updated_processing_time_seconds = 198;

    // 精度改善度の計算結果を取得
    const result = calculateAccuracyImprovementDegree({
      baseline_ocr_accuracy,
      baseline_ai_judgment_accuracy,
      baseline_processing_time_seconds,
      updated_ocr_accuracy,
      updated_ai_judgment_accuracy,
      updated_processing_time_seconds,
    });

    // OCR精度改善度の検証（期待値：(95.8 - 92.5) / 92.5 * 100 = 3.564...% ≈ 3.56%）
    expect(result.ocr_accuracy_improvement_percentage).toBeCloseTo(3.56, 1);
    expect(result.ocr_accuracy_improvement_percentage).toBe(3.56);

    // AI判定精度改善度の検証（期待値：(91.7 - 88.3) / 88.3 * 100 = 3.848...% ≈ 3.85%）
    expect(result.ai_judgment_accuracy_improvement_percentage).toBeCloseTo(
      3.85,
      1
    );
    expect(result.ai_judgment_accuracy_improvement_percentage).toBe(3.85);

    // 処理時間短縮率の検証（期待値：(240 - 198) / 240 * 100 = 17.5%）
    expect(result.processing_time_reduction_percentage).toBe(17.5);

    // OCR精度絶対値改善度の検証（期待値：95.8 - 92.5 = 3.3）
    expect(result.ocr_accuracy_absolute_improvement).toBe(3.3);

    // AI判定精度絶対値改善度の検証（期待値：91.7 - 88.3 = 3.4）
    expect(result.ai_judgment_accuracy_absolute_improvement).toBe(3.4);

    // 処理時間短縮量の検証（期待値：240 - 198 = 42秒）
    expect(result.processing_time_reduction_seconds).toBe(42);

    // グラフ化可能なデータセット構造の検証
    expect(result.graph_data).toBeDefined();
    expect(Array.isArray(result.graph_data.metrics)).toBe(true);
    expect(result.graph_data.metrics.length).toBe(3);

    // グラフデータポイントの検証
    const ocr_metric = result.graph_data.metrics[0];
    expect(ocr_metric.metric_name).toBe("OCR読取精度");
    expect(ocr_metric.baseline_value).toBe(92.5);
    expect(ocr_metric.updated_value).toBe(95.8);
    expect(ocr_metric.improvement_percentage).toBe(3.56);
    expect(ocr_metric.unit).toBe("%");

    const ai_metric = result.graph_data.metrics[1];
    expect(ai_metric.metric_name).toBe("AI判定精度");
    expect(ai_metric.baseline_value).toBe(88.3);
    expect(ai_metric.updated_value).toBe(91.7);
    expect(ai_metric.improvement_percentage).toBe(3.85);
    expect(ai_metric.unit).toBe("%");

    const processing_metric = result.graph_data.metrics[2];
    expect(processing_metric.metric_name).toBe("処理時間");
    expect(processing_metric.baseline_value).toBe(240);
    expect(processing_metric.updated_value).toBe(198);
    expect(processing_metric.improvement_percentage).toBe(17.5);
    expect(processing_metric.unit).toBe("秒");

    // グラフタイプの検証
    expect(result.graph_data.graph_types).toBeDefined();
    expect(result.graph_data.graph_types).toContain("line_chart");
    expect(result.graph_data.graph_types).toContain("bar_chart");

    // グラフレンダリング用メタデータの検証
    expect(result.graph_data.title).toBe("モデル更新前後の精度改善度");
    expect(result.graph_data.x_axis_label).toBe("精度指標");
    expect(result.graph_data.y_axis_label).toBe("改善度（%）");
    expect(result.graph_data.legend).toBeDefined();
    expect(result.graph_data.legend).toContain("更新前");
    expect(result.graph_data.legend).toContain("更新後");

    // エクスポート可能なデータ形式の検証
    expect(result.exportable_formats).toBeDefined();
    expect(Array.isArray(result.exportable_formats)).toBe(true);
    expect(result.exportable_formats).toContain("csv");
    expect(result.exportable_formats).toContain("json");
    expect(result.exportable_formats).toContain("excel");
    expect(result.exportable_formats).toContain("pdf");

    // CSVエクスポート形式の検証
    expect(result.export_data.csv).toBeDefined();
    expect(typeof result.export_data.csv).toBe("string");
    expect(result.export_data.csv).toContain("OCR読取精度");
    expect(result.export_data.csv).toContain("92.5");
    expect(result.export_data.csv).toContain("95.8");
    expect(result.export_data.csv).toContain("3.56");

    // JSONエクスポート形式の検証
    expect(result.export_data.json).toBeDefined();
    expect(typeof result.export_data.json).toBe("string");
    const json_parsed = JSON.parse(result.export_data.json);
    expect(json_parsed.ocr_baseline).toBe(92.5);
    expect(json_parsed.ocr_updated).toBe(95.8);

    // 総合的な改善判定の検証
    expect(result.overall_improvement_status).toBe("improved");
    expect(result.all_metrics_improved).toBe(true);

    // 改善度レベル判定の検証（改善度3%～5%は「中程度改善」）
    expect(result.improvement_level).toBe("medium");

    // タイムスタンプ情報の検証
    expect(result.measurement_timestamp).toBeDefined();
    expect(typeof result.measurement_timestamp).toBe("string");

    // 結果オブジェクトの完全性検証
    expect(result).toHaveProperty("ocr_accuracy_improvement_percentage");
    expect(result).toHaveProperty("ai_judgment_accuracy_improvement_percentage");
    expect(result).toHaveProperty("processing_time_reduction_percentage");
    expect(result).toHaveProperty("ocr_accuracy_absolute_improvement");
    expect(result).toHaveProperty("ai_judgment_accuracy_absolute_improvement");
    expect(result).toHaveProperty("processing_time_reduction_seconds");
    expect(result).toHaveProperty("graph_data");
    expect(result).toHaveProperty("exportable_formats");
    expect(result).toHaveProperty("export_data");
  });

  test("SCEN-1117-variant: 精度が低下する場合の改善度計算", () => {
    // 精度低下シナリオ
    const baseline_ocr_accuracy = 95.0;
    const baseline_ai_judgment_accuracy = 90.0;
    const baseline_processing_time_seconds = 200;

    const updated_ocr_accuracy = 93.5;
    const updated_ai_judgment_accuracy = 88.5;
    const updated_processing_time_seconds = 220;

    const result = calculateAccuracyImprovementDegree({
      baseline_ocr_accuracy,
      baseline_ai_judgment_accuracy,
      baseline_processing_time_seconds,
      updated_ocr_accuracy,
      updated_ai_judgment_accuracy,
      updated_processing_time_seconds,
    });

    // OCR精度低下の検証（期待値：(93.5 - 95.0) / 95.0 * 100 = -1.578...% ≈ -1.58%）
    expect(result.ocr_accuracy_improvement_percentage).toBe(-1.58);

    // AI判定精度低下の検証（期待値：(88.5 - 90.0) / 90.0 * 100 = -1.666...% ≈ -1.67%）
    expect(result.ai_judgment_accuracy_improvement_percentage).toBe(-1.67);

    // 処理時間悪化の検証（期待値：(200 - 220) / 200 * 100 = -10%）
    expect(result.processing_time_reduction_percentage).toBe(-10);

    // 全体的な改善判定が「低下」であることの検証
    expect(result.overall_improvement_status).toBe("degraded");
    expect(result.all_metrics_improved).toBe(false);

    // 改善度レベルが「悪化」であることの検証
    expect(result.improvement_level).toBe("degraded");
  });

  test("SCEN-1117-boundary: 精度が横ばいの場合の改善度計算", () => {
    // 精度横ばいシナリオ
    const baseline_ocr_accuracy = 90.0;
    const baseline_ai_judgment_accuracy = 85.0;
    const baseline_processing_time_seconds = 250;

    const updated_ocr_accuracy = 90.0;
    const updated_ai_judgment_accuracy = 85.0;
    const updated_processing_time_seconds = 250;

    const result = calculateAccuracyImprovementDegree({
      baseline_ocr_accuracy,
      baseline_ai_judgment_accuracy,
      baseline_processing_time_seconds,
      updated_ocr_accuracy,
      updated_ai_judgment_accuracy,
      updated_processing_time_seconds,
    });

    // すべての改善度がゼロであることの検証
    expect(result.ocr_accuracy_improvement_percentage).toBe(0);
    expect(result.ai_judgment_accuracy_improvement_percentage).toBe(0);
    expect(result.processing_time_reduction_percentage).toBe(0);

    // 全体的な改善判定が「横ばい」であることの検証
    expect(result.overall_improvement_status).toBe("no_change");
    expect(result.all_metrics_improved).toBe(false);

    // 改善度レベルが「無改善」であることの検証
    expect(result.improvement_level).toBe("no_improvement");
  });

  test("SCEN-1117-error: 不正な精度値入力時のエラーハンドリング", () => {
    // ベースライン精度が100%を超える不正値
    expect(() =>
      calculateAccuracyImprovementDegree({
        baseline_ocr_accuracy: 105.0,
        baseline_ai_judgment_accuracy: 85.0,
        baseline_processing_time_seconds: 250,
        updated_ocr_accuracy: 90.0,
        updated_ai_judgment_accuracy: 85.0,
        updated_processing_time_seconds: 250,
      })
    ).toThrow(/精度/);

    // 更新後精度がマイナス値
    expect(() =>
      calculateAccuracyImprovementDegree({
        baseline_ocr_accuracy: 90.0,
        baseline_ai_judgment_accuracy: 85.0,
        baseline_processing_time_seconds: 250,
        updated_ocr_accuracy: -5.0,
        updated_ai_judgment_accuracy: 85.0,
        updated_processing_time_seconds: 250,
      })
    ).toThrow(/精度/);

    // 処理時間が0秒以下
    expect(() =>
      calculateAccuracyImprovementDegree({
        baseline_ocr_accuracy: 90.0,
        baseline_ai_judgment_accuracy: 85.0,
        baseline_processing_time_seconds: 0,
        updated_ocr_accuracy: 90.0,
        updated_ai_judgment_accuracy: 85.0,
        updated_processing_time_seconds: 250,
      })
    ).toThrow(/処理時間/);
  });
});