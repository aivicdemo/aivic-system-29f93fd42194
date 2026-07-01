import { detectBillingAnomalyAndDecideApprovalFlow } from "../../src/logic/it-1781935279444-2-1-1";

describe("営業データ入力時の品質検証ルール定義・実行機能", () => {
  test("SCEN-913: 請求額が前月比50%以上の乖離で要確認フローが決定される", () => {
    // Arrange: テストデータの構築
    const previousMonthBillingAmount = 100000; // 前月の請求額: 100,000円
    const currentMonthBillingAmount = 150000; // 当月の請求額: 150,000円（前月比50%増加）
    
    const billingData = {
      customerId: "CUST-001",
      serviceId: "SVC-A",
      previousMonthAmount: previousMonthBillingAmount,
      currentMonthAmount: currentMonthBillingAmount,
      billingPeriod: {
        month: 1,
        year: 2024
      },
      contractId: "CONTRACT-001",
      detectionTimestamp: new Date("2024-01-25T09:00:00Z").toISOString()
    };

    // Act: 請求額異常値判定・承認フロー決定ロジックを実行
    const result = detectBillingAnomalyAndDecideApprovalFlow(billingData);

    // Assert: 期待値の検証
    // 1. 異常検出フラグが true であることを確認
    expect(result.anomalyDetected).toBe(true);
    
    // 2. 乖離率の計算確認: (150000 - 100000) / 100000 * 100 = 50%
    expect(result.deviationPercentage).toBe(50);
    
    // 3. 承認フロー が『要確認』であることを確認
    expect(result.approvalFlowDecision).toBe("要確認");
    
    // 4. 異常値判定結果が記録されていることを確認
    expect(result.judgmentResult).toBeDefined();
    expect(result.judgmentResult.isAbnormal).toBe(true);
    
    // 5. 判定理由が正確に記録されていることを確認
    expect(result.judgmentResult.reason).toMatch(/前月比/);
    expect(result.judgmentResult.reason).toMatch(/50%/);
    
    // 6. 要確認フローの詳細情報が生成されていることを確認
    expect(result.reviewFlowDetails).toBeDefined();
    expect(result.reviewFlowDetails.flowType).toBe("要確認");
    
    // 7. 確認対象の詳細情報が存在することを確認
    expect(result.reviewFlowDetails.reviewTarget).toBeDefined();
    expect(result.reviewFlowDetails.reviewTarget.customerId).toBe("CUST-001");
    expect(result.reviewFlowDetails.reviewTarget.serviceId).toBe("SVC-A");
    expect(result.reviewFlowDetails.reviewTarget.previousAmount).toBe(100000);
    expect(result.reviewFlowDetails.reviewTarget.currentAmount).toBe(150000);
    
    // 8. 確認担当者が割り当てられていることを確認
    expect(result.reviewFlowDetails.assignedReviewer).toBeDefined();
    expect(result.reviewFlowDetails.assignedReviewer.length).toBeGreaterThan(0);
    
    // 9. 確認期限が設定されていることを確認
    expect(result.reviewFlowDetails.reviewDeadline).toBeDefined();
    const deadlineDate = new Date(result.reviewFlowDetails.reviewDeadline);
    expect(deadlineDate).toBeInstanceOf(Date);
    expect(deadlineDate.getTime()).toBeGreaterThan(
      new Date(billingData.detectionTimestamp).getTime()
    );
    
    // 10. 判定の詳細情報が適切に記録されていることを確認
    expect(result.judgmentDetail).toBeDefined();
    expect(result.judgmentDetail.detectionReason).toMatch(/乖離/);
    expect(result.judgmentDetail.threshold).toBe(50); // 閾値: 50%
    expect(result.judgmentDetail.detectedValue).toBe(50); // 検出値: 50%
    
    // 11. 記録タイムスタンプが存在することを確認
    expect(result.recordedAt).toBeDefined();
    const recordedTime = new Date(result.recordedAt);
    expect(recordedTime).toBeInstanceOf(Date);
    
    // 12. 異常値判定結果が正確に分類されていることを確認
    expect(result.classificationLevel).toBe("高");
  });
});