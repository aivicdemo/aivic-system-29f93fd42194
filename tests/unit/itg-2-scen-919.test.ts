import { registerPriceMaster } from '../../src/logic/it-6-3-1';

describe('物価本版管理・メタデータ自動記録機能', () => {
  // SCEN-919
  test('有効期限が設定されていない物価本登録時にシステムが必須項目不足エラーを発生させる', () => {
    const input = {
      priceMasterName: '標準物価本2024',
      versionNumber: '2024-Q1',
      applicableStartDate: '2024-01-01',
      validityEndDate: '',
      userId: 'user-001',
      registrationTimestamp: '2024-01-15T10:30:00Z',
    };

    expect(() => registerPriceMaster(input)).toThrow(/有効期限/);
  });
});