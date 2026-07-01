import { approveInvoiceAndTransitionToPayment } from '../../src/logic/it-1-2-1';

describe('請求額確定フロー - 顧客企業による請求内容承認と支払い処理フロー自動移行', () => {
  test('SCEN-621: 顧客企業が請求内容を承認すると請求額が確定し支払い処理フローへ自動移行する', () => {
    // === 前提条件 ===
    // 営業システムから抽出された顧客ごと・サービスごとの営業成果データ（アポ数、成約数など）が存在する状態
    // 月次締め日に請求額計算が完了し、請求書が顧客企業に配信された状態
    // 顧客企業がポータルで請求内容を確認できる環境が整っている

    // === 入力データ ===
    const invoiceId = 'INV-2024-001-CUST-A-SVC-001';
    const customerId = 'CUST-A';
    const serviceId = 'SVC-001';
    const contractId = 'CONTRACT-2024-001';
    const invoiceAmount = 150000; // 契約の基本料金 100,000 + 成果報酬（アポ数 10 * 単価 3,000 = 30,000 + 成約数 2 * 単価 10,000 = 20,000）
    const invoiceStatus = '未承認';
    const invoicePeriodStart = '2024-01-01';
    const invoicePeriodEnd = '2024-01-31';
    const approverUserId = 'PORTAL_USER_CUST_A_001';
    const approvalTimestamp = '2024-02-05T14:30:00Z';

    // === 実行 ===
    const result = approveInvoiceAndTransitionToPayment({
      invoiceId: invoiceId,
      customerId: customerId,
      serviceId: serviceId,
      contractId: contractId,
      invoiceAmount: invoiceAmount,
      invoiceStatus: invoiceStatus,
      invoicePeriodStart: invoicePeriodStart,
      invoicePeriodEnd: invoicePeriodEnd,
      approverUserId: approverUserId,
      approvalTimestamp: approvalTimestamp,
    });

    // === 期待結果の検証 ===
    // 1. 承認処理が正常に完了し、戻り値が success を示す
    expect(result.success).toBe(true);

    // 2. 請求ステータスが「承認済み」に更新される
    expect(result.invoiceStatusAfterApproval).toBe('承認済み');

    // 3. 請求額が確定する（確定額が入力額と一致）
    expect(result.confirmedAmount).toBe(150000);

    // 4. 承認者情報がシステムに記録される
    expect(result.approverUserId).toBe('PORTAL_USER_CUST_A_001');
    expect(result.approvalTimestamp).toBe('2024-02-05T14:30:00Z');

    // 5. 支払い処理フロー用のキューに登録される
    expect(result.paymentQueueRegistered).toBe(true);

    // 6. 支払い処理フローの ID が生成される
    expect(result.paymentFlowId).toBeDefined();
    expect(typeof result.paymentFlowId).toBe('string');
    expect(result.paymentFlowId.length).toBeGreaterThan(0);

    // 7. 支払い処理フロー画面への遷移指示が発行される
    expect(result.transitionToPaymentFlow).toBe(true);

    // 8. 支払い処理フローのステータスが「支払い待機中」に設定される
    expect(result.paymentFlowStatus).toBe('支払い待機中');

    // 9. 確定した請求情報が正しく格納される
    expect(result.confirmedInvoiceData).toEqual({
      invoiceId: 'INV-2024-001-CUST-A-SVC-001',
      customerId: 'CUST-A',
      serviceId: 'SVC-001',
      contractId: 'CONTRACT-2024-001',
      confirmedAmount: 150000,
      invoiceStatus: '承認済み',
      invoicePeriodStart: '2024-01-01',
      invoicePeriodEnd: '2024-01-31',
      approvalTimestamp: '2024-02-05T14:30:00Z',
    });

    // 10. 監査ログが記録される
    expect(result.auditLogCreated).toBe(true);
    expect(result.auditLogEntry).toEqual({
      action: '請求承認',
      invoiceId: 'INV-2024-001-CUST-A-SVC-001',
      customerId: 'CUST-A',
      approverUserId: 'PORTAL_USER_CUST_A_001',
      timestamp: '2024-02-05T14:30:00Z',
      resultStatus: '成功',
    });

    // 11. 通知がシステムに準備される（顧客・営業代行企業の双方へ）
    expect(result.notificationsQueued).toBe(true);
    expect(result.notificationCount).toBe(2);

    // 12. 請求関連データが正しく連鎖更新されることを検証
    expect(result.relatedDataUpdated).toBe(true);
    expect(result.paymentScheduleGenerated).toBe(true);
  });
});