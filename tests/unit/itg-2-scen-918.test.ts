import { registerNewPriceBook } from '../../src/logic/it-6-2-2-1';

describe('物価本版管理・メタデータ自動記録機能', () => {
  // SCEN-918
  test('新規物価本登録時にメタデータが自動記録される', () => {
    // 入力: 新規物価本の基本情報
    const input = {
      name: '2024年度版建設物価',
      category: 'construction',
      content: '建設工事の標準単価を掲載',
      registrationDate: new Date('2024-01-15T10:30:00Z'),
    };

    // 実行
    const result = registerNewPriceBook(input);

    // 期待値の計算（structured.formula に従う）
    // 1) 版番号: 新規登録時は1.0で自動設定
    const expectedVersionNumber = '1.0';

    // 2) 公開日: 登録実行日の日付で自動記録
    const expectedPublicationDate = new Date('2024-01-15').toISOString().split('T')[0];

    // 3) 有効期限: システム設定の標準値（1年間）で自動計算
    const registrationDateObj = new Date('2024-01-15');
    const expirationDateObj = new Date(registrationDateObj);
    expirationDateObj.setFullYear(expirationDateObj.getFullYear() + 1);
    const expectedExpirationDate = expirationDateObj.toISOString().split('T')[0];

    // 4) 廃止予定日: 有効期限の終了日で自動記録
    const expectedDiscontinuationDate = expectedExpirationDate;

    // アサーション
    expect(result.versionNumber).toBe(expectedVersionNumber);
    expect(result.publicationDate).toBe(expectedPublicationDate);
    expect(result.expirationDate).toBe(expectedExpirationDate);
    expect(result.discontinuationDate).toBe(expectedDiscontinuationDate);
    expect(result.name).toBe('2024年度版建設物価');
    expect(result.category).toBe('construction');
    expect(result.isActive).toBe(true);
  });
});