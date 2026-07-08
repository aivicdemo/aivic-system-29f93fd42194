import { analyzeEstimateDocumentQuality } from '../../src/logic/it-6-2-2-2';

describe('見積査定員による説明資料の品質チェック - 判定根拠の明確性検証', () => {
  test('SCEN-1015: 判定根拠が基準を満たさない場合に不合格判定と修正指示が記録される', () => {
    // 【前提条件】
    // - 見積査定員が説明資料の品質チェックを実施している
    // - 判定根拠の明確性が基準値（80点）を下回っている説明資料が対象
    // - チェック実施者と実施日時がシステムに記録される

    // 【入力データ】
    const quality_check_input = {
      document_id: 'DOC-2024-001',
      document_type: 'estimate_explanation',
      assessment_reasoning_clarity_score: 65, // 基準値80未満 → 不合格
      assessment_reasoning_text:
        '相場乖離が検出されましたが、詳細理由は省略します。',
      price_deviation_rate: 15.5,
      price_deviation_amount: 125000,
      reference_data_count: 5,
      applied_correction_factor: 1.08,
      assessment_executor_id: 'ASSESSOR-001',
      assessment_datetime: new Date('2024-01-15T14:30:00Z'),
      quality_check_criteria: {
        reasoning_clarity_min_score: 80,
        price_data_completeness_min_score: 75,
        reference_data_adequacy_min_score: 70,
      },
    };

    // 【実行】
    const quality_check_result = analyzeEstimateDocumentQuality(
      quality_check_input
    );

    // 【期待値の計算】
    // - 判定根拠明確性スコア: 65点 < 基準値80点 → 不合格
    // - 不合格理由: "reasoning_clarity_below_standard"
    // - 修正対象項目: assessment_reasoning (判定根拠の記述)
    // - 改善すべき内容: 過去案件参照、相場根拠、補正係数の具体的説明を追加

    // 【Assertion: 不合格判定の確認】
    expect(quality_check_result.judgment_result).toBe('NOT_PASSED');
    expect(quality_check_result.reasoning_clarity_score).toBe(65);
    expect(quality_check_result.reasoning_clarity_meets_criteria).toBe(false);

    // 【Assertion: 修正指示の記録確認】
    expect(quality_check_result.correction_instruction).toBeDefined();
    expect(quality_check_result.correction_instruction.correction_id).toMatch(
      /^CORR-/
    );
    expect(
      quality_check_result.correction_instruction.instruction_reason
    ).toMatch(/reasoning_clarity/);

    // 【Assertion: 修正指示に必須項目が含まれているか】
    expect(
      quality_check_result.correction_instruction.instruction_timestamp
    ).toEqual(new Date('2024-01-15T14:30:00Z'));
    expect(quality_check_result.correction_instruction.checked_by).toBe(
      'ASSESSOR-001'
    );
    expect(
      quality_check_result.correction_instruction.judgment_result_flag
    ).toBe('NOT_PASSED');

    // 【Assertion: 修正指示の詳細理由が具体的か】
    expect(
      quality_check_result.correction_instruction.detailed_reason_for_correction
    ).toMatch(/過去案件/);
    expect(
      quality_check_result.correction_instruction.detailed_reason_for_correction
    ).toMatch(/相場根拠/);
    expect(
      quality_check_result.correction_instruction.detailed_reason_for_correction
    ).toMatch(/補正係数/);

    // 【Assertion: 修正対象項目が特定されているか】
    expect(
      quality_check_result.correction_instruction.target_items_for_correction
    ).toContain('assessment_reasoning');
    expect(
      quality_check_result.correction_instruction.target_items_for_correction
      .length
    ).toBeGreaterThan(0);

    // 【Assertion: 修正指示が履歴テーブルに記録される状態】
    expect(quality_check_result.is_recorded_in_history).toBe(true);
    expect(quality_check_result.history_record_id).toMatch(/^HIST-/);

    // 【Assertion: 整合性確認】
    // - 判定根拠明確性が基準未満 → 修正指示が生成される
    expect(quality_check_result.reasoning_clarity_meets_criteria).toBe(false);
    expect(quality_check_result.judgment_result).toBe('NOT_PASSED');
    expect(quality_check_result.correction_instruction).toBeDefined();

    // 【Assertion: 修正指示の記録情報が正しいか】
    expect(quality_check_result.correction_instruction.document_id).toBe(
      'DOC-2024-001'
    );
    expect(
      quality_check_result.correction_instruction.criteria_threshold_for_reference
    ).toBe(80);
    expect(
      quality_check_result.correction_instruction.actual_score_achieved
    ).toBe(65);
  });
});