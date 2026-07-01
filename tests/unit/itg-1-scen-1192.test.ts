import { extractSalesActivityData } from '../../src/logic/it-1-2-1';

describe('営業活動データ検索機能', () => {
  // SCEN-1192
  test('指定期間・顧客・営業担当者で営業活動データが正しく抽出される', () => {
    const search_params = {
      start_date: '2024-01-01',
      end_date: '2024-01-31',
      customer_id: 'CUST_A',
      sales_rep_id: 'REP_001',
    };

    const all_activity_records = [
      {
        activity_id: 'ACT_001',
        activity_date: '2024-01-05',
        customer_id: 'CUST_A',
        sales_rep_id: 'REP_001',
        activity_type: 'appointment',
        result_status: 'confirmed',
      },
      {
        activity_id: 'ACT_002',
        activity_date: '2024-01-10',
        customer_id: 'CUST_A',
        sales_rep_id: 'REP_001',
        activity_type: 'negotiation',
        result_status: 'pending',
      },
      {
        activity_id: 'ACT_003',
        activity_date: '2024-01-15',
        customer_id: 'CUST_A',
        sales_rep_id: 'REP_002',
        activity_type: 'appointment',
        result_status: 'confirmed',
      },
      {
        activity_id: 'ACT_004',
        activity_date: '2024-01-20',
        customer_id: 'CUST_B',
        sales_rep_id: 'REP_001',
        activity_type: 'follow_up',
        result_status: 'completed',
      },
      {
        activity_id: 'ACT_005',
        activity_date: '2024-02-05',
        customer_id: 'CUST_A',
        sales_rep_id: 'REP_001',
        activity_type: 'appointment',
        result_status: 'confirmed',
      },
      {
        activity_id: 'ACT_006',
        activity_date: '2023-12-25',
        customer_id: 'CUST_A',
        sales_rep_id: 'REP_001',
        activity_type: 'appointment',
        result_status: 'confirmed',
      },
    ];

    const result = extractSalesActivityData(search_params, all_activity_records);

    // 検索条件に合致するレコードは ACT_001 と ACT_002 の 2 件
    expect(result.total_count).toBe(2);
    expect(result.records.length).toBe(2);

    // 各レコードが正しいフィールドを含む
    expect(result.records[0]).toEqual({
      activity_id: 'ACT_001',
      activity_date: '2024-01-05',
      customer_id: 'CUST_A',
      sales_rep_id: 'REP_001',
      activity_type: 'appointment',
      result_status: 'confirmed',
    });

    expect(result.records[1]).toEqual({
      activity_id: 'ACT_002',
      activity_date: '2024-01-10',
      customer_id: 'CUST_A',
      sales_rep_id: 'REP_001',
      activity_type: 'negotiation',
      result_status: 'pending',
    });

    // すべてのレコードが指定期間内
    result.records.forEach((record) => {
      const record_date = new Date(record.activity_date);
      const start = new Date(search_params.start_date);
      const end = new Date(search_params.end_date);
      expect(record_date.getTime()).toBeGreaterThanOrEqual(start.getTime());
      expect(record_date.getTime()).toBeLessThanOrEqual(end.getTime());
    });

    // すべてのレコードが指定顧客
    result.records.forEach((record) => {
      expect(record.customer_id).toBe(search_params.customer_id);
    });

    // すべてのレコードが指定営業担当者
    result.records.forEach((record) => {
      expect(record.sales_rep_id).toBe(search_params.sales_rep_id);
    });

    // データフォーマット検証
    result.records.forEach((record) => {
      expect(typeof record.activity_id).toBe('string');
      expect(typeof record.activity_date).toBe('string');
      expect(typeof record.customer_id).toBe('string');
      expect(typeof record.sales_rep_id).toBe('string');
      expect(['appointment', 'negotiation', 'follow_up']).toContain(
        record.activity_type,
      );
      expect([
        'confirmed',
        'pending',
        'completed',
        'cancelled',
      ]).toContain(record.result_status);
    });

    // 指定条件に合致しないレコードが除外されていることを確認
    const excluded_ids = result.records.map((r) => r.activity_id);
    expect(excluded_ids).not.toContain('ACT_003');
    expect(excluded_ids).not.toContain('ACT_004');
    expect(excluded_ids).not.toContain('ACT_005');
    expect(excluded_ids).not.toContain('ACT_006');
  });
});