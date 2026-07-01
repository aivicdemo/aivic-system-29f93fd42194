import { describe, test, expect } from '@jest/globals';
import { generateMonthlySummaryReport } from '../../src/logic/it-1-br-1781935279444-1-2-1';

describe('月次サマリーテンプレートの定義・管理機能', () => {
  test('SCEN-1057: 月次レポート作成期間の初日と最終日の境界で、全営業活動データが正確に集計される', () => {
    // テスト対象月: 2024年1月（31日）
    const targetYearMonth = '202401';
    const targetStartDate = new Date('2024-01-01T00:00:00Z');
    const targetEndDate = new Date('2024-01-31T23:59:59Z');

    // 対象月の前日（2023-12-31）のデータ
    const dataBeforeTargetMonth = {
      activity_id: 'act_before_001',
      activity_date: new Date('2023-12-31T18:00:00Z'),
      activity_type: '商談成立',
      customer_id: 'cust_001',
      sales_rep_id: 'rep_001'
    };

    // 対象月の初日（2024-01-01）のデータ
    const dataFirstDay = [
      {
        activity_id: 'act_first_001',
        activity_date: new Date('2024-01-01T09:00:00Z'),
        activity_type: '商談成立',
        customer_id: 'cust_001',
        sales_rep_id: 'rep_001'
      },
      {
        activity_id: 'act_first_002',
        activity_date: new Date('2024-01-01T14:30:00Z'),
        activity_type: '見積作成',
        customer_id: 'cust_002',
        sales_rep_id: 'rep_002'
      },
      {
        activity_id: 'act_first_003',
        activity_date: new Date('2024-01-01T16:45:00Z'),
        activity_type: '顧客訪問',
        customer_id: 'cust_003',
        sales_rep_id: 'rep_001'
      }
    ];

    // 対象月の最終日（2024-01-31）のデータ
    const dataLastDay = [
      {
        activity_id: 'act_last_001',
        activity_date: new Date('2024-01-31T10:15:00Z'),
        activity_type: '商談成立',
        customer_id: 'cust_004',
        sales_rep_id: 'rep_003'
      },
      {
        activity_id: 'act_last_002',
        activity_date: new Date('2024-01-31T13:20:00Z'),
        activity_type: '見積作成',
        customer_id: 'cust_005',
        sales_rep_id: 'rep_002'
      },
      {
        activity_id: 'act_last_003',
        activity_date: new Date('2024-01-31T17:50:00Z'),
        activity_type: '顧客訪問',
        customer_id: 'cust_006',
        sales_rep_id: 'rep_004'
      }
    ];

    // 対象月の翌日（2024-02-01）のデータ
    const dataAfterTargetMonth = {
      activity_id: 'act_after_001',
      activity_date: new Date('2024-02-01T08:30:00Z'),
      activity_type: '商談成立',
      customer_id: 'cust_007',
      sales_rep_id: 'rep_001'
    };

    // テスト対象データセット
    const allActivityData = [
      dataBeforeTargetMonth,
      ...dataFirstDay,
      ...dataLastDay,
      dataAfterTargetMonth
    ];

    // レポート生成実行
    const report = generateMonthlySummaryReport({
      target_year_month: targetYearMonth,
      start_date: targetStartDate,
      end_date: targetEndDate,
      activity_records: allActivityData
    });

    // 検証: 初日のデータがすべて含まれていることを確認
    const firstDayActivityIds = dataFirstDay.map(d => d.activity_id);
    firstDayActivityIds.forEach(id => {
      expect(report.included_activity_ids).toContain(id);
    });

    // 検証: 最終日のデータがすべて含まれていることを確認
    const lastDayActivityIds = dataLastDay.map(d => d.activity_id);
    lastDayActivityIds.forEach(id => {
      expect(report.included_activity_ids).toContain(id);
    });

    // 検証: 集計行数が初日と最終日のデータを合算した件数と一致（6件）
    const expectedRecordCount = dataFirstDay.length + dataLastDay.length;
    expect(report.total_records).toBe(6);
    expect(report.included_activity_ids.length).toBe(expectedRecordCount);

    // 検証: 対象月の前日のデータがレポートに含まれていないことを確認
    expect(report.included_activity_ids).not.toContain(dataBeforeTargetMonth.activity_id);

    // 検証: 対象月の翌日のデータがレポートに含まれていないことを確認
    expect(report.included_activity_ids).not.toContain(dataAfterTargetMonth.activity_id);

    // 検証: 集計データの期間が正確に指定範囲内であることを確認
    report.included_activity_ids.forEach(id => {
      const activity = allActivityData.find(a => a.activity_id === id);
      if (activity) {
        const actDate = new Date(activity.activity_date);
        expect(actDate.getTime()).toBeGreaterThanOrEqual(targetStartDate.getTime());
        expect(actDate.getTime()).toBeLessThanOrEqual(targetEndDate.getTime());
      }
    });

    // 追加検証: 2月（28日）での境界テスト
    const februaryStartDate = new Date('2024-02-01T00:00:00Z');
    const februaryEndDate = new Date('2024-02-29T23:59:59Z'); // 2024年は閏年

    const februaryDataFirstDay = [
      {
        activity_id: 'act_feb_first_001',
        activity_date: new Date('2024-02-01T09:00:00Z'),
        activity_type: '商談成立',
        customer_id: 'cust_008',
        sales_rep_id: 'rep_005'
      }
    ];

    const februaryDataLastDay = [
      {
        activity_id: 'act_feb_last_001',
        activity_date: new Date('2024-02-29T17:00:00Z'),
        activity_type: '見積作成',
        customer_id: 'cust_009',
        sales_rep_id: 'rep_003'
      }
    ];

    const februaryOutOfRangeBefore = {
      activity_id: 'act_jan_last_001',
      activity_date: new Date('2024-01-31T20:00:00Z'),
      activity_type: '顧客訪問',
      customer_id: 'cust_010',
      sales_rep_id: 'rep_001'
    };

    const februaryOutOfRangeAfter = {
      activity_id: 'act_mar_first_001',
      activity_date: new Date('2024-03-01T08:00:00Z'),
      activity_type: '商談成立',
      customer_id: 'cust_011',
      sales_rep_id: 'rep_002'
    };

    const februaryAllData = [
      februaryOutOfRangeBefore,
      ...februaryDataFirstDay,
      ...februaryDataLastDay,
      februaryOutOfRangeAfter
    ];

    const februaryReport = generateMonthlySummaryReport({
      target_year_month: '202402',
      start_date: februaryStartDate,
      end_date: februaryEndDate,
      activity_records: februaryAllData
    });

    // 2月検証: 初日データが含まれていることを確認
    expect(februaryReport.included_activity_ids).toContain('act_feb_first_001');

    // 2月検証: 最終日（2月29日）のデータが含まれていることを確認
    expect(februaryReport.included_activity_ids).toContain('act_feb_last_001');

    // 2月検証: 期間外のデータが除外されていることを確認
    expect(februaryReport.included_activity_ids).not.toContain(februaryOutOfRangeBefore.activity_id);
    expect(februaryReport.included_activity_ids).not.toContain(februaryOutOfRangeAfter.activity_id);

    // 2月検証: 集計件数が期待値（2件）と一致することを確認
    expect(februaryReport.total_records).toBe(2);
    expect(februaryReport.included_activity_ids.length).toBe(2);

    // 追加検証: 3月（31日）での境界テスト
    const marchStartDate = new Date('2024-03-01T00:00:00Z');
    const marchEndDate = new Date('2024-03-31T23:59:59Z');

    const marchDataFirstDay = [
      {
        activity_id: 'act_mar_first_001',
        activity_date: new Date('2024-03-01T10:00:00Z'),
        activity_type: '商談成立',
        customer_id: 'cust_012',
        sales_rep_id: 'rep_006'
      }
    ];

    const marchDataLastDay = [
      {
        activity_id: 'act_mar_last_001',
        activity_date: new Date('2024-03-31T18:00:00Z'),
        activity_type: '見積作成',
        customer_id: 'cust_013',
        sales_rep_id: 'rep_004'
      }
    ];

    const marchOutOfRangeBefore = {
      activity_id: 'act_feb_last_001',
      activity_date: new Date('2024-02-29T21:00:00Z'),
      activity_type: '顧客訪問',
      customer_id: 'cust_014',
      sales_rep_id: 'rep_002'
    };

    const marchOutOfRangeAfter = {
      activity_id: 'act_apr_first_001',
      activity_date: new Date('2024-04-01T09:00:00Z'),
      activity_type: '商談成立',
      customer_id: 'cust_015',
      sales_rep_id: 'rep_005'
    };

    const marchAllData = [
      marchOutOfRangeBefore,
      ...marchDataFirstDay,
      ...marchDataLastDay,
      marchOutOfRangeAfter
    ];

    const marchReport = generateMonthlySummaryReport({
      target_year_month: '202403',
      start_date: marchStartDate,
      end_date: marchEndDate,
      activity_records: marchAllData
    });

    // 3月検証: 初日データが含まれていることを確認
    expect(marchReport.included_activity_ids).toContain('act_mar_first_001');

    // 3月検証: 最終日（3月31日）のデータが含まれていることを確認
    expect(marchReport.included_activity_ids).toContain('act_mar_last_001');

    // 3月検証: 期間外のデータが除外されていることを確認
    expect(marchReport.included_activity_ids).not.toContain(marchOutOfRangeBefore.activity_id);
    expect(marchReport.included_activity_ids).not.toContain(marchOutOfRangeAfter.activity_id);

    // 3月検証: 集計件数が期待値（2件）と一致することを確認
    expect(marchReport.total_records).toBe(2);
    expect(marchReport.included_activity_ids.length).toBe(2);

    // 最終検証: タイムスタンプの正確な判定
    expect(report.report_generated_at).toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z/);
    expect(report.start_date_iso).toBe('2024-01-01T00:00:00Z');
    expect(report.end_date_iso).toBe('2024-01-31T23:59:59Z');
  });
});