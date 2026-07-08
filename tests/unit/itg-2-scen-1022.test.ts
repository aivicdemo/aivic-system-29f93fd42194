import { approveExplanationMaterial } from '../../src/logic/it-6-2-2-1';

describe('査定部署長による説明資料の最終確認・承認', () => {
  // SCEN-1022
  test('資料の完全性・根拠の妥当性・表示形式がすべて検証基準を満たす場合に承認判定される', () => {
    const material_id = 'MAT-20240115-001';
    const department_head_id = 'EMP-DH-001';
    const approval_timestamp = new Date('2024-01-15T11:00:00Z');

    const input = {
      material_id,
      department_head_id,
      approval_timestamp,
      completeness_check: {
        required_fields_present: true,
        no_missing_sections: true,
        data_accuracy_verified: true,
      },
      reasonableness_check: {
        logical_consistency: true,
        no_contradictions: true,
        evidence_appropriateness: true,
      },
      format_check: {
        font_unified: true,
        layout_consistent: true,
        notation_rules_followed: true,
      },
    };

    const result = approveExplanationMaterial(input);

    expect(result.approval_status).toBe('承認済み');
    expect(result.material_id).toBe('MAT-20240115-001');
    expect(result.approved_by).toBe('EMP-DH-001');
    expect(result.approved_at).toEqual(new Date('2024-01-15T11:00:00Z'));
    expect(result.completeness_verification_passed).toBe(true);
    expect(result.reasonableness_verification_passed).toBe(true);
    expect(result.format_verification_passed).toBe(true);
    expect(result.approval_decision).toBe('承認');
    expect(result.notification_sent_to_departments).toBe(true);
    expect(result.notification_timestamp).toBeDefined();
  });

  test('完全性チェックで検証基準を満たさない場合に承認判定は実行されない', () => {
    const material_id = 'MAT-20240115-002';
    const department_head_id = 'EMP-DH-001';
    const approval_timestamp = new Date('2024-01-15T12:00:00Z');

    const input = {
      material_id,
      department_head_id,
      approval_timestamp,
      completeness_check: {
        required_fields_present: false,
        no_missing_sections: true,
        data_accuracy_verified: true,
      },
      reasonableness_check: {
        logical_consistency: true,
        no_contradictions: true,
        evidence_appropriateness: true,
      },
      format_check: {
        font_unified: true,
        layout_consistent: true,
        notation_rules_followed: true,
      },
    };

    expect(() => approveExplanationMaterial(input)).toThrow(/完全性/);
  });

  test('根拠の妥当性チェックで検証基準を満たさない場合に承認判定は実行されない', () => {
    const material_id = 'MAT-20240115-003';
    const department_head_id = 'EMP-DH-001';
    const approval_timestamp = new Date('2024-01-15T13:00:00Z');

    const input = {
      material_id,
      department_head_id,
      approval_timestamp,
      completeness_check: {
        required_fields_present: true,
        no_missing_sections: true,
        data_accuracy_verified: true,
      },
      reasonableness_check: {
        logical_consistency: false,
        no_contradictions: true,
        evidence_appropriateness: true,
      },
      format_check: {
        font_unified: true,
        layout_consistent: true,
        notation_rules_followed: true,
      },
    };

    expect(() => approveExplanationMaterial(input)).toThrow(/妥当性/);
  });

  test('表示形式チェックで検証基準を満たさない場合に承認判定は実行されない', () => {
    const material_id = 'MAT-20240115-004';
    const department_head_id = 'EMP-DH-001';
    const approval_timestamp = new Date('2024-01-15T14:00:00Z');

    const input = {
      material_id,
      department_head_id,
      approval_timestamp,
      completeness_check: {
        required_fields_present: true,
        no_missing_sections: true,
        data_accuracy_verified: true,
      },
      reasonableness_check: {
        logical_consistency: true,
        no_contradictions: true,
        evidence_appropriateness: true,
      },
      format_check: {
        font_unified: false,
        layout_consistent: true,
        notation_rules_followed: true,
      },
    };

    expect(() => approveExplanationMaterial(input)).toThrow(/表示形式/);
  });

  test('複数のチェック項目で検証基準を満たさない場合に最初の不合格項目で例外を発生させる', () => {
    const material_id = 'MAT-20240115-005';
    const department_head_id = 'EMP-DH-001';
    const approval_timestamp = new Date('2024-01-15T15:00:00Z');

    const input = {
      material_id,
      department_head_id,
      approval_timestamp,
      completeness_check: {
        required_fields_present: false,
        no_missing_sections: false,
        data_accuracy_verified: true,
      },
      reasonableness_check: {
        logical_consistency: false,
        no_contradictions: false,
        evidence_appropriateness: true,
      },
      format_check: {
        font_unified: false,
        layout_consistent: false,
        notation_rules_followed: true,
      },
    };

    expect(() => approveExplanationMaterial(input)).toThrow(/完全性/);
  });

  test('承認日時が記録される際にタイムスタンプが正確に保持される', () => {
    const material_id = 'MAT-20240115-006';
    const department_head_id = 'EMP-DH-001';
    const approval_timestamp = new Date('2024-01-15T16:30:45Z');

    const input = {
      material_id,
      department_head_id,
      approval_timestamp,
      completeness_check: {
        required_fields_present: true,
        no_missing_sections: true,
        data_accuracy_verified: true,
      },
      reasonableness_check: {
        logical_consistency: true,
        no_contradictions: true,
        evidence_appropriateness: true,
      },
      format_check: {
        font_unified: true,
        layout_consistent: true,
        notation_rules_followed: true,
      },
    };

    const result = approveExplanationMaterial(input);

    expect(result.approved_at.getTime()).toBe(new Date('2024-01-15T16:30:45Z').getTime());
  });

  test('承認者情報（部署長ID）がシステムに記録される', () => {
    const material_id = 'MAT-20240115-007';
    const department_head_id = 'EMP-DH-002';
    const approval_timestamp = new Date('2024-01-15T17:00:00Z');

    const input = {
      material_id,
      department_head_id,
      approval_timestamp,
      completeness_check: {
        required_fields_present: true,
        no_missing_sections: true,
        data_accuracy_verified: true,
      },
      reasonableness_check: {
        logical_consistency: true,
        no_contradictions: true,
        evidence_appropriateness: true,
      },
      format_check: {
        font_unified: true,
        layout_consistent: true,
        notation_rules_followed: true,
      },
    };

    const result = approveExplanationMaterial(input);

    expect(result.approved_by).toBe('EMP-DH-002');
  });

  test('承認完了の通知が関連部門に送信されることが確認される', () => {
    const material_id = 'MAT-20240115-008';
    const department_head_id = 'EMP-DH-001';
    const approval_timestamp = new Date('2024-01-15T18:00:00Z');

    const input = {
      material_id,
      department_head_id,
      approval_timestamp,
      completeness_check: {
        required_fields_present: true,
        no_missing_sections: true,
        data_accuracy_verified: true,
      },
      reasonableness_check: {
        logical_consistency: true,
        no_contradictions: true,
        evidence_appropriateness: true,
      },
      format_check: {
        font_unified: true,
        layout_consistent: true,
        notation_rules_followed: true,
      },
    };

    const result = approveExplanationMaterial(input);

    expect(result.notification_sent_to_departments).toBe(true);
    expect(result.notification_timestamp).toBeDefined();
  });

  test('承認ステータスが「承認済み」に変更される', () => {
    const material_id = 'MAT-20240115-009';
    const department_head_id = 'EMP-DH-001';
    const approval_timestamp = new Date('2024-01-15T19:00:00Z');

    const input = {
      material_id,
      department_head_id,
      approval_timestamp,
      completeness_check: {
        required_fields_present: true,
        no_missing_sections: true,
        data_accuracy_verified: true,
      },
      reasonableness_check: {
        logical_consistency: true,
        no_contradictions: true,
        evidence_appropriateness: true,
      },
      format_check: {
        font_unified: true,
        layout_consistent: true,
        notation_rules_followed: true,
      },
    };

    const result = approveExplanationMaterial(input);

    expect(result.approval_status).toBe('承認済み');
  });

  test('データ不整合がある場合に検証で例外を発生させる', () => {
    const material_id = 'MAT-20240115-010';
    const department_head_id = 'EMP-DH-001';
    const approval_timestamp = new Date('2024-01-15T20:00:00Z');

    const input = {
      material_id,
      department_head_id,
      approval_timestamp,
      completeness_check: {
        required_fields_present: true,
        no_missing_sections: true,
        data_accuracy_verified: false,
      },
      reasonableness_check: {
        logical_consistency: true,
        no_contradictions: true,
        evidence_appropriateness: true,
      },
      format_check: {
        font_unified: true,
        layout_consistent: true,
        notation_rules_followed: true,
      },
    };

    expect(() => approveExplanationMaterial(input)).toThrow(/完全性/);
  });
});