import { describe, test, expect, beforeEach } from '@jest/globals';
import { validateAndQueueContractChangeNotification } from '../../src/logic/it-1781935279444-2-2-1';

describe('営業データの完全性・正確性を自動検証し、不足データ・誤りを検出・通知する機能', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-1206
  test('[edge] 変更内容メール自動生成・送信キュー追加 - メールアドレスが空文字列の場合、無効なアドレスとして検出され処理が中止される', () => {
    const contractChangeRecord = {
      contract_id: 'CT-20240115-001',
      customer_name: '顧客企業A',
      change_type: '納期変更',
      change_content: '納期を2024年2月15日から2024年3月15日に変更',
      change_date: new Date('2024-01-15T10:00:00Z'),
      contact_email: '',
      contact_name: '営業責任者太郎',
    };

    const result = validateAndQueueContractChangeNotification(contractChangeRecord);

    expect(result.success).toBe(false);
    expect(result.error_code).toBe('INVALID_EMAIL');
    expect(result.error_message).toMatch(/メールアドレス/);
    expect(result.queued_for_send).toBe(false);
    expect(result.email_queue_id).toBeNull();
    expect(result.validation_errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          field: 'contact_email',
          reason: 'empty',
        }),
      ])
    );
  });
});