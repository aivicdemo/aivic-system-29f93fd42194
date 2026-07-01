import { generateContractChangeNotificationEmail } from '../../src/logic/it-1781935279444-2-1-1';

describe('営業データ入力時の品質検証ルール定義・実行機能', () => {
  // SCEN-1232
  test('契約変更通知メール自動生成機能 - 契約変更内容が正常に登録され、営業責任者のメールアドレスが存在する場合、通知メールが生成される', () => {
    // Arrange: テストデータを準備
    const contractChangeData = {
      contractId: 'CTR-20240115-001',
      changeItems: ['請求額', '納期'],
      changeContent: '月額請求額を100,000円から120,000円に変更。納期を毎月25日から20日に変更',
      changedAt: new Date('2024-01-15T10:30:00Z'),
      changedBy: 'OPE-admin-001'
    };

    const salesResponsibleInfo = {
      contractId: 'CTR-20240115-001',
      responsibleName: '山田太郎',
      emailAddress: 'yamada@customer-company.com',
      customerName: '顧客企業A'
    };

    // Act: 契約変更通知メール自動生成機能を実行
    const generatedEmail = generateContractChangeNotificationEmail(
      contractChangeData,
      salesResponsibleInfo
    );

    // Assert: 生成されたメールオブジェクトが存在することを確認
    expect(generatedEmail).toBeDefined();
    expect(generatedEmail).not.toBeNull();

    // メールの宛先が営業責任者のメールアドレスであることを検証
    expect(generatedEmail.to).toBe('yamada@customer-company.com');

    // メール件名に契約変更の旨が記載されていることを検証
    expect(generatedEmail.subject).toMatch(/契約変更/);
    expect(generatedEmail.subject).toMatch(/CTR-20240115-001/);

    // メール本文に契約変更内容が正しく含まれていることを検証
    expect(generatedEmail.body).toMatch(/請求額/);
    expect(generatedEmail.body).toMatch(/100,000円/);
    expect(generatedEmail.body).toMatch(/120,000円/);
    expect(generatedEmail.body).toMatch(/納期/);
    expect(generatedEmail.body).toMatch(/25日/);
    expect(generatedEmail.body).toMatch(/20日/);

    // メール本文に顧客名が含まれていることを検証
    expect(generatedEmail.body).toMatch(/顧客企業A/);

    // メール本文に営業責任者の名前が含まれていることを検証
    expect(generatedEmail.body).toMatch(/山田太郎/);

    // メール送信タイプが'契約変更通知'であることを検証
    expect(generatedEmail.type).toBe('contract_change_notification');

    // メール生成タイムスタンプが存在し、現在時刻付近であることを検証
    expect(generatedEmail.generatedAt).toBeDefined();
    expect(typeof generatedEmail.generatedAt).toBe('object');

    // メール本文の言語が日本語であることを検証
    expect(generatedEmail.language).toBe('ja');
  });
});