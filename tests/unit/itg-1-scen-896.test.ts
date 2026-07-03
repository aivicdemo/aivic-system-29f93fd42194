import { describe, test, expect } from '@jest/globals';
import { determineApprovalFlowForAnomalousInvoiceAmount } from '../../src/logic/it-1781935279444-2-2-1';

describe('請求額異常値判定・承認フロー自動決定機能', () => {
  // SCEN-896: [error] 請求額異常値判定・承認フロー自動決定機能 - 前月比で異常値を示す場合は要確認フローが選択される
  test('前月比で異常値を示す場合は「要確認フロー」が返却される', () => {
    const previousMonthAmount = 100000;
    const currentMonthAmount = 150000;
    const anomalyThresholdPercent = 30;

    const result = determineApprovalFlowForAnomalousInvoiceAmount({
      previousMonthInvoiceAmount: previousMonthAmount,
      currentMonthInvoiceAmount: currentMonthAmount,
      anomalyDetectionThresholdPercent: anomalyThresholdPercent,
    });

    expect(result.approvalFlow).toBe('要確認');
    expect(result.percentageChange).toBe(50);
    expect(result.isAnomalous).toBe(true);
    expect(result.alertRoutingRequired).toBe(true);
  });

  test('前月比ちょうど30%の場合は「要確認フロー」が返却される', () => {
    const previousMonthAmount = 100000;
    const currentMonthAmount = 130000;
    const anomalyThresholdPercent = 30;

    const result = determineApprovalFlowForAnomalousInvoiceAmount({
      previousMonthInvoiceAmount: previousMonthAmount,
      currentMonthInvoiceAmount: currentMonthAmount,
      anomalyDetectionThresholdPercent: anomalyThresholdPercent,
    });

    expect(result.approvalFlow).toBe('要確認');
    expect(result.percentageChange).toBe(30);
    expect(result.isAnomalous).toBe(true);
  });

  test('前月比29.9%の場合は「即座に承認」フローが返却される', () => {
    const previousMonthAmount = 100000;
    const currentMonthAmount = 129900;
    const anomalyThresholdPercent = 30;

    const result = determineApprovalFlowForAnomalousInvoiceAmount({
      previousMonthInvoiceAmount: previousMonthAmount,
      currentMonthInvoiceAmount: currentMonthAmount,
      anomalyDetectionThresholdPercent: anomalyThresholdPercent,
    });

    expect(result.approvalFlow).toBe('即座に承認');
    expect(result.percentageChange).toBe(29.9);
    expect(result.isAnomalous).toBe(false);
  });

  test('前月比で減額した場合（-35%）も異常値判定対象になり「要確認フロー」が返却される', () => {
    const previousMonthAmount = 100000;
    const currentMonthAmount = 65000;
    const anomalyThresholdPercent = 30;

    const result = determineApprovalFlowForAnomalousInvoiceAmount({
      previousMonthInvoiceAmount: previousMonthAmount,
      currentMonthInvoiceAmount: currentMonthAmount,
      anomalyDetectionThresholdPercent: anomalyThresholdPercent,
    });

    expect(result.approvalFlow).toBe('要確認');
    expect(result.percentageChange).toBe(-35);
    expect(result.isAnomalous).toBe(true);
    expect(result.alertRoutingRequired).toBe(true);
  });

  test('前月比で減額した場合（-29.9%）は「即座に承認」フローが返却される', () => {
    const previousMonthAmount = 100000;
    const currentMonthAmount = 70100;
    const anomalyThresholdPercent = 30;

    const result = determineApprovalFlowForAnomalousInvoiceAmount({
      previousMonthInvoiceAmount: previousMonthAmount,
      currentMonthInvoiceAmount: currentMonthAmount,
      anomalyDetectionThresholdPercent: anomalyThresholdPercent,
    });

    expect(result.approvalFlow).toBe('即座に承認');
    expect(result.percentageChange).toBe(-29.9);
    expect(result.isAnomalous).toBe(false);
  });

  test('前月金額が0円の場合はエラーが発生する', () => {
    const previousMonthAmount = 0;
    const currentMonthAmount = 100000;
    const anomalyThresholdPercent = 30;

    expect(() => {
      determineApprovalFlowForAnomalousInvoiceAmount({
        previousMonthInvoiceAmount: previousMonthAmount,
        currentMonthInvoiceAmount: currentMonthAmount,
        anomalyDetectionThresholdPercent: anomalyThresholdPercent,
      });
    }).toThrow(/前月金額/);
  });

  test('異常値判定の閾値が負数の場合はエラーが発生する', () => {
    const previousMonthAmount = 100000;
    const currentMonthAmount = 150000;
    const anomalyThresholdPercent = -10;

    expect(() => {
      determineApprovalFlowForAnomalousInvoiceAmount({
        previousMonthInvoiceAmount: previousMonthAmount,
        currentMonthInvoiceAmount: currentMonthAmount,
        anomalyDetectionThresholdPercent: anomalyThresholdPercent,
      });
    }).toThrow(/閾値/);
  });

  test('当月金額が負数の場合はエラーが発生する', () => {
    const previousMonthAmount = 100000;
    const currentMonthAmount = -50000;
    const anomalyThresholdPercent = 30;

    expect(() => {
      determineApprovalFlowForAnomalousInvoiceAmount({
        previousMonthInvoiceAmount: previousMonthAmount,
        currentMonthInvoiceAmount: currentMonthAmount,
        anomalyDetectionThresholdPercent: anomalyThresholdPercent,
      });
    }).toThrow(/当月金額/);
  });

  test('前月と当月の金額が同じ場合は「即座に承認」フローが返却される', () => {
    const previousMonthAmount = 100000;
    const currentMonthAmount = 100000;
    const anomalyThresholdPercent = 30;

    const result = determineApprovalFlowForAnomalousInvoiceAmount({
      previousMonthInvoiceAmount: previousMonthAmount,
      currentMonthInvoiceAmount: currentMonthAmount,
      anomalyDetectionThresholdPercent: anomalyThresholdPercent,
    });

    expect(result.approvalFlow).toBe('即座に承認');
    expect(result.percentageChange).toBe(0);
    expect(result.isAnomalous).toBe(false);
  });

  test('複数回実行時に同じ入力に対して一貫性のある結果が返却される', () => {
    const previousMonthAmount = 100000;
    const currentMonthAmount = 150000;
    const anomalyThresholdPercent = 30;

    const result1 = determineApprovalFlowForAnomalousInvoiceAmount({
      previousMonthInvoiceAmount: previousMonthAmount,
      currentMonthInvoiceAmount: currentMonthAmount,
      anomalyDetectionThresholdPercent: anomalyThresholdPercent,
    });

    const result2 = determineApprovalFlowForAnomalousInvoiceAmount({
      previousMonthInvoiceAmount: previousMonthAmount,
      currentMonthInvoiceAmount: currentMonthAmount,
      anomalyDetectionThresholdPercent: anomalyThresholdPercent,
    });

    expect(result1.approvalFlow).toBe(result2.approvalFlow);
    expect(result1.isAnomalous).toBe(result2.isAnomalous);
    expect(result1.percentageChange).toBe(result2.percentageChange);
  });
});