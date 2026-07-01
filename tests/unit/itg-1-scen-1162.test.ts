import { generateBillingDistributionList } from '../../src/logic/it-1-2-1';

describe('営業成果データから請求対象項目を自動抽出し、顧客ごと・サービスごとの請求額を集計する機能', () => {
  test('SCEN-1162: 配信対象顧客企業が0件の場合、空のリストが正常に返される', () => {
    // Arrange: 配信対象顧客企業が0件の条件を設定
    const input = {
      target_customers: [],
      billing_period_start: '2024-01-01',
      billing_period_end: '2024-01-31',
    };

    // Act: 配信リスト生成機能を呼び出す
    const result = generateBillingDistributionList(input);

    // Assert: 返却されたリストが空配列であることを確認
    expect(Array.isArray(result)).toBe(true);

    // Assert: 返却されたリストの長さが0であることをアサート
    expect(result.length).toBe(0);

    // Assert: 返却されたオブジェクトのデータ型が正しい（空配列型）ことを検証
    expect(result).toEqual([]);

    // Assert: エラーが発生していないことを確認（正常終了）
    expect(result).toBeDefined();
  });
});