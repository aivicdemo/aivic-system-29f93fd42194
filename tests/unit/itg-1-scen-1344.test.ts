import { calculateBackdatedBillingAdjustment } from '../../src/logic/it-1-2-1';

describe('契約変更に伴う請求遡及調整機能', () => {
  test('SCEN-1344: 契約変更日が遡及調整対象期間の境界値で正確に計算される', () => {
    const contract_start_date = new Date('2024-01-01T00:00:00Z');
    const retrospective_start_date = new Date('2024-04-01T00:00:00Z');
    const retrospective_end_date = new Date('2024-06-30T23:59:59Z');

    const base_monthly_fee = 100000;
    const old_discount_rate = 0.1;
    const new_discount_rate = 0.2;

    // パターン1: 遡及調整対象期間の開始日（2024-04-01）
    const result_boundary_start = calculateBackdatedBillingAdjustment({
      contract_start_date,
      contract_change_date: new Date('2024-04-01T00:00:00Z'),
      retrospective_start_date,
      retrospective_end_date,
      base_monthly_fee,
      old_discount_rate,
      new_discount_rate,
    });

    expect(result_boundary_start).toEqual({
      is_within_retrospective_period: true,
      adjustment_months: 3,
      old_total_fee: 270000,
      new_total_fee: 240000,
      backdated_adjustment_amount: -30000,
      affected_months: ['2024-04', '2024-05', '2024-06'],
    });

    // パターン2: 遡及調整対象期間の終了日（2024-06-30）
    const result_boundary_end = calculateBackdatedBillingAdjustment({
      contract_start_date,
      contract_change_date: new Date('2024-06-30T23:59:59Z'),
      retrospective_start_date,
      retrospective_end_date,
      base_monthly_fee,
      old_discount_rate,
      new_discount_rate,
    });

    expect(result_boundary_end).toEqual({
      is_within_retrospective_period: true,
      adjustment_months: 3,
      old_total_fee: 270000,
      new_total_fee: 240000,
      backdated_adjustment_amount: -30000,
      affected_months: ['2024-04', '2024-05', '2024-06'],
    });

    // パターン3: 遡及調整対象期間の前日（2024-03-31）
    const result_before_boundary = calculateBackdatedBillingAdjustment({
      contract_start_date,
      contract_change_date: new Date('2024-03-31T23:59:59Z'),
      retrospective_start_date,
      retrospective_end_date,
      base_monthly_fee,
      old_discount_rate,
      new_discount_rate,
    });

    expect(result_before_boundary).toEqual({
      is_within_retrospective_period: false,
      adjustment_months: 0,
      old_total_fee: 0,
      new_total_fee: 0,
      backdated_adjustment_amount: 0,
      affected_months: [],
    });

    // パターン4: 遡及調整対象期間の翌日（2024-07-01）
    const result_after_boundary = calculateBackdatedBillingAdjustment({
      contract_start_date,
      contract_change_date: new Date('2024-07-01T00:00:00Z'),
      retrospective_start_date,
      retrospective_end_date,
      base_monthly_fee,
      old_discount_rate,
      new_discount_rate,
    });

    expect(result_after_boundary).toEqual({
      is_within_retrospective_period: false,
      adjustment_months: 0,
      old_total_fee: 0,
      new_total_fee: 0,
      backdated_adjustment_amount: 0,
      affected_months: [],
    });

    // パターン5: タイムゾーン境界 23:59:59（遡及調整対象期間内）
    const result_timezone_boundary_end_of_day = calculateBackdatedBillingAdjustment({
      contract_start_date,
      contract_change_date: new Date('2024-05-15T23:59:59Z'),
      retrospective_start_date,
      retrospective_end_date,
      base_monthly_fee,
      old_discount_rate,
      new_discount_rate,
    });

    expect(result_timezone_boundary_end_of_day).toEqual({
      is_within_retrospective_period: true,
      adjustment_months: 3,
      old_total_fee: 270000,
      new_total_fee: 240000,
      backdated_adjustment_amount: -30000,
      affected_months: ['2024-04', '2024-05', '2024-06'],
    });

    // パターン6: タイムゾーン境界 00:00:00（遡及調整対象期間内）
    const result_timezone_boundary_start_of_day = calculateBackdatedBillingAdjustment({
      contract_start_date,
      contract_change_date: new Date('2024-05-15T00:00:00Z'),
      retrospective_start_date,
      retrospective_end_date,
      base_monthly_fee,
      old_discount_rate,
      new_discount_rate,
    });

    expect(result_timezone_boundary_start_of_day).toEqual({
      is_within_retrospective_period: true,
      adjustment_months: 3,
      old_total_fee: 270000,
      new_total_fee: 240000,
      backdated_adjustment_amount: -30000,
      affected_months: ['2024-04', '2024-05', '2024-06'],
    });

    // 境界内の変更と範囲外の変更で異なる結果が得られることを検証
    expect(result_boundary_start.is_within_retrospective_period).toBe(true);
    expect(result_before_boundary.is_within_retrospective_period).toBe(false);
    expect(result_after_boundary.is_within_retrospective_period).toBe(false);

    // 遡及調整金額が期待値と一致し、誤差が0円であることを確認
    expect(result_boundary_start.backdated_adjustment_amount).toBe(-30000);
    expect(result_boundary_end.backdated_adjustment_amount).toBe(-30000);
    expect(result_before_boundary.backdated_adjustment_amount).toBe(0);
    expect(result_after_boundary.backdated_adjustment_amount).toBe(0);
  });
});