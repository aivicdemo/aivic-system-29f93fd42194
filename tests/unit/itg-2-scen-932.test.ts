import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { recordPriceBookVersionChange } from '../../src/logic/it-6-3-1';

describe('判定基準・学習データ版管理機能 - 物価本新版精度計測・比較', () => {
  // SCEN-932
  test('物価本新版公開時に変更前後のシステム精度が自動計測され比較可能になる', () => {
    // Arrange: 物価本新版切り替え前のベースライン精度データ
    const old_version_metrics = {
      version: 'PriceBook_v2024_01',
      measurement_datetime: new Date('2024-01-15T09:00:00Z'),
      accuracy: 0.945,
      precision: 0.952,
      recall: 0.938,
      f1_score: 0.945,
      total_samples: 2400,
      misclassified_count: 132
    };

    // 物価本新版への切り替え予約設定
    const version_change_plan = {
      old_version: 'PriceBook_v2024_01',
      new_version: 'PriceBook_v2024_Q2',
      scheduled_switch_datetime: new Date('2024-04-01T00:00:00Z'),
      learning_data_update_count: 847,
      affected_categories: 23
    };

    // 物価本新版が適用された後の精度計測結果
    const new_version_metrics = {
      version: 'PriceBook_v2024_Q2',
      measurement_datetime: new Date('2024-04-01T02:30:00Z'),
      accuracy: 0.952,
      precision: 0.958,
      recall: 0.946,
      f1_score: 0.952,
      total_samples: 2400,
      misclassified_count: 115
    };

    // 変更前後の精度差分を計算
    const accuracy_improvement_rate = ((new_version_metrics.accuracy - old_version_metrics.accuracy) / old_version_metrics.accuracy) * 100;
    const precision_improvement_rate = ((new_version_metrics.precision - old_version_metrics.precision) / old_version_metrics.precision) * 100;
    const recall_improvement_rate = ((new_version_metrics.recall - old_version_metrics.recall) / old_version_metrics.recall) * 100;
    const f1_improvement_rate = ((new_version_metrics.f1_score - old_version_metrics.f1_score) / old_version_metrics.f1_score) * 100;

    // Act: 판정 기준·학습 데이터 버전 변경 기록
    const result = recordPriceBookVersionChange({
      old_version: old_version_metrics,
      new_version: new_version_metrics,
      switch_plan: version_change_plan
    });

    // Assert: 변경 전후 정확도 지표가 정확히 계산되고 기록됨
    expect(result.accuracy_change).toBe(0.007);
    expect(result.accuracy_change_percentage).toBeCloseTo(0.7408, 2);
    
    expect(result.precision_change).toBe(0.006);
    expect(result.precision_change_percentage).toBeCloseTo(0.6302, 2);
    
    expect(result.recall_change).toBe(0.008);
    expect(result.recall_change_percentage).toBeCloseTo(0.8529, 2);
    
    expect(result.f1_score_change).toBe(0.007);
    expect(result.f1_score_change_percentage).toBeCloseTo(0.7408, 2);

    // Assert: 오분류 샘플 수 감소 확인
    expect(result.misclassified_reduction_count).toBe(17);
    expect(result.misclassified_reduction_percentage).toBeCloseTo(12.8788, 2);

    // Assert: 변경 이력이 구조화된 형태로 기록됨
    expect(result.version_transition_record).toEqual({
      from_version: 'PriceBook_v2024_01',
      to_version: 'PriceBook_v2024_Q2',
      switch_executed_datetime: new Date('2024-04-01T02:30:00Z'),
      scheduled_datetime: new Date('2024-04-01T00:00:00Z'),
      measurement_completed_datetime: new Date('2024-04-01T02:30:00Z'),
      learning_data_added_count: 847,
      affected_category_count: 23
    });

    // Assert: 정확도 개선/저하 세부 분석 정보 제공
    expect(result.detailed_metrics_comparison).toEqual({
      accuracy: {
        before: 0.945,
        after: 0.952,
        change: 0.007,
        change_rate_percent: expect.any(Number),
        status: 'improved'
      },
      precision: {
        before: 0.952,
        after: 0.958,
        change: 0.006,
        change_rate_percent: expect.any(Number),
        status: 'improved'
      },
      recall: {
        before: 0.938,
        after: 0.946,
        change: 0.008,
        change_rate_percent: expect.any(Number),
        status: 'improved'
      },
      f1_score: {
        before: 0.945,
        after: 0.952,
        change: 0.007,
        change_rate_percent: expect.any(Number),
        status: 'improved'
      }
    });

    // Assert: 대시보드 시각화 데이터 생성 확인
    expect(result.dashboard_visualization_data).toEqual({
      chart_type: 'comparison_bar',
      metrics: [
        { label: 'Accuracy', before: 0.945, after: 0.952, unit: 'ratio' },
        { label: 'Precision', before: 0.952, after: 0.958, unit: 'ratio' },
        { label: 'Recall', before: 0.938, after: 0.946, unit: 'ratio' },
        { label: 'F1-Score', before: 0.945, after: 0.952, unit: 'ratio' }
      ],
      title: 'PriceBook Version Update Impact Analysis',
      subtitle: 'PriceBook_v2024_01 → PriceBook_v2024_Q2',
      generated_at: expect.any(Date)
    });

    // Assert: 변경 관련 메타데이터가 모두 기록됨
    expect(result.change_metadata).toEqual({
      measurement_sample_count: 2400,
      measurement_timestamp: new Date('2024-04-01T02:30:00Z'),
      version_change_triggered_by: 'scheduled_update',
      system_status_before: 'operational',
      system_status_after: 'operational',
      no_degradation: true
    });

    // Assert: 정확도 저하 항목이 없으므로 저하 상세 정보는 빈 배열
    expect(result.degradation_details).toEqual([]);

    // Assert: 전체 개선 평가
    expect(result.overall_assessment).toEqual({
      overall_status: 'improved',
      all_metrics_improved: true,
      critical_degradation_detected: false,
      recommendation: 'Version update successful. New model ready for production deployment.',
      suggested_action: 'proceed_with_deployment'
    });
  });
});