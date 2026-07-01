import { determineApprovalFlow } from '../../src/logic/it-1781935279444-2-1-1';

describe('請求額異常値判定・承認フロー自動決定機能', () => {
  // SCEN-912: [normal] 請求額が前月比で正常範囲内で、即時承認フローが決定される
  test('前月比±10%の正常範囲内の請求額で即時承認フロー自動決定', () => {
    // 前月請求額: 100万円
    const previousMonthAmount = 1000000;
    // 当月請求額: 90万円（前月比-10%、正常範囲下限）
    const currentMonthAmount = 900000;
    // 許容変動率: ±10%
    const toleranceRate = 0.1;

    const result = determineApprovalFlow({
      previousMonthAmount,
      currentMonthAmount,
      toleranceRate,
    });

    // 期待値: 変動率は -10%（正常範囲内）
    const expectedChangeRate = (currentMonthAmount - previousMonthAmount) / previousMonthAmount;
    expect(expectedChangeRate).toBe(-0.1);

    // 異常フラグが立たないこと
    expect(result.isAbnormal).toBe(false);

    // 承認フロー決定: 即時承認
    expect(result.approvalFlow).toBe('即時承認');

    // 承認ステータス
    expect(result.approvalStatus).toBe('即時承認');

    // システムログに異常フラグが含まれないこと
    expect(result.systemLog.abnormalFlag).toBe(false);

    // 変動率が正確に記録されること
    expect(result.changeRate).toBeCloseTo(-0.1, 5);
  });
});