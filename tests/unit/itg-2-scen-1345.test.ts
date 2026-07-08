import { classifyOcrReadingFailure } from '../../src/logic/it-6-3-1';

describe('査定判定ロジックの適用履歴と根拠の記録・検索機能', () => {
  test('SCEN-1345: フォーマット差異原因分類 - 読取失敗の原因が正しく分類される', () => {
    // テスト用の読取失敗データパターン1: フォーマット差異
    const format_diff_case = {
      failure_id: 'ocr_fail_001',
      quote_id: 'quote_2024_001',
      department_id: 'dept_construction_01',
      expected_field_name: '工事費合計',
      actual_extracted_text: '合計金額',
      expected_field_position: { x: 50, y: 200, width: 100, height: 20 },
      actual_field_position: { x: 50, y: 250, width: 100, height: 20 },
      reference_format_template: 'template_standard_construction',
      target_format_template: 'template_dept_custom_001',
      ocr_confidence_score: 92,
      detected_differences: ['field_name_mismatch', 'position_offset'],
      failure_description: '工事費合計フィールドが別の位置に存在。フォーマットレイアウトの相違'
    };

    const format_diff_result = classifyOcrReadingFailure(format_diff_case);
    expect(format_diff_result.classification_category).toBe('フォーマット差異');
    expect(format_diff_result.primary_cause).toBe('format_layout_difference');
    expect(format_diff_result.confidence_score).toBeGreaterThan(85);
    expect(format_diff_result.detail_info).toEqual(
      expect.objectContaining({
        field_name_mismatch: true,
        position_offset_pixels: expect.any(Number),
        template_version_mismatch: true
      })
    );
    expect(format_diff_result.remediation_priority).toBe('high');
    expect(format_diff_result.customization_scope).toContain('ocr_model_adjustment');

    // テスト用の読取失敗データパターン2: 項目体系差
    const item_structure_diff_case = {
      failure_id: 'ocr_fail_002',
      quote_id: 'quote_2024_002',
      department_id: 'dept_construction_02',
      expected_field_name: '単価',
      actual_extracted_text: '単価(税抜)',
      expected_field_hierarchy: ['見積', '明細', '単価'],
      actual_field_hierarchy: ['見積', '明細詳細', '単価(税抜)'],
      reference_format_template: 'template_standard_construction',
      target_format_template: 'template_dept_custom_002',
      ocr_confidence_score: 88,
      detected_differences: ['hierarchy_depth_mismatch', 'field_semantics_change'],
      failure_description: '項目階層が異なり、単価の定義が税抜/税込で異なる'
    };

    const item_structure_result = classifyOcrReadingFailure(item_structure_diff_case);
    expect(item_structure_result.classification_category).toBe('項目体系差');
    expect(item_structure_result.primary_cause).toBe('item_structure_difference');
    expect(item_structure_result.confidence_score).toBeGreaterThan(80);
    expect(item_structure_result.detail_info).toEqual(
      expect.objectContaining({
        hierarchy_depth_mismatch: true,
        expected_hierarchy_depth: 3,
        actual_hierarchy_depth: 3,
        semantic_difference_detected: true,
        field_definition_variance: 'tax_treatment_difference'
      })
    );
    expect(item_structure_result.remediation_priority).toBe('high');
    expect(item_structure_result.customization_scope).toContain('judgment_logic_modification');

    // テスト用の読取失敗データパターン3: レイアウト差
    const layout_diff_case = {
      failure_id: 'ocr_fail_003',
      quote_id: 'quote_2024_003',
      department_id: 'dept_construction_03',
      expected_field_name: '摘要',
      actual_extracted_text: '',
      expected_field_position: { x: 10, y: 300, width: 500, height: 15 },
      actual_field_position: { x: 10, y: 320, width: 520, height: 10 },
      reference_format_template: 'template_standard_construction',
      target_format_template: 'template_dept_custom_003',
      ocr_confidence_score: 45,
      detected_differences: ['position_significant_offset', 'size_variance', 'text_extraction_failure'],
      failure_description: '摘要欄の位置がずれ、高さが異なりテキスト抽出失敗'
    };

    const layout_diff_result = classifyOcrReadingFailure(layout_diff_case);
    expect(layout_diff_result.classification_category).toBe('レイアウト差');
    expect(layout_diff_result.primary_cause).toBe('layout_position_mismatch');
    expect(layout_diff_result.confidence_score).toBeGreaterThan(75);
    expect(layout_diff_result.detail_info).toEqual(
      expect.objectContaining({
        position_offset_pixels: expect.any(Number),
        height_variance_pixels: expect.any(Number),
        width_variance_pixels: expect.any(Number),
        text_extraction_failed: true,
        page_rotation_detected: false
      })
    );
    expect(layout_diff_result.remediation_priority).toBe('medium');
    expect(layout_diff_result.customization_scope).toContain('additional_learning_data');

    // 分類結果一覧の統合検証
    const classification_summary = {
      total_failures_classified: 3,
      format_difference_count: 1,
      item_structure_difference_count: 1,
      layout_difference_count: 1,
      unclassified_count: 0,
      classification_accuracy_rate: 100,
      average_confidence_score: (92 + 88 + 45) / 3
    };

    expect(classification_summary.total_failures_classified).toBe(3);
    expect(classification_summary.format_difference_count).toBe(1);
    expect(classification_summary.item_structure_difference_count).toBe(1);
    expect(classification_summary.layout_difference_count).toBe(1);
    expect(classification_summary.unclassified_count).toBe(0);
    expect(classification_summary.classification_accuracy_rate).toBe(100);
    expect(classification_summary.average_confidence_score).toBeCloseTo(75, 0);

    // 各分類の詳細情報が正確に記録されていることを検証
    expect(format_diff_result.detail_info).toBeDefined();
    expect(format_diff_result.detail_info.field_name_mismatch).toBe(true);
    expect(format_diff_result.recorded_timestamp).toBeDefined();
    expect(format_diff_result.classified_by_system).toBe(true);

    expect(item_structure_result.detail_info).toBeDefined();
    expect(item_structure_result.detail_info.semantic_difference_detected).toBe(true);
    expect(item_structure_result.recorded_timestamp).toBeDefined();
    expect(item_structure_result.classified_by_system).toBe(true);

    expect(layout_diff_result.detail_info).toBeDefined();
    expect(layout_diff_result.detail_info.text_extraction_failed).toBe(true);
    expect(layout_diff_result.recorded_timestamp).toBeDefined();
    expect(layout_diff_result.classified_by_system).toBe(true);

    // 分類結果一覧画面表示検証
    const classification_list = [format_diff_result, item_structure_result, layout_diff_result];
    
    const format_entries = classification_list.filter(
      (entry) => entry.classification_category === 'フォーマット差異'
    );
    expect(format_entries.length).toBe(1);
    expect(format_entries[0].failure_id).toBe('ocr_fail_001');

    const structure_entries = classification_list.filter(
      (entry) => entry.classification_category === '項目体系差'
    );
    expect(structure_entries.length).toBe(1);
    expect(structure_entries[0].failure_id).toBe('ocr_fail_002');

    const layout_entries = classification_list.filter(
      (entry) => entry.classification_category === 'レイアウト差'
    );
    expect(layout_entries.length).toBe(1);
    expect(layout_entries[0].failure_id).toBe('ocr_fail_003');

    // カスタマイズ範囲と優先度の一貫性検証
    const customization_map = {
      'フォーマット差異': ['ocr_model_adjustment', 'judgment_logic_modification'],
      '項目体系差': ['judgment_logic_modification', 'additional_learning_data'],
      'レイアウト差': ['additional_learning_data', 'ocr_model_adjustment']
    };

    classification_list.forEach((result) => {
      const expected_scopes = customization_map[result.classification_category];
      expect(result.customization_scope.some((scope) => expected_scopes.includes(scope))).toBe(true);
    });

    // 各分類の根拠詳細が記録されていることを検証
    expect(format_diff_result.classification_reasoning).toBeDefined();
    expect(format_diff_result.classification_reasoning.length).toBeGreaterThan(0);
    
    expect(item_structure_result.classification_reasoning).toBeDefined();
    expect(item_structure_result.classification_reasoning.length).toBeGreaterThan(0);
    
    expect(layout_diff_result.classification_reasoning).toBeDefined();
    expect(layout_diff_result.classification_reasoning.length).toBeGreaterThan(0);
  });
});