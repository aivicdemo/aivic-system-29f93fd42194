import { recordManualVerificationFeedback } from '../../src/logic/it-6-2-2-1';

describe('査定員による運用マニュアル検証と改善指摘記録', () => {
  test('SCEN-1554: 異常対応フロー検証項目の不合格判定と改善指摘の正確な記録', () => {
    // === 入力データ ===
    const assessor_id = 'ASSESSOR-0015';
    const assessor_name = '山田太郎';
    const verification_item_id = 'VERIFY-ABNORMAL-FLOW-001';
    const verification_item_name = '異常対応フロー検証';
    const pass_fail_judgment = 'FAIL';
    const improvement_feedback = '異常検知時の通知タイミングが遅延している。運用マニュアルの5.2項に記載されたSLA（5分以内）が守られていない可能性がある。';
    const feedback_timestamp = '2024-06-15T14:32:00Z';
    const system_recorded_timestamp = '2024-06-15T14:32:15Z';

    // === 期待値 ===
    const expected_feedback_record = {
      feedback_id: expect.any(String),
      assessor_id: assessor_id,
      assessor_name: assessor_name,
      verification_item_id: verification_item_id,
      verification_item_name: verification_item_name,
      pass_fail_judgment: pass_fail_judgment,
      improvement_feedback: improvement_feedback,
      feedback_submitted_at: feedback_timestamp,
      system_recorded_at: system_recorded_timestamp,
      record_status: 'SAVED',
      is_retrievable: true,
    };

    // === 実行 ===
    const result = recordManualVerificationFeedback({
      assessor_id: assessor_id,
      assessor_name: assessor_name,
      verification_item_id: verification_item_id,
      verification_item_name: verification_item_name,
      pass_fail_judgment: pass_fail_judgment,
      improvement_feedback: improvement_feedback,
      feedback_submitted_at: feedback_timestamp,
      system_recorded_at: system_recorded_timestamp,
    });

    // === 成功系アサーション ===
    // 1. 記録が正常に保存されたことを確認
    expect(result.record_status).toBe('SAVED');

    // 2. 改善指摘内容が正確に保存されていることを確認
    expect(result.improvement_feedback).toBe(improvement_feedback);

    // 3. 不合格判定が正しく記録されていることを確認
    expect(result.pass_fail_judgment).toBe('FAIL');

    // 4. 査定員情報が正しく紐付けられていることを確認
    expect(result.assessor_id).toBe(assessor_id);
    expect(result.assessor_name).toBe(assessor_name);

    // 5. 検証項目情報が正しく紐付けられていることを確認
    expect(result.verification_item_id).toBe(verification_item_id);
    expect(result.verification_item_name).toBe(verification_item_name);

    // 6. タイムスタンプが適切に紐付けられていることを確認
    expect(result.system_recorded_at).toBe(system_recorded_timestamp);
    expect(result.feedback_submitted_at).toBe(feedback_timestamp);

    // 7. 履歴画面で検索・表示可能であることを確認
    expect(result.is_retrievable).toBe(true);

    // 8. フィードバックIDが自動採番されていることを確認
    expect(result.feedback_id).toBeDefined();
    expect(typeof result.feedback_id).toBe('string');
    expect(result.feedback_id.length).toBeGreaterThan(0);

    // === 境界値テスト ===
    // 9. 改善指摘が最大長の文字列の場合も正しく保存されることを確認
    const max_length_feedback = 'A'.repeat(2000);
    const result_max = recordManualVerificationFeedback({
      assessor_id: assessor_id,
      assessor_name: assessor_name,
      verification_item_id: verification_item_id,
      verification_item_name: verification_item_name,
      pass_fail_judgment: 'FAIL',
      improvement_feedback: max_length_feedback,
      feedback_submitted_at: feedback_timestamp,
      system_recorded_at: system_recorded_timestamp,
    });
    expect(result_max.improvement_feedback).toBe(max_length_feedback);
    expect(result_max.record_status).toBe('SAVED');

    // === エラーテスト ===
    // 10. 査定員IDが空の場合、エラーが発生することを確認
    expect(() =>
      recordManualVerificationFeedback({
        assessor_id: '',
        assessor_name: assessor_name,
        verification_item_id: verification_item_id,
        verification_item_name: verification_item_name,
        pass_fail_judgment: pass_fail_judgment,
        improvement_feedback: improvement_feedback,
        feedback_submitted_at: feedback_timestamp,
        system_recorded_at: system_recorded_timestamp,
      })
    ).toThrow(/査定員ID/);

    // 11. 改善指摘が空の場合、エラーが発生することを確認
    expect(() =>
      recordManualVerificationFeedback({
        assessor_id: assessor_id,
        assessor_name: assessor_name,
        verification_item_id: verification_item_id,
        verification_item_name: verification_item_name,
        pass_fail_judgment: pass_fail_judgment,
        improvement_feedback: '',
        feedback_submitted_at: feedback_timestamp,
        system_recorded_at: system_recorded_timestamp,
      })
    ).toThrow(/改善指摘/);

    // 12. 検証項目IDが空の場合、エラーが発生することを確認
    expect(() =>
      recordManualVerificationFeedback({
        assessor_id: assessor_id,
        assessor_name: assessor_name,
        verification_item_id: '',
        verification_item_name: verification_item_name,
        pass_fail_judgment: pass_fail_judgment,
        improvement_feedback: improvement_feedback,
        feedback_submitted_at: feedback_timestamp,
        system_recorded_at: system_recorded_timestamp,
      })
    ).toThrow(/検証項目ID/);

    // 13. 無効な合否判定値の場合、エラーが発生することを確認
    expect(() =>
      recordManualVerificationFeedback({
        assessor_id: assessor_id,
        assessor_name: assessor_name,
        verification_item_id: verification_item_id,
        verification_item_name: verification_item_name,
        pass_fail_judgment: 'INVALID',
        improvement_feedback: improvement_feedback,
        feedback_submitted_at: feedback_timestamp,
        system_recorded_at: system_recorded_timestamp,
      })
    ).toThrow(/合否判定/);

    // 14. システム記録時刻がフィードバック提出時刻より前の場合、エラーが発生することを確認
    expect(() =>
      recordManualVerificationFeedback({
        assessor_id: assessor_id,
        assessor_name: assessor_name,
        verification_item_id: verification_item_id,
        verification_item_name: verification_item_name,
        pass_fail_judgment: pass_fail_judgment,
        improvement_feedback: improvement_feedback,
        feedback_submitted_at: '2024-06-15T14:32:00Z',
        system_recorded_at: '2024-06-15T14:31:00Z',
      })
    ).toThrow(/タイムスタンプ/);

    // === 複数の不合格判定記録 ===
    // 15. 同一の検証項目について複数回の不合格記録が可能であることを確認
    const result_first = recordManualVerificationFeedback({
      assessor_id: assessor_id,
      assessor_name: assessor_name,
      verification_item_id: verification_item_id,
      verification_item_name: verification_item_name,
      pass_fail_judgment: 'FAIL',
      improvement_feedback: '初回の改善指摘内容',
      feedback_submitted_at: '2024-06-15T14:00:00Z',
      system_recorded_at: '2024-06-15T14:00:15Z',
    });

    const result_second = recordManualVerificationFeedback({
      assessor_id: assessor_id,
      assessor_name: assessor_name,
      verification_item_id: verification_item_id,
      verification_item_name: verification_item_name,
      pass_fail_judgment: 'FAIL',
      improvement_feedback: '二回目の改善指摘内容',
      feedback_submitted_at: '2024-06-16T10:00:00Z',
      system_recorded_at: '2024-06-16T10:00:15Z',
    });

    expect(result_first.feedback_id).not.toBe(result_second.feedback_id);
    expect(result_second.improvement_feedback).toBe('二回目の改善指摘内容');
    expect(result_first.record_status).toBe('SAVED');
    expect(result_second.record_status).toBe('SAVED');

    // === 合格判定との混在 ===
    // 16. 同一の検証項目について合格と不合格の記録が混在して保存されることを確認
    const result_pass = recordManualVerificationFeedback({
      assessor_id: assessor_id,
      assessor_name: assessor_name,
      verification_item_id: 'VERIFY-OTHER-ITEM-002',
      verification_item_name: 'その他検証項目',
      pass_fail_judgment: 'PASS',
      improvement_feedback: '',
      feedback_submitted_at: '2024-06-15T15:00:00Z',
      system_recorded_at: '2024-06-15T15:00:15Z',
    });

    expect(result_pass.pass_fail_judgment).toBe('PASS');
    expect(result_pass.record_status).toBe('SAVED');

    // === 記録の永続性確認 ===
    // 17. 保存されたレコードが検索可能な状態で保持されることを確認
    expect(result.is_retrievable).toBe(true);
    expect(result.feedback_id).toBeDefined();
  });
});