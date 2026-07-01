import { searchSalesActivities } from '../../src/logic/it-1781935279444-1-1-1';

describe('営業活動データ検索・抽出・検証', () => {
  // SCEN-1183
  test('指定期間・顧客・営業担当者で営業活動データが正確に抽出される', () => {
    // 前提: テストシステムにログイン済み、営業活動データが営業システムに記録されている
    const search_params = {
      period_start: '2024-01-01',
      period_end: '2024-03-31',
      customer_id: 'CUST_A001',
      customer_name: 'テスト顧客A',
      sales_rep_id: 'REP_001',
      sales_rep_name: 'テスト営業担当者001'
    };

    // 検索実行
    const result = searchSalesActivities(search_params);

    // 期待結果: 指定条件に一致する営業活動データが抽出される
    expect(result).toBeDefined();
    expect(Array.isArray(result.records)).toBe(true);

    // 検索結果の件数確認
    expect(result.records.length).toBeGreaterThan(0);

    // 各レコードが検索条件に完全に一致することを検証
    result.records.forEach((record) => {
      // 日付が指定期間内であること
      const activity_date = new Date(record.activity_date);
      const period_start_date = new Date(search_params.period_start);
      const period_end_date = new Date(search_params.period_end);

      expect(activity_date.getTime()).toBeGreaterThanOrEqual(period_start_date.getTime());
      expect(activity_date.getTime()).toBeLessThanOrEqual(
        period_end_date.getTime() + 24 * 60 * 60 * 1000 - 1
      );

      // 顧客が指定された顧客と一致していること
      expect(record.customer_id).toBe(search_params.customer_id);
      expect(record.customer_name).toBe(search_params.customer_name);

      // 営業担当者が指定された担当者と一致していること
      expect(record.sales_rep_id).toBe(search_params.sales_rep_id);
      expect(record.sales_rep_name).toBe(search_params.sales_rep_name);

      // レコード基本項目の存在確認
      expect(record.activity_id).toBeDefined();
      expect(typeof record.activity_id).toBe('string');
      expect(record.activity_type).toBeDefined();
      expect(['アポ', '成約', '顧客反応'].includes(record.activity_type)).toBe(true);
    });

    // エクスポート機能の検証
    const export_result = result.export_data;
    expect(export_result).toBeDefined();
    expect(export_result.format).toBe('csv');
    expect(export_result.filename).toBe(
      `sales_activities_${search_params.period_start}_to_${search_params.period_end}.csv`
    );
    expect(export_result.file_content).toBeDefined();
    expect(typeof export_result.file_content).toBe('string');

    // エクスポートされたCSVファイルのデータ整合性確認
    const csv_lines = export_result.file_content.trim().split('\n');
    expect(csv_lines.length).toBeGreaterThan(1); // ヘッダー + データ行

    // CSVヘッダーの確認
    const csv_header = csv_lines[0];
    expect(csv_header).toContain('activity_id');
    expect(csv_header).toContain('activity_date');
    expect(csv_header).toContain('customer_id');
    expect(csv_header).toContain('customer_name');
    expect(csv_header).toContain('sales_rep_id');
    expect(csv_header).toContain('sales_rep_name');

    // CSVデータ行数が検索結果と一致することを確認
    const csv_data_line_count = csv_lines.length - 1;
    expect(csv_data_line_count).toBe(result.records.length);

    // CSVに含まれるデータが検索結果と一致することを確認
    for (let i = 1; i < csv_lines.length; i++) {
      const csv_row = csv_lines[i];
      const record = result.records[i - 1];

      expect(csv_row).toContain(record.activity_id);
      expect(csv_row).toContain(record.customer_id);
      expect(csv_row).toContain(record.sales_rep_id);
    }
  });
});