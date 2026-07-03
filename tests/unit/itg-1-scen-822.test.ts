import { recordCorrespondenceResult } from '../../src/logic/it-1781935279444-2-1-1';

describe('営業データ入力時の品質検証ルール定義・実行機能', () => {
  // SCEN-822: [edge] 対応結果のポータル記録・監査ログ機能 - 対応内容が最大文字数の境界値で記録された場合も正常に監査ログに保存される
  test('対応内容が最大文字数の境界値で入力された場合、システムは正常に対応結果を保存し、監査ログにも対応内容全文が完全かつ正確に記録される', () => {
    const max_content_length = 5000;
    const boundary_content = 'A'.repeat(max_content_length);
    const user_id = 'user_001';
    const timestamp = new Date('2024-06-15T10:30:00Z');
    const correspondence_id = 'corr_12345';
    const customer_id = 'cust_98765';

    const result = recordCorrespondenceResult({
      correspondence_id: correspondence_id,
      customer_id: customer_id,
      user_id: user_id,
      content: boundary_content,
      status: '対応完了',
      timestamp: timestamp,
    });

    expect(result.success).toBe(true);
    expect(result.correspondence_id).toBe(correspondence_id);
    expect(result.saved_content).toBe(boundary_content);
    expect(result.saved_content.length).toBe(max_content_length);
    expect(result.audit_log).toBeDefined();
    expect(result.audit_log.timestamp).toEqual(timestamp);
    expect(result.audit_log.user_id).toBe(user_id);
    expect(result.audit_log.operation_type).toBe('RECORD_CORRESPONDENCE');
    expect(result.audit_log.content_full_text).toBe(boundary_content);
    expect(result.audit_log.content_length).toBe(max_content_length);
    expect(result.audit_log.status).toBe('対応完了');
    expect(result.audit_log.customer_id).toBe(customer_id);
    expect(result.message).toBe('対応結果を正常に保存しました');
  });
});