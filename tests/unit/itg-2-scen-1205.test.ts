import { analyzeQualityIssueAndProposeMeasures } from '../../src/logic/it-6-2-2-2';

describe('改善対策立案機能 - フォーマット変化分析', () => {
  test('SCEN-1205: フォーマット変化が原因の場合にOCR前処理調整・パーサ修正対策が立案される', () => {
    // Arrange: テストデータの準備
    // フォーマット変化が原因の査定品質問題ケース
    const qualityIssueData = {
      issue_id: 'QI-20240115-001',
      root_cause: 'format_change',
      ocr_accuracy_before: 92.5,
      ocr_accuracy_after: 78.3,
      accuracy_decline_rate: -14.2,
      affected_estimate_count: 45,
      format_change_detection: {
        detected: true,
        changed_fields: ['item_description', 'unit_price_layout', 'total_amount_format'],
        format_change_severity: 'high',
        parsing_failure_count: 18
      },
      assessor_feedback_count: 23,
      issue_detection_date: '2024-01-15T09:30:00Z'
    };

    // Act: 改善対策立案機能の実行
    const measuresResult = analyzeQualityIssueAndProposeMeasures(qualityIssueData);

    // Assert: 原因分析の確認
    expect(measuresResult.root_cause_identified).toBe('format_change');
    expect(measuresResult.is_format_change_detected).toBe(true);

    // Assert: 立案された改善対策の一覧確認
    expect(Array.isArray(measuresResult.proposed_measures)).toBe(true);
    expect(measuresResult.proposed_measures.length).toBeGreaterThanOrEqual(2);

    // Assert: OCR前処理調整対策の確認
    const ocrPreprocessMeasure = measuresResult.proposed_measures.find(
      (m: any) => m.measure_type === 'ocr_preprocessing_adjustment'
    );
    expect(ocrPreprocessMeasure).toBeDefined();
    expect(ocrPreprocessMeasure.measure_name).toBe('OCR前処理調整');
    expect(ocrPreprocessMeasure.description).toContain('フォーマット変化');
    expect(ocrPreprocessMeasure.priority_rank).toBe('high');
    expect(typeof ocrPreprocessMeasure.expected_effectiveness_score).toBe('number');
    expect(ocrPreprocessMeasure.expected_effectiveness_score).toBeGreaterThanOrEqual(0);
    expect(ocrPreprocessMeasure.expected_effectiveness_score).toBeLessThanOrEqual(100);

    // Assert: パーサ修正対策の確認
    const parserModifyMeasure = measuresResult.proposed_measures.find(
      (m: any) => m.measure_type === 'parser_modification'
    );
    expect(parserModifyMeasure).toBeDefined();
    expect(parserModifyMeasure.measure_name).toBe('パーサ修正');
    expect(parserModifyMeasure.description).toContain('項目記述フォーマット');
    expect(parserModifyMeasure.priority_rank).toBe('high');
    expect(typeof parserModifyMeasure.expected_effectiveness_score).toBe('number');
    expect(parserModifyMeasure.expected_effectiveness_score).toBeGreaterThanOrEqual(0);
    expect(parserModifyMeasure.expected_effectiveness_score).toBeLessThanOrEqual(100);

    // Assert: 各対策の必須情報確認
    measuresResult.proposed_measures.forEach((measure: any) => {
      expect(measure.measure_id).toBeDefined();
      expect(typeof measure.measure_id).toBe('string');
      expect(measure.measure_id.length).toBeGreaterThan(0);

      expect(measure.measure_type).toBeDefined();
      expect(typeof measure.measure_type).toBe('string');

      expect(measure.measure_name).toBeDefined();
      expect(typeof measure.measure_name).toBe('string');

      expect(measure.description).toBeDefined();
      expect(typeof measure.description).toBe('string');
      expect(measure.description.length).toBeGreaterThan(0);

      expect(measure.priority_rank).toBeDefined();
      expect(['high', 'medium', 'low']).toContain(measure.priority_rank);

      expect(measure.estimated_implementation_days).toBeDefined();
      expect(typeof measure.estimated_implementation_days).toBe('number');
      expect(measure.estimated_implementation_days).toBeGreaterThan(0);

      expect(measure.responsible_person).toBeDefined();
      expect(typeof measure.responsible_person).toBe('string');
      expect(measure.responsible_person.length).toBeGreaterThan(0);

      expect(measure.scheduled_start_date).toBeDefined();
      expect(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(measure.scheduled_start_date)).toBe(true);

      expect(measure.expected_effectiveness_score).toBeDefined();
      expect(typeof measure.expected_effectiveness_score).toBe('number');
      expect(measure.expected_effectiveness_score).toBeGreaterThanOrEqual(0);
      expect(measure.expected_effectiveness_score).toBeLessThanOrEqual(100);
    });

    // Assert: 対策の優先度順序確認（高優先度が最初）
    const highPriorityMeasures = measuresResult.proposed_measures.filter(
      (m: any) => m.priority_rank === 'high'
    );
    expect(highPriorityMeasures.length).toBeGreaterThanOrEqual(2);
    expect(highPriorityMeasures.some((m: any) => m.measure_type === 'ocr_preprocessing_adjustment')).toBe(true);
    expect(highPriorityMeasures.some((m: any) => m.measure_type === 'parser_modification')).toBe(true);

    // Assert: フォーマット変化への適切性確認
    const ocrPreprocessDetail = ocrPreprocessMeasure.detailed_action_plan;
    expect(ocrPreprocessDetail).toBeDefined();
    expect(typeof ocrPreprocessDetail).toBe('string');
    expect(ocrPreprocessDetail.length).toBeGreaterThan(0);

    const parserModifyDetail = parserModifyMeasure.detailed_action_plan;
    expect(parserModifyDetail).toBeDefined();
    expect(typeof parserModifyDetail).toBe('string');
    expect(parserModifyDetail.length).toBeGreaterThan(0);

    // Assert: 対策の適用範囲がフォーマット変化の詳細に基づいているか確認
    expect(measuresResult.target_format_fields).toBeDefined();
    expect(Array.isArray(measuresResult.target_format_fields)).toBe(true);
    expect(measuresResult.target_format_fields).toContain('item_description');
    expect(measuresResult.target_format_fields).toContain('unit_price_layout');
    expect(measuresResult.target_format_fields).toContain('total_amount_format');

    // Assert: 期待改善度の根拠確認
    expect(measuresResult.expected_ocr_accuracy_improvement_rate).toBeDefined();
    expect(typeof measuresResult.expected_ocr_accuracy_improvement_rate).toBe('number');
    expect(measuresResult.expected_ocr_accuracy_improvement_rate).toBeGreaterThan(0);
    // フォーマット変化による精度低下（14.2%）に対し、改善対策により少なくとも50%以上の回復を期待
    expect(measuresResult.expected_ocr_accuracy_improvement_rate).toBeGreaterThanOrEqual(50);
    expect(measuresResult.expected_ocr_accuracy_improvement_rate).toBeLessThanOrEqual(100);

    // Assert: 総合判定スコア確認
    expect(measuresResult.measure_plan_feasibility_score).toBeDefined();
    expect(typeof measuresResult.measure_plan_feasibility_score).toBe('number');
    expect(measuresResult.measure_plan_feasibility_score).toBeGreaterThanOrEqual(0);
    expect(measuresResult.measure_plan_feasibility_score).toBeLessThanOrEqual(100);

    // Assert: 実装可能性の確認
    expect(measuresResult.is_implementable).toBe(true);
    expect(measuresResult.implementation_constraint_summary).toBeDefined();
  });
});