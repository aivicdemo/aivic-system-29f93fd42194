import { extractBillingItemsAndAggregate } from '../../src/logic/it-1-2-1';

describe('営業成果データから請求対象項目を自動抽出し、顧客ごと・サービスごとの請求額を集計する機能', () => {
  // SCEN-1258: [normal] SLA時間内契約変更反映機能
  test('顧客承認から契約・請求データ最新状態への反映がSLA時間内に完了する', () => {
    // 前提: 既存の契約データを持つ顧客が存在
    const customerId = 'CUST-001';
    const serviceId = 'SVC-A';
    
    // 契約変更申請タイムスタンプ（固定値）
    const changeRequestTimestamp = new Date('2024-01-15T09:00:00Z');
    
    // 顧客承認完了タイムスタンプ（固定値）
    const customerApprovalTimestamp = new Date('2024-01-15T10:30:00Z');
    
    // SLA時間閾値: 4時間
    const slaThresholdMs = 4 * 60 * 60 * 1000;
    
    // 契約変更内容
    const contractChangeData = {
      customerId,
      serviceId,
      changeType: 'price_update',
      previousPrice: 100000,
      newPrice: 120000,
      effectiveDate: '2024-01-15',
      changeRequestTimestamp,
      customerApprovalTimestamp,
    };
    
    // 営業データ（請求対象項目を含む）
    const salesData = [
      {
        customerId,
        serviceId,
        appointmentCount: 10,
        contractCount: 3,
        responseRate: 85,
        recordDate: '2024-01-15',
      },
    ];
    
    // 実行: 請求対象項目抽出と集計
    const result = extractBillingItemsAndAggregate({
      contractChangeData,
      salesData,
      slaThresholdMs,
    });
    
    // 検証1: 請求対象項目が正しく抽出されている
    expect(result.billingItems).toBeDefined();
    expect(result.billingItems).toHaveLength(1);
    expect(result.billingItems[0].customerId).toBe(customerId);
    expect(result.billingItems[0].serviceId).toBe(serviceId);
    
    // 検証2: 顧客ごとの請求額が新しい価格で計算されている
    // 計算式: 成約数（3件） × 新価格（120,000円） = 360,000円
    expect(result.aggregatedBillingByCustomer).toBeDefined();
    expect(result.aggregatedBillingByCustomer[customerId]).toBeDefined();
    const expectedBillingAmount = 3 * 120000;
    expect(result.aggregatedBillingByCustomer[customerId].totalAmount).toBe(expectedBillingAmount);
    
    // 検証3: サービス別請求額が計算されている
    expect(result.aggregatedBillingByService).toBeDefined();
    expect(result.aggregatedBillingByService[serviceId]).toBeDefined();
    expect(result.aggregatedBillingByService[serviceId].totalAmount).toBe(expectedBillingAmount);
    
    // 検証4: SLA時間内に反映完了
    const elapsedMs = customerApprovalTimestamp.getTime() - changeRequestTimestamp.getTime();
    expect(elapsedMs).toBeLessThanOrEqual(slaThresholdMs);
    expect(result.slaCompliant).toBe(true);
    
    // 検証5: 契約・請求データの一致確認
    expect(result.contractAndBillingConsistent).toBe(true);
    
    // 検証6: 監査ログに全プロセスが記録されている
    expect(result.auditLog).toBeDefined();
    expect(result.auditLog).toHaveLength(5);
    
    // 監査ログ項目の確認
    const auditEntries = result.auditLog.map((entry: any) => entry.action);
    expect(auditEntries).toContain('contract_change_requested');
    expect(auditEntries).toContain('customer_approval_granted');
    expect(auditEntries).toContain('contract_data_updated');
    expect(auditEntries).toContain('billing_data_updated');
    expect(auditEntries).toContain('data_consistency_verified');
    
    // 検証7: 各監査ログエントリにタイムスタンプが記録されている
    result.auditLog.forEach((entry: any) => {
      expect(entry.timestamp).toBeDefined();
      expect(typeof entry.timestamp).toBe('object');
    });
    
    // 検証8: 最後の監査ログエントリのタイムスタンプが顧客承認完了後
    const lastAuditEntry = result.auditLog[result.auditLog.length - 1];
    expect(new Date(lastAuditEntry.timestamp).getTime()).toBeGreaterThanOrEqual(
      customerApprovalTimestamp.getTime()
    );
    
    // 検証9: データ更新完了タイムスタンプがSLA時間内
    expect(result.dataUpdateCompletedTimestamp).toBeDefined();
    const updateElapsedMs = 
      new Date(result.dataUpdateCompletedTimestamp).getTime() - changeRequestTimestamp.getTime();
    expect(updateElapsedMs).toBeLessThanOrEqual(slaThresholdMs);
  });
});