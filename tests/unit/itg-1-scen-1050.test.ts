import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { determineMonthlySummarizationPeriod } from '../../src/logic/it-1-br-1781935279444-1-2-1';

describe('月次レポート作成期間の自動確定と対象データ抽出', () => {
  // SCEN-1050: 月の最終秒が正確に集計対象期間の上限境界として確定される
  test('SCEN-1050: 月末23:59:59を期間終了時刻とする場合、集計対象期間が正確に確定され境界判定が正確に行われること', () => {
    // 準備: テストデータとして月末23:59:59を期間終了時刻に設定
    const reportStartDate = new Date('2024-01-01T00:00:00Z');
    const reportEndDate = new Date('2024-01-31T23:59:59Z');
    const monthlyReportCondition = {
      period_start_datetime: reportStartDate,
      period_end_datetime: reportEndDate,
      target_month: '2024-01'
    };

    // 営業データセット: 1日00:00:00から月末23:59:59までのデータを登録
    const salesDataWithinPeriod = [
      {
        id: 'data_0001',
        customer_id: 'cust_001',
        activity_datetime: new Date('2024-01-01T00:00:00Z'),
        activity_type: 'appointment',
        value: 1
      },
      {
        id: 'data_0002',
        customer_id: 'cust_002',
        activity_datetime: new Date('2024-01-15T12:30:45Z'),
        activity_type: 'deal',
        value: 5000
      },
      {
        id: 'data_0003',
        customer_id: 'cust_003',
        activity_datetime: new Date('2024-01-31T23:59:59Z'),
        activity_type: 'appointment',
        value: 2
      }
    ];

    // 期間直前秒（月末23:59:58）のデータ - これは含まれる
    const dataBefore = {
      id: 'data_before_boundary',
      customer_id: 'cust_004',
      activity_datetime: new Date('2024-01-31T23:59:58Z'),
      activity_type: 'response',
      value: 1
    };

    // 期間直後のデータ（翌月）- これは除外される
    const dataAfter = {
      id: 'data_after_boundary',
      customer_id: 'cust_005',
      activity_datetime: new Date('2024-02-01T00:00:00Z'),
      activity_type: 'appointment',
      value: 1
    };

    // 月次レポート作成機能を実行し、集計対象期間の自動確定処理を開始
    const result = determineMonthlySummarizationPeriod({
      base_report_condition: monthlyReportCondition,
      all_sales_data: [
        ...salesDataWithinPeriod,
        dataBefore,
        dataAfter
      ]
    });

    // システムが確定した集計対象期間の開始時刻と終了時刻をログから取得
    expect(result.determined_period_start).toBe('2024-01-01T00:00:00Z');
    expect(result.determined_period_end).toBe('2024-01-31T23:59:59Z');

    // 期間開始の1日00時00分00秒から月の最終秒までのすべてのデータが集計対象として含まれる
    expect(result.extracted_data_count).toBe(4); // 3件の期間内データ + 1件の23:59:58データ
    expect(result.excluded_data_count).toBe(1); // 翌月のデータは除外

    // 期間の直前秒（月の最終秒の1秒前）と直後のデータが正確に境界判定されていることを確認
    expect(result.boundary_before_included).toBe(true); // 23:59:58は含まれる
    expect(result.boundary_after_excluded).toBe(true); // 2024-02-01は除外される

    // 抽出されたデータの時系列順序が正確であることを検証
    const extractedRecords = result.extracted_records;
    expect(extractedRecords[0].activity_datetime).toBe('2024-01-01T00:00:00Z');
    expect(extractedRecords[1].activity_datetime).toBe('2024-01-15T12:30:45Z');
    expect(extractedRecords[2].activity_datetime).toBe('2024-01-31T23:59:58Z');
    expect(extractedRecords[3].activity_datetime).toBe('2024-01-31T23:59:59Z');

    // レポート内の集計件数がデータベースの登録件数と完全に一致することを確認
    const expectedRecordCountInPeriod = 4;
    expect(result.extracted_data_count).toBe(expectedRecordCountInPeriod);
    expect(result.summary_record_count).toBe(expectedRecordCountInPeriod);

    // 月末23:59:59が正確に上限境界として確定されたことを確認
    expect(result.determined_period_end).toBe('2024-01-31T23:59:59Z');
    expect(result.is_month_end_boundary_precise).toBe(true);

    // 翌月のデータが確実に除外されたことを確認
    expect(result.next_month_data_excluded).toBe(true);
  });
});