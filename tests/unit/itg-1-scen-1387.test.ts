import { generateMonthlySummary } from '../../src/logic/it-1-br-1781935279444-1-2-1';

describe('月次サマリーテンプレート定義・管理機能', () => {
  // SCEN-1387
  test('月次サマリーテンプレートに定義された項目と計算ロジックが正確に集計される', () => {
    // テンプレート定義：5項目、計算ロジック付き
    const templateItems = [
      { itemId: 'total_sales', itemName: '売上合計', calculation: 'SUM', fieldName: 'sales_amount' },
      { itemId: 'sales_count', itemName: '売上件数', calculation: 'COUNT', fieldName: 'sales_amount' },
      { itemId: 'avg_sales', itemName: '平均売上金額', calculation: 'AVG', fieldName: 'sales_amount' },
      { itemId: 'total_discount', itemName: '割引額合計', calculation: 'SUM', fieldName: 'discount_amount' },
      { itemId: 'total_fee', itemName: '手数料合計', calculation: 'SUM', fieldName: 'fee_amount' }
    ];

    const template = {
      templateId: 'tpl_20240115_001',
      templateName: 'テスト用月次サマリーテンプレート',
      items: templateItems,
      isActive: true,
      createdAt: new Date('2024-01-01T09:00:00Z'),
      updatedAt: new Date('2024-01-01T09:00:00Z')
    };

    // テスト期間の営業データ（5件以上）
    const salesData = [
      { sales_amount: 100000, discount_amount: 5000, fee_amount: 3000, record_date: '2024-01-05' },
      { sales_amount: 150000, discount_amount: 7500, fee_amount: 4500, record_date: '2024-01-10' },
      { sales_amount: 120000, discount_amount: 6000, fee_amount: 3600, record_date: '2024-01-15' },
      { sales_amount: 180000, discount_amount: 9000, fee_amount: 5400, record_date: '2024-01-20' },
      { sales_amount: 200000, discount_amount: 10000, fee_amount: 6000, record_date: '2024-01-25' }
    ];

    // 手動計算による期待値
    const expectedTotalSales = 100000 + 150000 + 120000 + 180000 + 200000; // 750000
    const expectedSalesCount = 5;
    const expectedAvgSales = expectedTotalSales / expectedSalesCount; // 150000
    const expectedTotalDiscount = 5000 + 7500 + 6000 + 9000 + 10000; // 37500
    const expectedTotalFee = 3000 + 4500 + 3600 + 5400 + 6000; // 22500

    // 月次サマリー生成実行
    const generatedSummary = generateMonthlySummary({
      template: template,
      salesData: salesData,
      summaryPeriod: '2024-01'
    });

    // 生成されたサマリーの各項目の集計値を確認
    expect(generatedSummary).toBeDefined();
    expect(generatedSummary.summaryId).toBeDefined();
    expect(generatedSummary.templateId).toBe('tpl_20240115_001');
    expect(generatedSummary.summaryPeriod).toBe('2024-01');
    expect(generatedSummary.aggregatedValues).toBeDefined();

    // 各計算ロジックが期待通りに動作していることを検証
    expect(generatedSummary.aggregatedValues.total_sales).toBe(expectedTotalSales); // 750000
    expect(generatedSummary.aggregatedValues.sales_count).toBe(expectedSalesCount); // 5
    expect(generatedSummary.aggregatedValues.avg_sales).toBe(expectedAvgSales); // 150000
    expect(generatedSummary.aggregatedValues.total_discount).toBe(expectedTotalDiscount); // 37500
    expect(generatedSummary.aggregatedValues.total_fee).toBe(expectedTotalFee); // 22500

    // テンプレート変更後：計算ロジックを変更（割引額合計の計算方法を変更）
    const updatedTemplateItems = [
      { itemId: 'total_sales', itemName: '売上合計', calculation: 'SUM', fieldName: 'sales_amount' },
      { itemId: 'sales_count', itemName: '売上件数', calculation: 'COUNT', fieldName: 'sales_amount' },
      { itemId: 'avg_sales', itemName: '平均売上金額', calculation: 'AVG', fieldName: 'sales_amount' },
      { itemId: 'total_discount', itemName: '割引額合計', calculation: 'MAX', fieldName: 'discount_amount' }, // 変更: SUM → MAX
      { itemId: 'total_fee', itemName: '手数料合計', calculation: 'SUM', fieldName: 'fee_amount' }
    ];

    const updatedTemplate = {
      templateId: 'tpl_20240115_001',
      templateName: 'テスト用月次サマリーテンプレート',
      items: updatedTemplateItems,
      isActive: true,
      createdAt: new Date('2024-01-01T09:00:00Z'),
      updatedAt: new Date('2024-01-15T14:30:00Z')
    };

    // 変更後のロジックが反映される期待値
    const expectedMaxDiscount = 10000; // MAX: 5000, 7500, 6000, 9000, 10000 中の最大値

    // 変更後のテンプレートを使用して再度サマリーを生成
    const regeneratedSummary = generateMonthlySummary({
      template: updatedTemplate,
      salesData: salesData,
      summaryPeriod: '2024-01'
    });

    // 変更後のロジックが正しく反映されていることを確認
    expect(regeneratedSummary.aggregatedValues.total_sales).toBe(expectedTotalSales); // 750000 (変更なし)
    expect(regeneratedSummary.aggregatedValues.sales_count).toBe(expectedSalesCount); // 5 (変更なし)
    expect(regeneratedSummary.aggregatedValues.avg_sales).toBe(expectedAvgSales); // 150000 (変更なし)
    expect(regeneratedSummary.aggregatedValues.total_discount).toBe(expectedMaxDiscount); // 10000 (MAX に変更)
    expect(regeneratedSummary.aggregatedValues.total_fee).toBe(expectedTotalFee); // 22500 (変更なし)

    // テンプレート更新日時が反映されていることを確認
    expect(regeneratedSummary.templateUpdatedAt).toEqual(new Date('2024-01-15T14:30:00Z'));
  });
});