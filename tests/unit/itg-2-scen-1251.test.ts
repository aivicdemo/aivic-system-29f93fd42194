import { describe, it, expect, beforeEach, afterEach } from "@jest/globals";
import {
  aggregateQualityMetricsByAssessor,
  reflectMetricsToManagementDashboard,
} from "../../src/logic/it-6-2-1-1";

describe("査定担当者別・工種別・金額帯別の判定精度指標の自動集計と可視化", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("SCEN-1251: 改善対策実行状況と効果測定データの経営ダッシュボード反映機能 - 改善対策実行完了後、精度改善度・処理時間短縮率・品質均一化指標が経営ダッシュボードにリアルタイム反映される", () => {
    // Arrange: 改善対策実行前後の基準データと実績データを準備
    const improvement_measure_id = "IMP-20240115-001";
    const baseline_ocr_accuracy = 0.87;
    const baseline_judgement_accuracy = 0.82;
    const baseline_average_processing_time_minutes = 18.5;
    const baseline_quality_uniformity_index = 0.74;

    const post_improvement_ocr_accuracy = 0.93;
    const post_improvement_judgement_accuracy = 0.89;
    const post_improvement_average_processing_time_minutes = 14.2;
    const post_improvement_quality_uniformity_index = 0.88;

    const assessor_metrics = {
      assessor_id: "ASR-2024-001",
      assessor_name: "田中太郎",
      construction_type: "鉄骨造",
      amount_band: "5000万以上",
      baseline_metrics: {
        ocr_accuracy: baseline_ocr_accuracy,
        judgement_accuracy: baseline_judgement_accuracy,
        average_processing_time_minutes: baseline_average_processing_time_minutes,
        quality_uniformity_index: baseline_quality_uniformity_index,
        measurement_datetime: "2024-01-08T09:00:00Z",
      },
      post_improvement_metrics: {
        ocr_accuracy: post_improvement_ocr_accuracy,
        judgement_accuracy: post_improvement_judgement_accuracy,
        average_processing_time_minutes:
          post_improvement_average_processing_time_minutes,
        quality_uniformity_index: post_improvement_quality_uniformity_index,
        measurement_datetime: "2024-01-15T11:00:00Z",
      },
    };

    // Act: 査定担当者別・工種別・金額帯別の判定精度指標を自動集計
    const aggregated_metrics = aggregateQualityMetricsByAssessor(
      assessor_metrics
    );

    // Assert: 集計結果の構造と計算式の検証
    expect(aggregated_metrics).toBeDefined();
    expect(aggregated_metrics.assessor_id).toBe("ASR-2024-001");
    expect(aggregated_metrics.assessor_name).toBe("田中太郎");
    expect(aggregated_metrics.construction_type).toBe("鉄骨造");
    expect(aggregated_metrics.amount_band).toBe("5000万以上");

    // 精度改善度の計算: (改善後 - 改善前) / 改善前 × 100
    const expected_ocr_accuracy_improvement_rate =
      ((post_improvement_ocr_accuracy - baseline_ocr_accuracy) /
        baseline_ocr_accuracy) *
      100;
    expect(aggregated_metrics.ocr_accuracy_improvement_rate).toBeCloseTo(
      expected_ocr_accuracy_improvement_rate,
      2
    );

    const expected_judgement_accuracy_improvement_rate =
      ((post_improvement_judgement_accuracy - baseline_judgement_accuracy) /
        baseline_judgement_accuracy) *
      100;
    expect(aggregated_metrics.judgement_accuracy_improvement_rate).toBeCloseTo(
      expected_judgement_accuracy_improvement_rate,
      2
    );

    // 処理時間短縮率の計算: (改善前 - 改善後) / 改善前 × 100
    const expected_processing_time_reduction_rate =
      ((baseline_average_processing_time_minutes -
        post_improvement_average_processing_time_minutes) /
        baseline_average_processing_time_minutes) *
      100;
    expect(aggregated_metrics.processing_time_reduction_rate).toBeCloseTo(
      expected_processing_time_reduction_rate,
      2
    );

    // 品質均一化指標: 改善後の品質均一化指数
    expect(aggregated_metrics.quality_uniformity_index_post).toBe(
      post_improvement_quality_uniformity_index
    );

    // Act: 効果測定データを経営ダッシュボードにリアルタイム反映
    const dashboard_update_payload = {
      improvement_measure_id: improvement_measure_id,
      aggregated_metrics: aggregated_metrics,
      reflection_datetime: "2024-01-15T11:00:00Z",
    };

    const dashboard_reflection_result =
      reflectMetricsToManagementDashboard(dashboard_update_payload);

    // Assert: ダッシュボード反映結果の検証
    expect(dashboard_reflection_result).toBeDefined();
    expect(dashboard_reflection_result.status).toBe("success");
    expect(dashboard_reflection_result.improvement_measure_id).toBe(
      improvement_measure_id
    );

    // リアルタイム反映状態の確認
    expect(dashboard_reflection_result.reflected_metrics).toEqual({
      ocr_accuracy_improvement_rate: expect.any(Number),
      judgement_accuracy_improvement_rate: expect.any(Number),
      processing_time_reduction_rate: expect.any(Number),
      quality_uniformity_index_post: post_improvement_quality_uniformity_index,
    });

    // リアルタイムデータの有効性確認（キャッシュ更新タイムスタンプが反映時刻以降）
    const reflection_datetime = new Date("2024-01-15T11:00:00Z").getTime();
    const cache_updated_at = new Date(
      dashboard_reflection_result.cache_updated_at
    ).getTime();
    expect(cache_updated_at).toBeGreaterThanOrEqual(reflection_datetime);

    // 精度改善度がダッシュボードに正確に反映されているか検証
    expect(dashboard_reflection_result.reflected_metrics.ocr_accuracy_improvement_rate).toBeCloseTo(
      expected_ocr_accuracy_improvement_rate,
      2
    );

    // 処理時間短縮率がダッシュボードに正確に反映されているか検証
    expect(dashboard_reflection_result.reflected_metrics.processing_time_reduction_rate).toBeCloseTo(
      expected_processing_time_reduction_rate,
      2
    );

    // 品質均一化指標がダッシュボードに正確に反映されているか検証
    expect(dashboard_reflection_result.reflected_metrics.quality_uniformity_index_post).toBe(
      post_improvement_quality_uniformity_index
    );

    // WebSocket/ポーリングによるリアルタイム同期の確認
    expect(dashboard_reflection_result.sync_method).toMatch(
      /websocket|polling/i
    );
    expect(dashboard_reflection_result.is_realtime_reflected).toBe(true);

    // ページ更新なしでリアルタイムデータが最新状態であることを確認
    expect(dashboard_reflection_result.requires_page_refresh).toBe(false);
  });
});