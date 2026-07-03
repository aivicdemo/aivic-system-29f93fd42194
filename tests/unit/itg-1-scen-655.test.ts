import { validateReportGenerationParameters } from '../../src/logic/it-1781935279444-1-1-1';

describe('営業データ項目のメタデータ管理機能 - レポート生成パラメータ妥当性検証', () => {
  test('SCEN-655: レポート生成パラメータが営業データと契約条件に整合している場合、検証が成功する', () => {
    // テストデータ: 営業データ
    const salesData = [
      {
        sales_amount: 100000,
        product_code: 'PRD001',
        sales_date: '2024-01-15'
      },
      {
        sales_amount: 250000,
        product_code: 'PRD002',
        sales_date: '2024-02-10'
      },
      {
        sales_amount: 150000,
        product_code: 'PRD001',
        sales_date: '2024-03-05'
      }
    ];

    // テストデータ: 契約条件
    const contractConditions = {
      billing_cycle: 'monthly',
      discount_rate: 5,
      max_discount_rate: 10,
      min_discount_rate: 0,
      allowed_data_types: ['sales_amount', 'product_code', 'sales_date'],
      allowed_report_formats: ['CSV', 'JSON', 'PDF'],
      payment_terms: 30,
      min_sales_date: '2024-01-01',
      max_sales_date: '2024-03-31'
    };

    // レポート生成パラメータ（営業データと契約条件に整合）
    const reportParameters = {
      period_start: '2024-01-15',
      period_end: '2024-03-05',
      data_types: ['sales_amount', 'product_code'],
      report_format: 'JSON',
      discount_rate: 5,
      include_fees: true
    };

    // 検証関数を呼び出す
    const validationResult = validateReportGenerationParameters(
      reportParameters,
      salesData,
      contractConditions
    );

    // 期待結果: 検証が成功し、エラーがないこと
    expect(validationResult.is_valid).toBe(true);
    expect(validationResult.errors).toEqual([]);
    expect(validationResult.status).toBe('success');

    // パラメータ内の期間が営業データの日付範囲内であることを確認
    expect(validationResult.period_in_range).toBe(true);

    // パラメータ内のデータ種別が契約で許可されている種別であることを確認
    expect(validationResult.data_types_allowed).toBe(true);

    // パラメータ内の割引率が契約条件の範囲内であることを確認
    expect(validationResult.discount_rate_valid).toBe(true);
    expect(validationResult.discount_rate_within_contract).toBe(true);

    // レポート形式が契約で許可されていることを確認
    expect(validationResult.report_format_allowed).toBe(true);

    // メッセージが返されないことを確認
    expect(validationResult.message).toBe('');

    // レポート生成処理に進むことが可能な状態であることを確認
    expect(validationResult.can_proceed_to_generation).toBe(true);
  });
});