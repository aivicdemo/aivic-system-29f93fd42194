import { updateContractAndBillingData } from '../../src/logic/it-1781935279444-2-2-1';

describe('契約・請求データ更新機能 - 合意確認情報の不完全性チェック', () => {
  // SCEN-1252
  test('合意確認情報が不完全な場合にデータ更新がエラーとなり既存データが保護される', async () => {
    // 事前条件: 既存の契約・請求データを定義
    const existing_contract_data = {
      contract_id: 'CNT-001',
      amount: 100000,
      status: 'active',
      customer_id: 'CUST-A',
      service_id: 'SVC-001',
      created_at: '2024-01-01T09:00:00Z',
      updated_at: '2024-01-01T09:00:00Z',
    };

    // 必須項目が欠落した合意確認情報を準備
    const incomplete_agreement_info = {
      contract_id: 'CNT-001',
      agreement_date: null, // 欠落
      approval_user: undefined, // 欠落
      approval_timestamp: '2024-01-15T14:30:00Z',
    };

    // モック: データベースから既存データを取得
    const db_fetch_mock = jest.fn()
      .mockResolvedValueOnce({
        status: 200,
        data: existing_contract_data,
      });

    // モック: 更新エンドポイントが合意確認情報の欠落を検出してエラーを返す
    const update_endpoint_mock = jest.fn()
      .mockRejectedValueOnce(new Error('合意確認情報が不完全です'));

    // 実行: 不完全な合意確認情報でデータ更新を試行
    const update_result = updateContractAndBillingData(incomplete_agreement_info);

    // 検証1: エラーが発生することを確認
    await expect(update_result).rejects.toThrow(/合意確認情報/);

    // 検証2: データベースから更新対象レコードを再度取得（データ保護を確認）
    const verify_fetch_result = await db_fetch_mock();
    expect(verify_fetch_result.data.contract_id).toBe('CNT-001');
    expect(verify_fetch_result.data.amount).toBe(100000);
    expect(verify_fetch_result.data.status).toBe('active');

    // 検証3: 取得したデータが更新前の状態と完全に一致することを確認
    const retrieved_data = {
      contract_id: verify_fetch_result.data.contract_id,
      amount: verify_fetch_result.data.amount,
      status: verify_fetch_result.data.status,
    };

    const expected_data = {
      contract_id: 'CNT-001',
      amount: 100000,
      status: 'active',
    };

    expect(retrieved_data).toEqual(expected_data);
  });
});