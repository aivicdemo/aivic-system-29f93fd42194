import { recordNegotiationResult } from '../../src/logic/it-6-2-2-2';

describe('査定員別の判定精度・乖離パターン分析ダッシュボード', () => {
  test('SCEN-1038: 交渉結果学習データ蓄積機能 - 合意理由が最大文字数（5000文字）の交渉結果も正常に蓄積され学習データとして認識される', () => {
    // Arrange
    const agreement_reason_5000_chars = 'A'.repeat(5000);
    const negotiation_result = {
      estimate_id: 'EST-2024-001',
      original_amount: 1000000,
      agreed_amount: 950000,
      agreement_reason: agreement_reason_5000_chars,
      negotiated_at: '2024-01-15T14:30:00Z',
      appraiser_id: 'APP-001',
      contractor_name: 'Contractor A Inc.',
    };

    // Act
    const result = recordNegotiationResult(negotiation_result);

    // Assert
    expect(result).toEqual({
      success: true,
      negotiation_id: expect.any(String),
      stored_reason_char_count: 5000,
      is_learning_data: true,
      database_status: 'stored',
      learning_data_status: 'recognized',
      validation_errors: [],
    });

    // 蓄積されたデータが学習データとして正常に認識されていることを確認
    expect(result.is_learning_data).toBe(true);

    // 文字数が正確に保持されていることを確認
    expect(result.stored_reason_char_count).toBe(5000);

    // データベースに正確に格納されていることを確認
    expect(result.database_status).toBe('stored');

    // 学習データとして正常に処理されていることを確認
    expect(result.learning_data_status).toBe('recognized');

    // エラーがないことを確認
    expect(result.validation_errors).toEqual([]);
  });
});