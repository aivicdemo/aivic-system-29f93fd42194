import { describe, test, expect } from '@jest/globals';
import { searchEmailHistories } from '../../src/logic/it-1781935279444-1-1-1';

describe('営業データ項目のメタデータ管理機能', () => {
  test('SCEN-807: メール履歴検索・フィルタリング機能 - メール履歴が新しい順にソートされて返却される', () => {
    // Arrange: 複数のメール履歴データ（異なる送受信日時を持つ）を準備
    const email_history_1 = {
      email_history_id: 'EH001',
      contract_id: 'C001',
      sender_email: 'sales@company.com',
      recipient_email: 'customer@example.com',
      subject: '契約内容変更のお知らせ',
      body: '契約内容を更新いたしました。',
      sent_at: new Date('2024-01-10T09:00:00Z'),
      received_at: new Date('2024-01-10T09:15:00Z'),
      created_at: new Date('2024-01-10T09:00:00Z'),
    };

    const email_history_2 = {
      email_history_id: 'EH002',
      contract_id: 'C001',
      sender_email: 'customer@example.com',
      recipient_email: 'sales@company.com',
      subject: '契約内容変更の確認',
      body: '内容を確認いたしました。',
      sent_at: new Date('2024-01-15T14:30:00Z'),
      received_at: new Date('2024-01-15T14:45:00Z'),
      created_at: new Date('2024-01-15T14:30:00Z'),
    };

    const email_history_3 = {
      email_history_id: 'EH003',
      contract_id: 'C001',
      sender_email: 'sales@company.com',
      recipient_email: 'customer@example.com',
      subject: '納期変更のご連絡',
      body: '納期を変更いたします。',
      sent_at: new Date('2024-01-12T11:20:00Z'),
      received_at: new Date('2024-01-12T11:35:00Z'),
      created_at: new Date('2024-01-12T11:20:00Z'),
    };

    const search_condition = {
      contract_id: 'C001',
      sort_order: 'desc', // 新しい順（降順）
    };

    // Act: メール履歴検索を実行
    const result = searchEmailHistories(search_condition, [
      email_history_1,
      email_history_2,
      email_history_3,
    ]);

    // Assert: 返却されたメール履歴が新しい順（降順）にソートされていることを検証
    expect(result).toHaveLength(3);

    // 1件目が最も新しい（2024-01-15）
    expect(result[0].email_history_id).toBe('EH002');
    expect(result[0].sent_at).toEqual(new Date('2024-01-15T14:30:00Z'));

    // 2件目（2024-01-12）
    expect(result[1].email_history_id).toBe('EH003');
    expect(result[1].sent_at).toEqual(new Date('2024-01-12T11:20:00Z'));

    // 3件目が最も古い（2024-01-10）
    expect(result[2].email_history_id).toBe('EH001');
    expect(result[2].sent_at).toEqual(new Date('2024-01-10T09:00:00Z'));

    // 全体でソート順が正しい（前後の日時を比較）
    expect(result[0].sent_at.getTime()).toBeGreaterThan(
      result[1].sent_at.getTime()
    );
    expect(result[1].sent_at.getTime()).toBeGreaterThan(
      result[2].sent_at.getTime()
    );
  });
});