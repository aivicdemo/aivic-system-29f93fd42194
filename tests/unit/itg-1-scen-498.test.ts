import { validateMonthlyProductionReport } from '../../src/logic/it-1';

describe("月次報告承認・差し戻し判定機能", () => {
  test("基準を満たす報告資料に対して承認判定が実行される", () => {
    // SCEN-498
    const reportData = {
      productionVolume: 15000,
      qualityMetrics: {
        defectRate: 0.02,
        qualityScore: 95
      },
      deliveryRate: 92,
      inventoryStatus: {
        currentStock: 8500,
        turnoverRate: 6.2
      },
      monthlyComparison: {
        previousMonth: 14200,
        growthRate: 0.056
      },
      volumeChangeExplanation: "新規契約により生産量が増加",
      improvementPlan: "品質向上のための設備メンテナンス強化"
    };

    const previousMonthData = {
      productionVolume: 14200,
      qualityMetrics: {
        defectRate: 0.025,
        qualityScore: 93
      },
      deliveryRate: 89,
      inventoryStatus: {
        currentStock: 8200,
        turnoverRate: 6.0
      }
    };

    const monthlyTargets = {
      targetVolume: 14000,
      targetQualityScore: 90,
      targetDeliveryRate: 85
    };

    const result = validateMonthlyProductionReport(reportData, previousMonthData, monthlyTargets);

    expect(result.approved).toBe(true);
    expect(result.approvalDateTime).toBeInstanceOf(Date);
    expect(result.rejectionReasons).toEqual([]);
    expect(result.nextSubmissionDeadline).toBeNull();
  });
});