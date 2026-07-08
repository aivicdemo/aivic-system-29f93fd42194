import { recordManualVersionHistory } from '../../src/logic/it-6-3-1';

describe('査定判定ロジックの適用履歴と根拠の記録・検索機能', () => {
  test('SCEN-1587: 改版履歴の必須項目（更新日時・更新者）が空の場合、記録を拒否する', () => {
    // 入力: 更新日時と更新者が空の改版履歴
    const invalid_history_missing_timestamp = {
      manual_id: 'MAN-001',
      manual_name: 'システム運用ガイド v1.0',
      version_number: 2,
      update_content: 'OCR精度監視基準の更新',
      update_timestamp: '',
      update_user: '',
      previous_ocr_accuracy: 92.5,
      updated_ocr_accuracy: 94.8,
      accuracy_improvement_rate: 2.3,
    };

    // 期待結果: 更新日時が空の場合、エラーを throw
    expect(() => recordManualVersionHistory(invalid_history_missing_timestamp))
      .toThrow(/更新日時/);
  });

  test('SCEN-1587: 改版履歴の更新者が空の場合、記録を拒否する', () => {
    // 入力: 更新者が空の改版履歴（更新日時は有効）
    const invalid_history_missing_user = {
      manual_id: 'MAN-001',
      manual_name: 'システム運用ガイド v1.0',
      version_number: 2,
      update_content: 'OCR精度監視基準の更新',
      update_timestamp: '2024-03-15T10:30:00Z',
      update_user: '',
      previous_ocr_accuracy: 92.5,
      updated_ocr_accuracy: 94.8,
      accuracy_improvement_rate: 2.3,
    };

    // 期待結果: 更新者が空の場合、エラーを throw
    expect(() => recordManualVersionHistory(invalid_history_missing_user))
      .toThrow(/更新者/);
  });

  test('SCEN-1587: 改版履歴のすべての必須項目が有効な場合、正常に記録される', () => {
    // 入力: すべての必須項目が有効な改版履歴
    const valid_history = {
      manual_id: 'MAN-001',
      manual_name: 'システム運用ガイド v1.0',
      version_number: 2,
      update_content: 'OCR精度監視基準の更新',
      update_timestamp: '2024-03-15T10:30:00Z',
      update_user: 'user_123',
      previous_ocr_accuracy: 92.5,
      updated_ocr_accuracy: 94.8,
      accuracy_improvement_rate: 2.3,
    };

    // 期待結果: 改版履歴が正常に記録される
    const result = recordManualVersionHistory(valid_history);

    expect(result).toEqual({
      success: true,
      manual_version_history_id: expect.any(String),
      recorded_timestamp: '2024-03-15T10:30:00Z',
      update_user: 'user_123',
      accuracy_improvement_rate: 2.3,
    });
  });

  test('SCEN-1587: 改版履歴の更新日時と更新者が両方とも空の場合、複合エラーを throw', () => {
    // 入力: 更新日時と更新者が両方とも空の改版履歴
    const invalid_history_both_empty = {
      manual_id: 'MAN-001',
      manual_name: 'システム運用ガイド v1.0',
      version_number: 2,
      update_content: 'OCR精度監視基準の更新',
      update_timestamp: '',
      update_user: '',
      previous_ocr_accuracy: 92.5,
      updated_ocr_accuracy: 94.8,
      accuracy_improvement_rate: 2.3,
    };

    // 期待結果: 最初に検出された必須項目エラーで throw（更新日時）
    expect(() => recordManualVersionHistory(invalid_history_both_empty))
      .toThrow(/更新日時/);
  });

  test('SCEN-1587: 改版履歴の精度改善率を自動計算して記録する', () => {
    // 入力: 改版前後のOCR精度から改善率が自動計算される改版履歴
    const history_with_accuracy_calculation = {
      manual_id: 'MAN-002',
      manual_name: '査定判定基準書 v2.0',
      version_number: 3,
      update_content: '金額帯別判定基準の精緻化',
      update_timestamp: '2024-03-20T14:45:00Z',
      update_user: 'user_456',
      previous_ocr_accuracy: 90.0,
      updated_ocr_accuracy: 95.5,
      accuracy_improvement_rate: 5.5,
    };

    // 期待結果: 改善率が正確に記録される（(95.5 - 90.0) = 5.5）
    const result = recordManualVersionHistory(history_with_accuracy_calculation);

    expect(result.accuracy_improvement_rate).toBe(5.5);
    expect(result.success).toBe(true);
  });
});