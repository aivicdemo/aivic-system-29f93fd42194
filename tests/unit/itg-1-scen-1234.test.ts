import { generateContractChangeNotificationEmail } from '../../src/logic/it-1781935279444-2-1-1';

describe('営業データ入力時の品質検証ルール定義・実行機能', () => {
  // SCEN-1234: [edge] 契約変更通知メール自動生成機能 - 営業責任者のメールアドレスが登録されていない場合、メール生成がスキップされる
  test('should skip email generation and log when sales manager email is not registered', async () => {
    const contractRecord = {
      contract_id: 'CT-2024-001',
      customer_id: 'CUST-001',
      sales_manager_email: null,
      sales_manager_name: '田中太郎',
      contract_change_type: 'pricing_update',
      change_effective_date: '2024-02-01',
      change_description: '単価を10%引き上げ',
    };

    const result = await generateContractChangeNotificationEmail(contractRecord);

    expect(result.email_generated).toBe(false);
    expect(result.skip_reason).toMatch(/メールアドレス/);
    expect(result.email_sent).toBe(false);
    expect(result.system_log_entry).toMatch(/スキップ/);
    expect(result.error_occurred).toBe(false);
  });
});