import { calculateContractChangeBackbillingAdjustment } from '../../src/logic/it-1-2-1';

describe('Contract Change Backbilling Adjustment - Sales Data Aggregation', () => {
  // SCEN-1314: [normal] 契約変更に基づく請求遡及調整 - 契約変更前後の請求額差分が正確に計算される
  test('should calculate precise billing adjustment difference based on contract change', () => {
    const contractStartDate = new Date('2024-01-01T00:00:00Z');
    const changeEffectiveDate = new Date('2024-03-01T00:00:00Z');
    const initialMonthlyAmount = 100000;
    const newMonthlyAmount = 150000;

    const preChangeMonths = 2; // January, February
    const preChangeTotal = initialMonthlyAmount * preChangeMonths; // 200,000
    const postChangeAmount = newMonthlyAmount; // 150,000 per month from March

    const adjustmentAmount = newMonthlyAmount - initialMonthlyAmount; // 50,000
    const expectedDifference = adjustmentAmount; // 50,000 increase for March

    const result = calculateContractChangeBackbillingAdjustment({
      contractStartDate,
      changeEffectiveDate,
      preChangeMonthlyAmount: initialMonthlyAmount,
      postChangeMonthlyAmount: newMonthlyAmount,
      changeAppliedMonth: new Date('2024-03-01T00:00:00Z'),
    });

    expect(result).toEqual({
      preChangePeriodBillingAmount: preChangeTotal,
      postChangeMonthlyAmount: postChangeAmount,
      adjustmentAmount: expectedDifference,
      adjustmentType: 'increase',
      adjustmentAppliedDate: new Date('2024-03-01T00:00:00Z'),
      adjustedBillingAmountForChangeMonth: postChangeAmount + expectedDifference,
      isBackbillingAdjustmentValid: true,
    });

    expect(result.preChangePeriodBillingAmount).toBe(200000);
    expect(result.postChangeMonthlyAmount).toBe(150000);
    expect(result.adjustmentAmount).toBe(50000);
    expect(result.adjustedBillingAmountForChangeMonth).toBe(200000);
  });
});