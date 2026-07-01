import { validateContractCheckList } from '../../src/logic/it-1-1-1';

describe('営業成果データの自動検証ルール定義と異常検出機能', () => {
  // SCEN-1104: [error] 契約書管理チェックリスト検証 - 契約書の登録内容に誤りがある場合、不合格判定となること
  test('契約書の登録内容に誤りがある場合、チェックリスト検証により不合格判定となりエラー詳細が返されること', () => {
    // ハッピーパス：複数の誤りを含む契約書データ
    const invalid_contract_data_customer_format = {
      customer_id: 'C001',
      customer_name: '123企業',  // 不正な形式（数字で開始）
      contract_amount: -50000,    // 負の値
      contract_start_date: '2024-01-15',
      contract_end_date: '2024-01-01',  // 逆順（終了日が開始日より前）
      service_type: 'standard'
    };

    const invalid_contract_data_amount = {
      customer_id: 'C002',
      customer_name: '有効な企業名',
      contract_amount: -100000,   // 負の値
      contract_start_date: '2024-02-01',
      contract_end_date: '2024-02-28',
      service_type: 'premium'
    };

    const invalid_contract_data_date_order = {
      customer_id: 'C003',
      customer_name: '別の企業',
      contract_amount: 75000,
      contract_start_date: '2024-03-31',
      contract_end_date: '2024-03-01',  // 逆順
      service_type: 'basic'
    };

    // 顧客名形式エラーテスト
    const result_customer_name_error = validateContractCheckList(invalid_contract_data_customer_format);
    expect(result_customer_name_error.is_valid).toBe(false);
    expect(result_customer_name_error.errors).toContainEqual(
      expect.objectContaining({
        field: 'customer_name',
        message: expect.stringMatching(/顧客名/)
      })
    );

    // 金額が負の値の場合エラーテスト
    const result_amount_error = validateContractCheckList(invalid_contract_data_amount);
    expect(result_amount_error.is_valid).toBe(false);
    expect(result_amount_error.errors).toContainEqual(
      expect.objectContaining({
        field: 'contract_amount',
        message: expect.stringMatching(/金額/)
      })
    );

    // 契約期間が逆順の場合エラーテスト
    const result_date_order_error = validateContractCheckList(invalid_contract_data_date_order);
    expect(result_date_order_error.is_valid).toBe(false);
    expect(result_date_order_error.errors).toContainEqual(
      expect.objectContaining({
        field: 'contract_date_range',
        message: expect.stringMatching(/契約期間/)
      })
    );

    // エラーメッセージと詳細情報が含まれることを確認
    expect(result_customer_name_error.status).toBe('불합격');
    expect(result_customer_name_error.errors.length).toBeGreaterThan(0);
    expect(result_amount_error.status).toBe('불합격');
    expect(result_date_order_error.status).toBe('불합격');
  });
});