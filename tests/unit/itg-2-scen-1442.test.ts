import { recordModificationAuditLog } from '../../src/logic/it-6-2-2-1';

describe('修正内容監査ログ記録機能', () => {
  // SCEN-1442
  test('修正前後の精度指標に改善が確認できた場合にログに改善度が記録される', () => {
    // Arrange: 修正前の精度指標を設定
    const pre_accuracy = 80;
    const pre_timestamp = new Date('2024-01-15T10:00:00Z');
    const pre_log_id = 'log_pre_001';

    // Arrange: 修正後の精度指標を設定
    const post_accuracy = 85;
    const post_timestamp = new Date('2024-01-15T11:00:00Z');
    const post_log_id = 'log_post_001';

    // Arrange: 修正内容情報
    const modification_id = 'mod_001';
    const assessor_id = 'assessor_123';
    const modification_reason = 'OCR読取精度の向上のため学習データを追加更新';
    const applied_logic_id = 'logic_ocr_v2';

    // Act: 修正内容監査ログ記録機能を実行
    const audit_log = recordModificationAuditLog({
      modification_id: modification_id,
      assessor_id: assessor_id,
      pre_accuracy_percent: pre_accuracy,
      post_accuracy_percent: post_accuracy,
      pre_record_timestamp: pre_timestamp.toISOString(),
      post_record_timestamp: post_timestamp.toISOString(),
      modification_reason: modification_reason,
      applied_logic_id: applied_logic_id,
    });

    // Assert: 改善度の計算値が正しいこと
    const expected_improvement_percent = post_accuracy - pre_accuracy; // 85 - 80 = 5
    expect(audit_log.improvement_percent).toBe(expected_improvement_percent);

    // Assert: 修正前精度が正しく記録されていること
    expect(audit_log.pre_accuracy_percent).toBe(pre_accuracy);

    // Assert: 修正後精度が正しく記録されていること
    expect(audit_log.post_accuracy_percent).toBe(post_accuracy);

    // Assert: 改善フラグが'true'として記録されていること
    expect(audit_log.is_improved).toBe(true);

    // Assert: 修正ID、査定員ID、修正理由が正しく記録されていること
    expect(audit_log.modification_id).toBe(modification_id);
    expect(audit_log.assessor_id).toBe(assessor_id);
    expect(audit_log.modification_reason).toBe(modification_reason);

    // Assert: 適用ロジックIDが正しく記録されていること
    expect(audit_log.applied_logic_id).toBe(applied_logic_id);

    // Assert: ログレコードが記録されたタイムスタンプが存在すること
    expect(audit_log.recorded_timestamp).toBeDefined();
    expect(typeof audit_log.recorded_timestamp).toBe('string');
  });
});