import { detectAnomalousValues, diagnoseRootCauseMultipleHypotheses } from '../../src/logic/it-6-2-2-2';

describe('査定員別の判定精度・乖離パターン分析ダッシュボード', () => {
  test('SCEN-1113: 異常値検出・自動診断機能 - 異常値検出時に根本原因を複数の仮説から判定できる', () => {
    // テストデータ: 異常値を含む査定データセット
    const assessment_records = [
      {
        assessment_id: 'ASS-001',
        assessor_name: '新人査定員A',
        assessment_accuracy_rate: 45,
        average_processing_time_seconds: 180,
        quote_variance_ratio_percent: 55.2,
        data_source: 'past_project',
        timestamp: '2024-01-15T09:00:00Z'
      },
      {
        assessment_id: 'ASS-002',
        assessor_name: '経験者査定員B',
        assessment_accuracy_rate: 92,
        average_processing_time_seconds: 240,
        quote_variance_ratio_percent: 8.5,
        data_source: 'material_price_book',
        timestamp: '2024-01-15T10:30:00Z'
      },
      {
        assessment_id: 'ASS-003',
        assessor_name: '新人査定員C',
        assessment_accuracy_rate: 48,
        average_processing_time_seconds: 165,
        quote_variance_ratio_percent: 62.1,
        data_source: 'past_project',
        timestamp: '2024-01-15T11:00:00Z'
      },
      {
        assessment_id: 'ASS-004',
        assessor_name: '経験者査定員D',
        assessment_accuracy_rate: 88,
        average_processing_time_seconds: 255,
        quote_variance_ratio_percent: 5.3,
        data_source: 'market_data',
        timestamp: '2024-01-15T12:00:00Z'
      }
    ];

    // 異常値検出を実行
    const anomalies = detectAnomalousValues(assessment_records);

    // 異常値が正常に検出されることを確認
    expect(anomalies).toBeDefined();
    expect(anomalies.length).toBe(2);

    // 検出された異常値の詳細を確認
    const anomaly_assessment_001 = anomalies.find(
      (a) => a.assessment_id === 'ASS-001'
    );
    expect(anomaly_assessment_001).toBeDefined();
    expect(anomaly_assessment_001?.anomaly_type).toBe('精度_乖離');
    expect(anomaly_assessment_001?.severity_level).toBe('高');
    expect(anomaly_assessment_001?.anomalous_fields).toContain(
      'assessment_accuracy_rate'
    );
    expect(anomaly_assessment_001?.anomalous_fields).toContain(
      'quote_variance_ratio_percent'
    );

    const anomaly_assessment_003 = anomalies.find(
      (a) => a.assessment_id === 'ASS-003'
    );
    expect(anomaly_assessment_003).toBeDefined();
    expect(anomaly_assessment_003?.anomaly_type).toBe('精度_乖離');
    expect(anomaly_assessment_003?.severity_level).toBe('高');

    // 複数の仮説オプションで根本原因判定を実行
    const root_cause_diagnosis = diagnoseRootCauseMultipleHypotheses({
      assessment_id: 'ASS-001',
      anomalous_assessment_accuracy_rate: 45,
      anomalous_quote_variance_ratio_percent: 55.2,
      expected_accuracy_rate: 85,
      expected_quote_variance_ratio_percent: 12.0,
      assessor_experience_level: 'novice',
      learning_data_coverage_rate: 78,
      model_accuracy_on_similar_cases: 91,
      feedback_count_last_month: 8
    });

    // 複数の仮説が返されることを確認
    expect(root_cause_diagnosis).toBeDefined();
    expect(root_cause_diagnosis.hypotheses).toBeDefined();
    expect(root_cause_diagnosis.hypotheses.length).toBe(3);

    // データ再確認仮説の詳細を確認
    const data_recheck_hypothesis = root_cause_diagnosis.hypotheses.find(
      (h) => h.hypothesis_type === 'data_recheck'
    );
    expect(data_recheck_hypothesis).toBeDefined();
    expect(data_recheck_hypothesis?.priority_score).toBe(75);
    expect(data_recheck_hypothesis?.action).toBe(
      'OCR読取結果と見積書原本の確認'
    );
    expect(data_recheck_hypothesis?.estimated_resolution_rate).toBe(0.72);
    expect(data_recheck_hypothesis?.implementation_difficulty_score).toBe(20);

    // モデル再学習仮説の詳細を確認
    const model_retraining_hypothesis = root_cause_diagnosis.hypotheses.find(
      (h) => h.hypothesis_type === 'model_retraining'
    );
    expect(model_retraining_hypothesis).toBeDefined();
    expect(model_retraining_hypothesis?.priority_score).toBe(62);
    expect(model_retraining_hypothesis?.action).toBe(
      '学習データ追加・モデル再学習実行'
    );
    expect(model_retraining_hypothesis?.estimated_resolution_rate).toBe(0.58);
    expect(model_retraining_hypothesis?.implementation_difficulty_score).toBe(
      65
    );

    // 個別指導仮説の詳細を確認
    const individual_coaching_hypothesis = root_cause_diagnosis.hypotheses.find(
      (h) => h.hypothesis_type === 'individual_coaching'
    );
    expect(individual_coaching_hypothesis).toBeDefined();
    expect(individual_coaching_hypothesis?.priority_score).toBe(88);
    expect(individual_coaching_hypothesis?.action).toBe(
      '査定員個別指導・教育実施'
    );
    expect(individual_coaching_hypothesis?.estimated_resolution_rate).toBe(
      0.85
    );
    expect(individual_coaching_hypothesis?.implementation_difficulty_score).toBe(
      35
    );

    // 診断結果の総合判定を確認
    expect(root_cause_diagnosis.primary_root_cause).toBe(
      'individual_coaching'
    );
    expect(root_cause_diagnosis.confidence_score).toBe(0.85);
    expect(root_cause_diagnosis.diagnostic_summary).toContain('経験不足');
    expect(root_cause_diagnosis.recommended_actions).toContain(
      '個別指導を優先実施'
    );
    expect(root_cause_diagnosis.monitoring_metrics).toBeDefined();
    expect(root_cause_diagnosis.monitoring_metrics.length).toBe(3);
    expect(root_cause_diagnosis.monitoring_metrics).toContain(
      'assessment_accuracy_rate'
    );
    expect(root_cause_diagnosis.monitoring_metrics).toContain(
      'quote_variance_ratio_percent'
    );
    expect(root_cause_diagnosis.monitoring_metrics).toContain(
      'average_processing_time_seconds'
    );

    // 各仮説の実行結果が構造化されていることを確認
    root_cause_diagnosis.hypotheses.forEach((hypothesis) => {
      expect(hypothesis.hypothesis_type).toMatch(
        /^(data_recheck|model_retraining|individual_coaching)$/
      );
      expect(hypothesis.priority_score).toBeGreaterThanOrEqual(0);
      expect(hypothesis.priority_score).toBeLessThanOrEqual(100);
      expect(hypothesis.estimated_resolution_rate).toBeGreaterThanOrEqual(0);
      expect(hypothesis.estimated_resolution_rate).toBeLessThanOrEqual(1);
      expect(hypothesis.implementation_difficulty_score).toBeGreaterThanOrEqual(
        0
      );
      expect(hypothesis.implementation_difficulty_score).toBeLessThanOrEqual(
        100
      );
    });

    // 異常値の多角的な理解が可能であることを確認
    expect(root_cause_diagnosis.diagnostic_details).toBeDefined();
    expect(root_cause_diagnosis.diagnostic_details.accuracy_degradation_reason).toBeDefined();
    expect(
      root_cause_diagnosis.diagnostic_details.variance_increase_reason
    ).toBeDefined();
    expect(
      root_cause_diagnosis.diagnostic_details.accuracy_degradation_reason
    ).toContain('査定基準');
    expect(
      root_cause_diagnosis.diagnostic_details.variance_increase_reason
    ).toContain('相場判定');
  });
});