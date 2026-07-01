import { generateMonthlySummary } from '../../src/logic/it-1-br-1781935279444-1-2-1';

describe('月次サマリーテンプレートの定義・管理機能', () => {
  test('SCEN-616: 営業データが0件の月度でも月次サマリーが正常に生成される', async () => {
    // Arrange: 対象月度（2024年1月）、営業データ0件の状態
    const target_year = 2024;
    const target_month = 1;
    const target_month_start = new Date('2024-01-01T00:00:00Z');
    const target_month_end = new Date('2024-01-31T23:59:59Z');
    const system_datetime = new Date('2024-02-01T09:00:00Z');

    const input = {
      target_year: target_year,
      target_month: target_month,
      sales_data_count: 0,
      business_transaction_count: 0,
      total_sales_amount: 0,
      period_start: target_month_start,
      period_end: target_month_end,
      system_datetime: system_datetime,
    };

    // Act: 月次サマリー自動生成機能を実行
    const result = await generateMonthlySummary(input);

    // Assert: 生成されたサマリーレコードの検証
    // 1. サマリーレコードが存在すること
    expect(result).toBeDefined();
    expect(result).not.toBeNull();

    // 2. サマリーレコードのID が存在すること
    expect(result.summary_id).toBeDefined();
    expect(typeof result.summary_id).toBe('number');
    expect(result.summary_id).toBeGreaterThan(0);

    // 3. ステータスが「正常完了」(COMPLETED) であること
    expect(result.status).toBe('COMPLETED');

    // 4. 対象年月が正しいこと
    expect(result.year).toBe(2024);
    expect(result.month).toBe(1);

    // 5. 売上金額が0円であること
    expect(result.total_sales_amount).toBe(0);

    // 6. 取引件数が0件であること
    expect(result.transaction_count).toBe(0);

    // 7. 営業データ件数が0件であること
    expect(result.sales_data_count).toBe(0);

    // 8. 生成日時がシステム日時と一致すること
    expect(result.generated_at).toEqual(new Date('2024-02-01T09:00:00Z'));

    // 9. 集計項目がすべて0またはNULLの適切な値で埋まっていること
    expect(result.total_appointments).toBe(0);
    expect(result.total_contracts).toBe(0);
    expect(result.customer_satisfaction_score).toBeNull();
    expect(result.average_transaction_amount).toBe(0);

    // 10. エラーフラグが false であること（エラーなし）
    expect(result.has_error).toBe(false);

    // 11. エラーメッセージが空またはNULLであること
    expect(result.error_message).toBeNull();

    // 12. データ品質ステータスが「正常」(NORMAL) であること
    expect(result.data_quality_status).toBe('NORMAL');

    // 13. 集計対象期間が正しいこと
    expect(result.period_start).toEqual(new Date('2024-01-01T00:00:00Z'));
    expect(result.period_end).toEqual(new Date('2024-01-31T23:59:59Z'));
  });
});