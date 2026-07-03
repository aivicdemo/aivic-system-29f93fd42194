import { validateSalesDataMetadataSchema } from '../../src/logic/it-1781935279444-1-1-1';

describe('営業データ項目メタデータ管理機能 - 検証ルール矛盾検出', () => {
  // SCEN-1340
  test('検証ルールに矛盾がある場合、確定処理が中断され矛盾箇所が通知される', () => {
    const conflictingRules = [
      {
        rule_id: 'rule_001',
        rule_name: '金額下限チェック',
        field_name: 'amount',
        condition_type: 'minimum',
        condition_value: 100,
        line_number: 1,
      },
      {
        rule_id: 'rule_002',
        rule_name: '金額上限チェック',
        field_name: 'amount',
        condition_type: 'maximum',
        condition_value: 50,
        line_number: 2,
      },
    ];

    const result = validateSalesDataMetadataSchema({
      validation_rules: conflictingRules,
      finalization_status: 'pending',
    });

    expect(result.status).toBe('aborted');
    expect(result.has_conflict).toBe(true);
    expect(result.conflict_details).toHaveLength(1);

    const conflict = result.conflict_details[0];
    expect(conflict.conflict_type).toBe('rule_contradiction');
    expect(conflict.rule_ids).toEqual(['rule_001', 'rule_002']);
    expect(conflict.field_name).toBe('amount');
    expect(conflict.conflicting_rule_names).toEqual([
      '金額下限チェック',
      '金額上限チェック',
    ]);
    expect(conflict.condition_description).toBe(
      'minimum: 100 と maximum: 50 の矛盾'
    );
    expect(conflict.line_numbers).toEqual([1, 2]);
    expect(conflict.severity).toBe('critical');

    expect(result.error_message).toBe(
      '検証ルールに矛盾があります。確定処理は中断されました。'
    );
    expect(result.user_notification).toContain('金額下限チェック');
    expect(result.user_notification).toContain('金額上限チェック');
    expect(result.user_notification).toContain('minimum: 100');
    expect(result.user_notification).toContain('maximum: 50');
  });

  test('複数の矛盾が存在する場合、すべて検出されて通知される', () => {
    const multipleConflicts = [
      {
        rule_id: 'rule_001',
        rule_name: 'アポ数下限',
        field_name: 'appo_count',
        condition_type: 'minimum',
        condition_value: 10,
        line_number: 1,
      },
      {
        rule_id: 'rule_002',
        rule_name: 'アポ数上限',
        field_name: 'appo_count',
        condition_type: 'maximum',
        condition_value: 5,
        line_number: 2,
      },
      {
        rule_id: 'rule_003',
        rule_name: '成約数下限',
        field_name: 'deal_count',
        condition_type: 'minimum',
        condition_value: 20,
        line_number: 3,
      },
      {
        rule_id: 'rule_004',
        rule_name: '成約数上限',
        field_name: 'deal_count',
        condition_type: 'maximum',
        condition_value: 15,
        line_number: 4,
      },
    ];

    const result = validateSalesDataMetadataSchema({
      validation_rules: multipleConflicts,
      finalization_status: 'pending',
    });

    expect(result.status).toBe('aborted');
    expect(result.has_conflict).toBe(true);
    expect(result.conflict_details).toHaveLength(2);

    const firstConflict = result.conflict_details[0];
    expect(firstConflict.field_name).toBe('appo_count');
    expect(firstConflict.rule_ids).toEqual(['rule_001', 'rule_002']);

    const secondConflict = result.conflict_details[1];
    expect(secondConflict.field_name).toBe('deal_count');
    expect(secondConflict.rule_ids).toEqual(['rule_003', 'rule_004']);

    expect(result.conflict_count).toBe(2);
  });

  test('矛盾する検証ルール定義で確定処理を試みると中断される', () => {
    const invalidRules = [
      {
        rule_id: 'rule_a',
        rule_name: 'データ型チェック_整数',
        field_name: 'service_id',
        condition_type: 'data_type',
        condition_value: 'integer',
        line_number: 5,
      },
      {
        rule_id: 'rule_b',
        rule_name: 'データ型チェック_文字列',
        field_name: 'service_id',
        condition_type: 'data_type',
        condition_value: 'string',
        line_number: 6,
      },
    ];

    const result = validateSalesDataMetadataSchema({
      validation_rules: invalidRules,
      finalization_status: 'pending',
    });

    expect(result.status).toBe('aborted');
    expect(result.finalization_prevented).toBe(true);

    const conflict = result.conflict_details[0];
    expect(conflict.conflict_type).toBe('data_type_mismatch');
    expect(conflict.resolution_hint).toContain('どちらのデータ型にするか確認してください');
  });

  test('矛盾がない場合は確定処理が正常に完了する', () => {
    const validRules = [
      {
        rule_id: 'rule_001',
        rule_name: '金額下限チェック',
        field_name: 'amount',
        condition_type: 'minimum',
        condition_value: 50,
        line_number: 1,
      },
      {
        rule_id: 'rule_002',
        rule_name: '金額上限チェック',
        field_name: 'amount',
        condition_type: 'maximum',
        condition_value: 100,
        line_number: 2,
      },
    ];

    const result = validateSalesDataMetadataSchema({
      validation_rules: validRules,
      finalization_status: 'pending',
    });

    expect(result.status).toBe('finalized');
    expect(result.has_conflict).toBe(false);
    expect(result.conflict_details).toHaveLength(0);
    expect(result.finalization_prevented).toBe(false);
  });

  test('矛盾検出時のエラーメッセージが業務キーワードを含む', () => {
    const conflictRules = [
      {
        rule_id: 'rule_min',
        rule_name: '顧客反応下限',
        field_name: 'customer_response',
        condition_type: 'minimum',
        condition_value: 100,
        line_number: 3,
      },
      {
        rule_id: 'rule_max',
        rule_name: '顧客反応上限',
        field_name: 'customer_response',
        condition_type: 'maximum',
        condition_value: 80,
        line_number: 4,
      },
    ];

    expect(() =>
      validateSalesDataMetadataSchema({
        validation_rules: conflictRules,
        finalization_status: 'pending',
      })
    ).toThrow(/矛盾/);
  });
});