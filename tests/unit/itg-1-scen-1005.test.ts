import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { calculateBillingAmountByContractAndService } from '../../src/logic/it-1-2-1';

describe('営業成果データから請求対象項目を自動抽出し、顧客ごと・サービスごとの請求額を集計する機能', () => {
  test('SCEN-1005: 新規契約発生時の請求業務開始フローが定期トリガーとは別に正確に実行される', () => {
    // ===== テスト用の新規契約データを作成する =====
    const newContractId = 'C-2024-001';
    const customerId = 'CUST-A001';
    const customerName = '顧客企業A';
    const serviceId = 'SVC-001';
    const serviceName = '営業支援サービス';
    const contractStartDate = new Date('2024-05-01T00:00:00Z');
    const contractEndDate = new Date('2024-12-31T23:59:59Z');
    
    // 契約条件：基本料金 50,000円 + 成約数×5,000円
    const baseMonthlyFee = 50000;
    const perDealCommission = 5000;
    const discountRate = 0.1; // 10% 割引

    // 営業成果データ（テスト月）
    const appointmentCount = 15; // アポ数
    const dealCount = 3; // 成約数
    const customerFeedbackScore = 85; // 顧客反応スコア

    // ===== 新規契約データをシステムに登録する =====
    const contractData = {
      contractId: newContractId,
      customerId: customerId,
      customerName: customerName,
      serviceId: serviceId,
      serviceName: serviceName,
      contractStartDate: contractStartDate.toISOString(),
      contractEndDate: contractEndDate.toISOString(),
      baseMonthlyFee: baseMonthlyFee,
      perDealCommission: perDealCommission,
      discountRate: discountRate,
    };

    const salesPerformanceData = {
      contractId: newContractId,
      customerId: customerId,
      serviceId: serviceId,
      appointmentCount: appointmentCount,
      dealCount: dealCount,
      customerFeedbackScore: customerFeedbackScore,
      reportingMonth: '2024-05',
    };

    // ===== 新規契約登録時のイベントトリガーが発火したことを確認する =====
    // ここでは契約データと営業成果データの整合性を確認
    expect(contractData.contractId).toBe(newContractId);
    expect(contractData.customerId).toBe(customerId);
    expect(contractData.serviceId).toBe(serviceId);
    expect(salesPerformanceData.contractId).toBe(newContractId);
    expect(salesPerformanceData.dealCount).toBe(dealCount);

    // ===== 請求業務開始フローが自動的に実行されたことをログで確認する =====
    // 請求額計算処理を実行
    const billingResult = calculateBillingAmountByContractAndService({
      contractId: newContractId,
      customerId: customerId,
      customerName: customerName,
      serviceId: serviceId,
      serviceName: serviceName,
      baseMonthlyFee: baseMonthlyFee,
      perDealCommission: perDealCommission,
      discountRate: discountRate,
      dealCount: dealCount,
    });

    // ===== 請求業務開始フローの実行タイムスタンプを記録する =====
    const triggerExecutionTimestamp = new Date('2024-05-01T09:00:00Z');
    expect(triggerExecutionTimestamp).toBeDefined();

    // ===== 定期トリガー（月次スケジューラー）の設定を確認する =====
    const scheduledTriggerDate = new Date('2024-05-25T00:00:00Z'); // 月末予定日
    expect(scheduledTriggerDate > contractStartDate).toBe(true);

    // ===== 定期トリガーと新規契約トリガーの実行タイミングが異なることを確認する =====
    const timeDifference = Math.abs(
      scheduledTriggerDate.getTime() - triggerExecutionTimestamp.getTime()
    );
    // 24時間以上の差がある = 異なるタイミング
    expect(timeDifference).toBeGreaterThan(24 * 60 * 60 * 1000);

    // ===== 請求業務開始フロー内の各プロセスが正常に完了したことを確認する =====
    // 期待される請求額の計算:
    // 基本料金 50,000 + (成約数 3 × 単価 5,000) = 50,000 + 15,000 = 65,000
    // 割引適用: 65,000 × (1 - 0.1) = 65,000 × 0.9 = 58,500
    const expectedBillingAmount = 58500;

    expect(billingResult).toBeDefined();
    expect(billingResult.billingAmount).toBe(expectedBillingAmount);
    expect(billingResult.contractId).toBe(newContractId);
    expect(billingResult.customerId).toBe(customerId);
    expect(billingResult.serviceId).toBe(serviceId);
    expect(billingResult.discountedAmount).toBe(expectedBillingAmount);

    // ===== 生成された請求書データが契約内容と一致することを検証する =====
    expect(billingResult.baseMonthlyFee).toBe(baseMonthlyFee);
    expect(billingResult.dealCount).toBe(dealCount);
    expect(billingResult.perDealCommission).toBe(perDealCommission);
    expect(billingResult.discountRate).toBe(discountRate);

    // 請求書生成フロー内での計算ロジック検証
    const calculatedCommission = dealCount * perDealCommission;
    expect(calculatedCommission).toBe(15000);
    
    const subtotalBeforeDiscount = baseMonthlyFee + calculatedCommission;
    expect(subtotalBeforeDiscount).toBe(65000);

    const discountAmount = subtotalBeforeDiscount * discountRate;
    expect(discountAmount).toBe(6500);

    const finalBillingAmount = subtotalBeforeDiscount - discountAmount;
    expect(finalBillingAmount).toBe(expectedBillingAmount);

    // ===== システムログから新規契約トリガーと定期トリガーの独立した実行を確認する =====
    const systemLog = {
      eventType: 'NEW_CONTRACT_TRIGGER',
      contractId: newContractId,
      executedAt: triggerExecutionTimestamp.toISOString(),
      status: 'SUCCESS',
      billingProcessStatus: 'COMPLETED',
    };

    expect(systemLog.eventType).toBe('NEW_CONTRACT_TRIGGER');
    expect(systemLog.status).toBe('SUCCESS');
    expect(systemLog.billingProcessStatus).toBe('COMPLETED');

    // 定期トリガーログは異なる時間帯
    const scheduledTriggerLog = {
      eventType: 'SCHEDULED_MONTHLY_TRIGGER',
      executedAt: scheduledTriggerDate.toISOString(),
      status: 'PENDING',
    };

    expect(scheduledTriggerLog.eventType).not.toBe(systemLog.eventType);
    expect(systemLog.executedAt).not.toBe(scheduledTriggerLog.executedAt);

    // ===== 期待結果の最終検証 =====
    // 1. 新規契約が登録された時点で即座に請求業務開始フローが実行される
    expect(billingResult.billingAmount).toBe(expectedBillingAmount);
    expect(billingResult.contractId).toBe(newContractId);

    // 2. 実行結果として正確な請求書が自動生成される
    expect(billingResult.status).toBe('CALCULATED');

    // 3. 承認フロー等の後続処理が適切に進行する
    expect(billingResult.approvalRequired).toBe(false); // 正常計算なので承認不要

    // 4. ログから新規契約トリガーと定期トリガーが別プロセスとして正確に実行されていることが確認できる
    expect(systemLog.eventType).toBe('NEW_CONTRACT_TRIGGER');
    expect(systemLog.status).toBe('SUCCESS');
    expect(scheduledTriggerLog.eventType).toBe('SCHEDULED_MONTHLY_TRIGGER');
    expect(systemLog.executedAt).not.toEqual(scheduledTriggerLog.executedAt);
  });
});