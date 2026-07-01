import { mapSalesDataToMonthlySummaryTemplate } from '../../src/logic/it-1-br-1781935279444-1-2-1';

describe('月次サマリーテンプレートの定義・管理機能', () => {
  // SCEN-1147
  test('品質検証完了済みの営業データが標準フォーマット変換設定に従いテンプレート項目に正確にマッピングされる', () => {
    const validated_sales_data = {
      customer_id: 'CUST_001',
      customer_name: 'A株式会社',
      service_id: 'SVC_001',
      service_name: 'コンサルティング',
      appointment_count: 12,
      deal_count: 5,
      customer_reaction: 'positive',
      transaction_date: '2024-01-31',
      amount: 500000,
      billing_status: 'confirmed',
    };

    const template_format_config = {
      customer_id_field: 'customer_id',
      customer_name_field: 'customer_name',
      service_id_field: 'service_id',
      service_name_field: 'service_name',
      appointment_count_field: 'appointment_count',
      deal_count_field: 'deal_count',
      customer_reaction_field: 'customer_reaction',
      transaction_date_format: 'YYYY-MM-DD',
      amount_decimal_places: 0,
      billing_status_field: 'billing_status',
      excluded_fields: [],
    };

    const mapping_result = mapSalesDataToMonthlySummaryTemplate(
      validated_sales_data,
      template_format_config
    );

    // マッピング結果の各テンプレート項目の値を検証
    expect(mapping_result.customer_id).toBe('CUST_001');
    expect(mapping_result.customer_name).toBe('A株式会社');
    expect(mapping_result.service_id).toBe('SVC_001');
    expect(mapping_result.service_name).toBe('コンサルティング');
    
    // 営業データの元の値とマッピング後の値が正確に対応していることを確認
    expect(mapping_result.appointment_count).toBe(12);
    expect(mapping_result.deal_count).toBe(5);
    expect(mapping_result.customer_reaction).toBe('positive');
    
    // 日付フォーマットが標準フォーマットに従っていることを確認
    expect(mapping_result.transaction_date).toBe('2024-01-31');
    
    // データ型の変換が正しく行われていることを検証
    expect(typeof mapping_result.appointment_count).toBe('number');
    expect(typeof mapping_result.deal_count).toBe('number');
    expect(typeof mapping_result.amount).toBe('number');
    
    // 金額フォーマットが正しく行われていることを確認
    expect(mapping_result.amount).toBe(500000);
    
    // 請求ステータスの値が正しく対応していることを確認
    expect(mapping_result.billing_status).toBe('confirmed');
    
    // マッピング対象外の項目が正しく処理されていることを検証
    expect(Object.keys(mapping_result).length).toBe(10);
    expect(mapping_result.excluded_fields).toBeUndefined();
    
    // マッピング結果をテンプレートと照合し完全一致を確認
    expect(mapping_result).toEqual({
      customer_id: 'CUST_001',
      customer_name: 'A株式会社',
      service_id: 'SVC_001',
      service_name: 'コンサルティング',
      appointment_count: 12,
      deal_count: 5,
      customer_reaction: 'positive',
      transaction_date: '2024-01-31',
      amount: 500000,
      billing_status: 'confirmed',
    });
  });
});