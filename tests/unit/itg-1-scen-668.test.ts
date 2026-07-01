import { aggregateSalesMetricsByPeriod } from '../../src/logic/it-1-2-1';

describe('月次成果指標自動集計機能 - 集計対象期間外のデータが除外される', () => {
  test('SCEN-668: 当月データのみが集計対象として処理され、前月・翌月のデータが除外される', () => {
    // テストデータの準備
    const previousMonthData = [
      {
        id: 'pm-001',
        date: '2023-12-01',
        customerId: 'cust-001',
        serviceId: 'svc-001',
        appointmentCount: 2,
        contractCount: 1,
      },
      {
        id: 'pm-002',
        date: '2023-12-05',
        customerId: 'cust-002',
        serviceId: 'svc-002',
        appointmentCount: 3,
        contractCount: 1,
      },
      {
        id: 'pm-003',
        date: '2023-12-10',
        customerId: 'cust-001',
        serviceId: 'svc-001',
        appointmentCount: 1,
        contractCount: 0,
      },
      {
        id: 'pm-004',
        date: '2023-12-15',
        customerId: 'cust-003',
        serviceId: 'svc-003',
        appointmentCount: 2,
        contractCount: 1,
      },
      {
        id: 'pm-005',
        date: '2023-12-28',
        customerId: 'cust-002',
        serviceId: 'svc-001',
        appointmentCount: 1,
        contractCount: 0,
      },
    ];

    const currentMonthData = [
      {
        id: 'cm-001',
        date: '2024-01-01',
        customerId: 'cust-001',
        serviceId: 'svc-001',
        appointmentCount: 5,
        contractCount: 2,
      },
      {
        id: 'cm-002',
        date: '2024-01-02',
        customerId: 'cust-002',
        serviceId: 'svc-002',
        appointmentCount: 3,
        contractCount: 1,
      },
      {
        id: 'cm-003',
        date: '2024-01-05',
        customerId: 'cust-001',
        serviceId: 'svc-002',
        appointmentCount: 2,
        contractCount: 1,
      },
      {
        id: 'cm-004',
        date: '2024-01-10',
        customerId: 'cust-003',
        serviceId: 'svc-001',
        appointmentCount: 4,
        contractCount: 2,
      },
      {
        id: 'cm-005',
        date: '2024-01-12',
        customerId: 'cust-002',
        serviceId: 'svc-003',
        appointmentCount: 1,
        contractCount: 0,
      },
      {
        id: 'cm-006',
        date: '2024-01-15',
        customerId: 'cust-001',
        serviceId: 'svc-003',
        appointmentCount: 2,
        contractCount: 1,
      },
      {
        id: 'cm-007',
        date: '2024-01-18',
        customerId: 'cust-003',
        serviceId: 'svc-002',
        appointmentCount: 3,
        contractCount: 1,
      },
      {
        id: 'cm-008',
        date: '2024-01-20',
        customerId: 'cust-002',
        serviceId: 'svc-001',
        appointmentCount: 2,
        contractCount: 0,
      },
      {
        id: 'cm-009',
        date: '2024-01-25',
        customerId: 'cust-001',
        serviceId: 'svc-002',
        appointmentCount: 1,
        contractCount: 1,
      },
      {
        id: 'cm-010',
        date: '2024-01-31',
        customerId: 'cust-003',
        serviceId: 'svc-003',
        appointmentCount: 2,
        contractCount: 1,
      },
    ];

    const nextMonthData = [
      {
        id: 'nm-001',
        date: '2024-02-01',
        customerId: 'cust-001',
        serviceId: 'svc-001',
        appointmentCount: 1,
        contractCount: 1,
      },
      {
        id: 'nm-002',
        date: '2024-02-05',
        customerId: 'cust-002',
        serviceId: 'svc-002',
        appointmentCount: 2,
        contractCount: 0,
      },
      {
        id: 'nm-003',
        date: '2024-02-10',
        customerId: 'cust-003',
        serviceId: 'svc-001',
        appointmentCount: 3,
        contractCount: 1,
      },
    ];

    const allData = [...previousMonthData, ...currentMonthData, ...nextMonthData];

    // 集計対象期間を設定（2024年1月）
    const periodStart = '2024-01-01';
    const periodEnd = '2024-01-31';

    // 集計処理を実行
    const result = aggregateSalesMetricsByPeriod({
      data: allData,
      startDate: periodStart,
      endDate: periodEnd,
    });

    // 集計結果から含まれたデータ件数をカウント
    const includedRecordCount = result.records.length;
    expect(includedRecordCount).toBe(10);

    // 集計結果に前月のデータが含まれていないことを確認
    const previousMonthIncluded = result.records.some((record) =>
      previousMonthData.some((pm) => pm.id === record.id),
    );
    expect(previousMonthIncluded).toBe(false);

    // 集計結果に翌月のデータが含まれていないことを確認
    const nextMonthIncluded = result.records.some((record) =>
      nextMonthData.some((nm) => nm.id === record.id),
    );
    expect(nextMonthIncluded).toBe(false);

    // 集計結果の詳細データを確認し、すべてが当月の日付範囲内であることを検証
    result.records.forEach((record) => {
      const recordDate = new Date(record.date);
      const startDateObj = new Date(periodStart);
      const endDateObj = new Date(periodEnd);

      expect(recordDate.getTime()).toBeGreaterThanOrEqual(
        startDateObj.getTime(),
      );
      expect(recordDate.getTime()).toBeLessThanOrEqual(endDateObj.getTime());
    });

    // 顧客別・サービス別の集計結果を検証
    const aggregatedByCustAndSvc = result.aggregatedByCustomerAndService;

    // 当月データから期待される集計値を検証
    expect(aggregatedByCustAndSvc['cust-001']['svc-001']).toEqual({
      customerId: 'cust-001',
      serviceId: 'svc-001',
      totalAppointmentCount: 5,
      totalContractCount: 2,
      recordCount: 1,
    });

    expect(aggregatedByCustAndSvc['cust-002']['svc-002']).toEqual({
      customerId: 'cust-002',
      serviceId: 'svc-002',
      totalAppointmentCount: 3,
      totalContractCount: 1,
      recordCount: 1,
    });

    expect(aggregatedByCustAndSvc['cust-001']['svc-002']).toEqual({
      customerId: 'cust-001',
      serviceId: 'svc-002',
      totalAppointmentCount: 3,
      totalContractCount: 2,
      recordCount: 2,
    });

    expect(aggregatedByCustAndSvc['cust-003']['svc-001']).toEqual({
      customerId: 'cust-003',
      serviceId: 'svc-001',
      totalAppointmentCount: 4,
      totalContractCount: 2,
      recordCount: 1,
    });

    expect(aggregatedByCustAndSvc['cust-002']['svc-003']).toEqual({
      customerId: 'cust-002',
      serviceId: 'svc-003',
      totalAppointmentCount: 1,
      totalContractCount: 0,
      recordCount: 1,
    });

    expect(aggregatedByCustAndSvc['cust-001']['svc-003']).toEqual({
      customerId: 'cust-001',
      serviceId: 'svc-003',
      totalAppointmentCount: 2,
      totalContractCount: 1,
      recordCount: 1,
    });

    expect(aggregatedByCustAndSvc['cust-003']['svc-002']).toEqual({
      customerId: 'cust-003',
      serviceId: 'svc-002',
      totalAppointmentCount: 3,
      totalContractCount: 1,
      recordCount: 1,
    });

    expect(aggregatedByCustAndSvc['cust-002']['svc-001']).toEqual({
      customerId: 'cust-002',
      serviceId: 'svc-001',
      totalAppointmentCount: 2,
      totalContractCount: 0,
      recordCount: 1,
    });

    expect(aggregatedByCustAndSvc['cust-003']['svc-003']).toEqual({
      customerId: 'cust-003',
      serviceId: 'svc-003',
      totalAppointmentCount: 2,
      totalContractCount: 1,
      recordCount: 1,
    });

    // 全体統計の検証
    expect(result.summaryStats.totalRecordsInPeriod).toBe(10);
    expect(result.summaryStats.totalAppointments).toBe(25);
    expect(result.summaryStats.totalContracts).toBe(10);
    expect(result.summaryStats.periodStart).toBe(periodStart);
    expect(result.summaryStats.periodEnd).toBe(periodEnd);
    expect(result.summaryStats.uniqueCustomerCount).toBe(3);
    expect(result.summaryStats.uniqueServiceCount).toBe(3);
  });
});