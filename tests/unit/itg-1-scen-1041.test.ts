import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { validateSalesReportContent } from '../../src/logic/it-1781935279444-2-2-1';

describe('営業成果レポート内容妥当性判定 - レポート期間終了日が当日のとき境界値として正しく判定される', () => {
  let originalNow: () => number;

  beforeEach(() => {
    originalNow = Date.now;
  });

  afterEach(() => {
    Date.now = originalNow;
  });

  // SCEN-1041
  test('レポート期間終了日が当日のとき、当日24時59分までのすべてのデータが集計に含まれ、妥当性判定がPASSとなること', () => {
    // 固定のシステム日付: 2024-01-31T00:00:00Z
    const systemDate = new Date('2024-01-31T00:00:00Z');
    Date.now = () => systemDate.getTime();

    // レポート期間: 2024-01-02 から 2024-01-31（当日）まで
    const reportStartDate = new Date('2024-01-02T00:00:00Z');
    const reportEndDate = new Date('2024-01-31T23:59:59Z');

    // テストデータ: レポート期間内の営業データ
    const salesDataWithinPeriod = [
      {
        id: 'sales_001',
        customerName: '顧客A',
        appointmentCount: 5,
        closureCount: 2,
        serviceType: 'ServiceX',
        recordedAt: new Date('2024-01-15T10:30:00Z'),
      },
      {
        id: 'sales_002',
        customerName: '顧客B',
        appointmentCount: 3,
        closureCount: 1,
        serviceType: 'ServiceY',
        recordedAt: new Date('2024-01-31T23:45:00Z'),
      },
    ];

    // レポート期間外の営業データ（除外されるべき）
    const salesDataOutsidePeriod = [
      {
        id: 'sales_003',
        customerName: '顧客C',
        appointmentCount: 2,
        closureCount: 0,
        serviceType: 'ServiceX',
        recordedAt: new Date('2024-02-01T08:00:00Z'),
      },
    ];

    // 妥当性判定入力
    const reportContent = {
      reportId: 'report_2024_01',
      reportPeriodStartDate: reportStartDate,
      reportPeriodEndDate: reportEndDate,
      customerSalesData: salesDataWithinPeriod,
      totalAppointmentCount: 8,
      totalClosureCount: 3,
      generatedAt: systemDate,
      templateVersion: 'v1.0',
    };

    // 実際の営業データベース（期間内＋期間外）
    const allSalesData = [...salesDataWithinPeriod, ...salesDataOutsidePeriod];

    // 妥当性判定機能を実行
    const validationResult = validateSalesReportContent(
      reportContent,
      allSalesData
    );

    // 期待結果:
    // 1. 判定がPASS（成功）であること
    expect(validationResult.isValid).toBe(true);

    // 2. レポート期間終了日が当日として正しく認識されていること
    expect(validationResult.reportEndDateBoundaryCorrect).toBe(true);

    // 3. 期間内データが完全に含まれていること
    expect(validationResult.includedSalesRecordCount).toBe(2);

    // 4. 期間外データが除外されていること
    expect(validationResult.excludedOutOfPeriodRecordCount).toBe(1);

    // 5. 当日23時59分のデータが含まれていることを確認
    expect(validationResult.latestIncludedRecordTime).toBe(
      new Date('2024-01-31T23:45:00Z').getTime()
    );

    // 6. 集計値が正確であること
    expect(validationResult.aggregatedAppointmentCount).toBe(8);
    expect(validationResult.aggregatedClosureCount).toBe(3);

    // 7. バリデーションの詳細メッセージが期待通りであること
    expect(validationResult.validationMessage).toMatch(/期間末日/);
    expect(validationResult.validationMessage).toMatch(/2024-01-31/);
  });
});