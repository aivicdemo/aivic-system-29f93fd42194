import { processObjectionWithDeadlineCheck } from '../../src/logic/it-1-1-1';

describe('営業成果データの自動検証ルール定義と異常検出機能', () => {
  // SCEN-628: [edge] 異議申し立て・対応ルート分岐 - 確認期限を超過した場合、期限超過のフラグが立てられ自動確定ルートへ分岐される
  test('確認期限を超過した異議申し立てに対して、期限超過フラグが立てられ、ステータスが自動確定ルートへ正しく分岐され、自動確定処理が開始される', () => {
    const currentDateTime = new Date('2024-02-15T10:00:00Z');
    const deadlineDateTime = new Date('2024-02-10T17:00:00Z');
    const objectionId = 'OBJ-20240215-001';
    const customerId = 'CUST-001';
    const invoiceId = 'INV-202402-001';
    const objectionContent = '請求額が契約条件と異なる';

    const input = {
      objectionId,
      customerId,
      invoiceId,
      objectionContent,
      deadlineDateTime,
      currentDateTime,
      objectionStatus: 'pending_review',
      isDeadlineExceeded: false,
      autoConfirmWorkflowQueueId: null as string | null,
    };

    const result = processObjectionWithDeadlineCheck(input);

    // 期限超過フラグが true に設定されていることを確認
    expect(result.isDeadlineExceeded).toBe(true);

    // ステータスが自動確定ルートへ分岐されていることを確認
    expect(result.objectionStatus).toBe('auto_confirmed');

    // ワークフローが自動確定処理の対象キューに登録されていることを確認
    expect(result.autoConfirmWorkflowQueueId).not.toBeNull();
    expect(result.autoConfirmWorkflowQueueId).toMatch(/^QUEUE-AUTO-CONFIRM-\d+$/);

    // 期限超過の判定ロジック検証：deadlineDateTime が currentDateTime より前であることを確認
    expect(deadlineDateTime.getTime()).toBeLessThan(currentDateTime.getTime());

    // オブジェクション ID が保持されていることを確認
    expect(result.objectionId).toBe(objectionId);

    // 顧客 ID が保持されていることを確認
    expect(result.customerId).toBe(customerId);

    // 請求書 ID が保持されていることを確認
    expect(result.invoiceId).toBe(invoiceId);

    // 異議申し立て内容が保持されていることを確認
    expect(result.objectionContent).toBe(objectionContent);
  });
});