import { extractContractDifferences } from '../../src/logic/it-1781935279444-1-1-1';

describe('営業データ項目のメタデータ管理機能', () => {
  test('SCEN-627: 契約変更履歴・請求パターン比較分析機能 - 契約変更前後の契約条件と過去請求データから差分が正確に抽出・可視化される', () => {
    // 【準備】テスト用の契約データ（変更前）
    const previousContract = {
      contract_id: 'CONT-2024-001',
      customer_id: 'CUST-A001',
      service_id: 'SVC-BASIC',
      effective_date: '2024-01-01',
      base_amount: 100000,
      unit_price: 10000,
      discount_rate: 0.1,
      billing_cycle: 'monthly',
      min_billing_amount: 50000,
      max_billing_amount: 200000,
      applicable_period_start: '2024-01-01',
      applicable_period_end: '2024-12-31',
    };

    // 【準備】テスト用の契約データ（変更後）
    const currentContract = {
      contract_id: 'CONT-2024-001',
      customer_id: 'CUST-A001',
      service_id: 'SVC-BASIC',
      effective_date: '2024-07-01',
      base_amount: 120000,
      unit_price: 12000,
      discount_rate: 0.15,
      billing_cycle: 'monthly',
      min_billing_amount: 60000,
      max_billing_amount: 250000,
      applicable_period_start: '2024-07-01',
      applicable_period_end: '2025-06-30',
    };

    // 【準備】過去請求データセット
    const pastBillingData = [
      {
        billing_id: 'BILL-2024-01',
        contract_id: 'CONT-2024-001',
        billing_period: '2024-01',
        billed_amount: 90000,
        actual_performance: 9,
        billing_date: '2024-02-01',
      },
      {
        billing_id: 'BILL-2024-02',
        contract_id: 'CONT-2024-001',
        billing_period: '2024-02',
        billed_amount: 95000,
        actual_performance: 9.5,
        billing_date: '2024-03-01',
      },
      {
        billing_id: 'BILL-2024-03',
        contract_id: 'CONT-2024-001',
        billing_period: '2024-06',
        billed_amount: 100000,
        actual_performance: 10,
        billing_date: '2024-07-01',
      },
      {
        billing_id: 'BILL-2024-04',
        contract_id: 'CONT-2024-001',
        billing_period: '2024-07',
        billed_amount: 108000,
        actual_performance: 9,
        billing_date: '2024-08-01',
      },
    ];

    // 【実行】比較分析機能を実行
    const result = extractContractDifferences(
      previousContract,
      currentContract,
      pastBillingData
    );

    // 【検証】抽出された差分情報が存在すること
    expect(result).toBeDefined();
    expect(result.contract_id).toBe('CONT-2024-001');
    expect(result.customer_id).toBe('CUST-A001');

    // 【検証】差分として抽出された契約条件項目を検証
    expect(result.differences).toBeDefined();
    expect(Array.isArray(result.differences)).toBe(true);
    expect(result.differences.length).toBeGreaterThan(0);

    // 【検証】base_amount差分の詳細内容
    const baseAmountDiff = result.differences.find(
      (d: any) => d.field_name === 'base_amount'
    );
    expect(baseAmountDiff).toBeDefined();
    expect(baseAmountDiff.previous_value).toBe(100000);
    expect(baseAmountDiff.current_value).toBe(120000);
    expect(baseAmountDiff.change_amount).toBe(20000);
    expect(baseAmountDiff.change_percentage).toBeCloseTo(0.2, 5);
    expect(baseAmountDiff.changed_date).toBe('2024-07-01');

    // 【検証】unit_price差分の詳細内容
    const unitPriceDiff = result.differences.find(
      (d: any) => d.field_name === 'unit_price'
    );
    expect(unitPriceDiff).toBeDefined();
    expect(unitPriceDiff.previous_value).toBe(10000);
    expect(unitPriceDiff.current_value).toBe(12000);
    expect(unitPriceDiff.change_amount).toBe(2000);
    expect(unitPriceDiff.change_percentage).toBeCloseTo(0.2, 5);

    // 【検証】discount_rate差分の詳細内容
    const discountRateDiff = result.differences.find(
      (d: any) => d.field_name === 'discount_rate'
    );
    expect(discountRateDiff).toBeDefined();
    expect(discountRateDiff.previous_value).toBe(0.1);
    expect(discountRateDiff.current_value).toBe(0.15);
    expect(discountRateDiff.change_amount).toBeCloseTo(0.05, 5);

    // 【検証】min_billing_amount差分
    const minBillingDiff = result.differences.find(
      (d: any) => d.field_name === 'min_billing_amount'
    );
    expect(minBillingDiff).toBeDefined();
    expect(minBillingDiff.previous_value).toBe(50000);
    expect(minBillingDiff.current_value).toBe(60000);

    // 【検証】max_billing_amount差分
    const maxBillingDiff = result.differences.find(
      (d: any) => d.field_name === 'max_billing_amount'
    );
    expect(maxBillingDiff).toBeDefined();
    expect(maxBillingDiff.previous_value).toBe(200000);
    expect(maxBillingDiff.current_value).toBe(250000);

    // 【検証】applicable_period_end差分
    const periodEndDiff = result.differences.find(
      (d: any) => d.field_name === 'applicable_period_end'
    );
    expect(periodEndDiff).toBeDefined();
    expect(periodEndDiff.previous_value).toBe('2024-12-31');
    expect(periodEndDiff.current_value).toBe('2025-06-30');

    // 【検証】過去請求データとの紐付け結果を確認
    expect(result.impacted_billing_records).toBeDefined();
    expect(Array.isArray(result.impacted_billing_records)).toBe(true);
    // 変更前ピリオド: 2024-01, 2024-02, 2024-06 (3件)
    // 変更後ピリオド: 2024-07 (1件)
    expect(result.impacted_billing_records.length).toBe(4);

    // 【検証】変更前期間の請求データが紐付けられていること
    const preChangeRecords = result.impacted_billing_records.filter(
      (r: any) => r.impact_period === 'pre_change'
    );
    expect(preChangeRecords.length).toBe(3);
    expect(
      preChangeRecords.some((r: any) => r.billing_id === 'BILL-2024-01')
    ).toBe(true);

    // 【検証】変更後期間の請求データが紐付けられていること
    const postChangeRecords = result.impacted_billing_records.filter(
      (r: any) => r.impact_period === 'post_change'
    );
    expect(postChangeRecords.length).toBe(1);
    expect(postChangeRecords[0].billing_id).toBe('BILL-2024-04');

    // 【検証】請求額への影響計算
    expect(result.billing_impact_analysis).toBeDefined();
    expect(result.billing_impact_analysis.pre_change_avg_amount).toBe(
      (90000 + 95000 + 100000) / 3
    );
    expect(result.billing_impact_analysis.post_change_avg_amount).toBe(108000);
    // 平均額の変化 = (108000 - 95000) / 95000 ≈ 0.137 (13.7%)
    expect(result.billing_impact_analysis.avg_amount_change_rate).toBeCloseTo(
      0.137,
      2
    );

    // 【検証】視覚化用の差分サマリー
    expect(result.visualization_summary).toBeDefined();
    expect(result.visualization_summary.total_changed_fields).toBe(7);
    expect(result.visualization_summary.highlight_fields).toBeDefined();
    expect(Array.isArray(result.visualization_summary.highlight_fields)).toBe(
      true
    );
    // ハイライト対象フィールド: base_amount, unit_price, discount_rate, min_billing_amount, max_billing_amount
    expect(
      result.visualization_summary.highlight_fields.includes('base_amount')
    ).toBe(true);
    expect(
      result.visualization_summary.highlight_fields.includes('unit_price')
    ).toBe(true);

    // 【検証】複数項目の差分が正確に抽出されていることを確認
    const numericDifferences = result.differences.filter(
      (d: any) => d.is_numeric_change === true
    );
    expect(numericDifferences.length).toBeGreaterThanOrEqual(6);

    // 【検証】差分データのエクスポート用フォーマット
    expect(result.export_format).toBeDefined();
    expect(result.export_format.csv_data).toBeDefined();
    expect(typeof result.export_format.csv_data).toBe('string');
    // CSVヘッダー確認
    expect(
      result.export_format.csv_data.includes('field_name,previous_value,current_value')
    ).toBe(true);

    // 【検証】JSON形式エクスポート
    expect(result.export_format.json_data).toBeDefined();
    expect(Array.isArray(result.export_format.json_data)).toBe(true);

    // 【検証】可視化用のレポートが生成されていること
    expect(result.visual_report).toBeDefined();
    expect(result.visual_report.title).toBe(
      'Contract Comparison Report - CONT-2024-001'
    );
    expect(result.visual_report.comparison_date).toBe('2024-07-01');
    expect(result.visual_report.summary_html).toBeDefined();

    // 【検証】結果のメタデータ
    expect(result.generated_at).toBeDefined();
    expect(result.analysis_status).toBe('completed');
    expect(result.total_differences_found).toBe(7);
  });
});