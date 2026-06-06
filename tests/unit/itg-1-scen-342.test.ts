import { validateDeliveryFeasibility } from '../../src/logic/it-1';

describe('製品仕様・納期・工程・資材・担当者情報を統合して標準化された生産指示書を自動生成する機能', () => {
  test('在庫不足かつ製造能力不足の場合に代替案が提示される', () => {
    // SCEN-342
    const requestedDeliveryDate = new Date('2024-01-15');
    const productSpecification = {
      productCode: 'PROD001',
      quantity: 1000,
      specifications: '標準製品仕様'
    };
    const currentProductionSchedule = [
      { processId: 'P001', startDate: new Date('2024-01-10'), endDate: new Date('2024-01-12') },
      { processId: 'P002', startDate: new Date('2024-01-13'), endDate: new Date('2024-01-16') }
    ];
    const equipmentCapacity = [
      { equipmentId: 'EQ001', current_utilization: 95, max_capacity: 800 },
      { equipmentId: 'EQ002', current_utilization: 90, max_capacity: 600 }
    ];
    const requiredProductionDays = 10;

    const result = validateDeliveryFeasibility(
      requestedDeliveryDate,
      productSpecification,
      currentProductionSchedule,
      equipmentCapacity,
      requiredProductionDays
    );

    expect(result.feasible).toBe(false);
    expect(result.earliestStartDate).toEqual(new Date('2024-01-17'));
    expect(result.alternativeDeliveryDate).toEqual(new Date('2024-01-27'));
    expect(result.utilizationRate).toBe(95);
    expect(result.conflictingOrders).toHaveLength(2);
  });
});