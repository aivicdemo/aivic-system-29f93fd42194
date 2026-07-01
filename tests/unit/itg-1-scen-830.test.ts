import { notifyRepresentativeConsultation } from '../../src/logic/it-1-1-1';

describe('営業成果データの自動検証ルール定義と異常検出機能', () => {
  // SCEN-830
  test('代表への相談内容通知機能 - 営業責任者からの相談内容が代表に正常に受け渡され、タイムスタンプと対応者情報が自動付与される', () => {
    const consultation_input = {
      sender_account_id: 'sales_manager_001',
      sender_name: '営業責任者 太郎',
      sender_department: '営業部',
      sender_contact: '090-1234-5678',
      consultation_title: '請求額の計算方法について質問',
      consultation_detail: '今月の請求額が前月比で30%増加している理由を確認したい',
      priority_level: 'high',
    };

    const current_timestamp = new Date('2024-01-15T14:30:00Z');

    const result = notifyRepresentativeConsultation(
      consultation_input,
      current_timestamp
    );

    expect(result.status).toBe('success');
    expect(result.notification_id).toBeDefined();
    expect(result.notification_id).toMatch(/^notif_/);

    expect(result.sender_info).toEqual({
      account_id: 'sales_manager_001',
      name: '営業責任者 太郎',
      department: '営業部',
      contact: '090-1234-5678',
    });

    expect(result.consultation_content).toEqual({
      title: '請求額の計算方法について質問',
      detail: '今月の請求額が前月比で30%増加している理由を確認したい',
      priority: 'high',
    });

    expect(result.timestamp_sent).toBe('2024-01-15T14:30:00Z');

    expect(result.recipient_info).toEqual({
      account_id: 'representative_001',
      role: 'representative',
    });

    expect(result.metadata).toEqual({
      notification_type: 'consultation_inquiry',
      read_status: false,
      created_at: '2024-01-15T14:30:00Z',
    });
  });
});