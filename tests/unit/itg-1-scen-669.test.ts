import { aggregateMonthlySalesMetrics } from '../../src/logic/it-1-2-1';

describe('月次成果指標自動集計機能 - 営業データが存在しない場合の集計', () => {
  test('SCEN-669: 対象期間内に営業データが存在しない場合、0件として集計される', () => {
    // Arrange: 営業データが存在しない期間を設定
    const targetPeriod = {
      startDate: new Date('2024-02-01T00:00:00Z'),
      endDate: new Date('2024-02-29T23:59:59Z'),
    };

    const salesDataList = [];

    const customerId = 'CUST-001';
    const serviceId = 'SVC-A';

    // Act: 集計処理を実行
    const result = aggregateMonthlySalesMetrics({
      targetPeriod,
      salesDataList,
      customerId,
      serviceId,
    });

    // Assert: 集計結果の件数が0件であること
    expect(result.totalCount).toBe(0);

    // Assert: 詳細データが空配列であること
    expect(result.details).toEqual([]);

    // Assert: 集計結果が正常に完了していること（エラーなし）
    expect(result.isSuccessful).toBe(true);

    // Assert: 集計期間が正確に保持されていること
    expect(result.aggregationPeriod.startDate).toEqual(
      new Date('2024-02-01T00:00:00Z')
    );
    expect(result.aggregationPeriod.endDate).toEqual(
      new Date('2024-02-29T23:59:59Z')
    );

    // Assert: エラーメッセージが存在しないこと
    expect(result.errorMessage).toBeNull();

    // Assert: 集計対象の顧客IDとサービスIDが正確に反映されていること
    expect(result.customerId).toBe('CUST-001');
    expect(result.serviceId).toBe('SVC-A');

    // Assert: デフォルト値の集計結果（全て0）が返されていること
    expect(result.appointmentCount).toBe(0);
    expect(result.contractCount).toBe(0);
    expect(result.totalAmount).toBe(0);
  });
});