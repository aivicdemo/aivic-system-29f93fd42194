import { extractBillingItemsForCustomersAndServices } from '../../src/logic/it-1-2-1';

describe('営業成果データから請求対象項目を自動抽出し、顧客ごと・サービスごとの請求額を集計する機能', () => {
  // SCEN-1134: [edge] 配信リスト妥当性確認 - 配信対象顧客が0件の場合も正常に処理され、配信不可と判定される
  test('配信対象顧客が0件の場合、配信不可と判定され、理由が正しく記録される', () => {
    // 配信対象顧客が0件になる条件を設定
    const salesData = [];
    const contractRules = [
      {
        customerId: 'CUST001',
        serviceId: 'SVC001',
        unitPrice: 10000,
        discountRate: 0.1,
      },
      {
        customerId: 'CUST002',
        serviceId: 'SVC002',
        unitPrice: 5000,
        discountRate: 0,
      },
    ];

    const result = extractBillingItemsForCustomersAndServices({
      salesData,
      contractRules,
    });

    // システムが正常に処理を完了していることを確認
    expect(result).toBeDefined();
    expect(result).not.toBeNull();

    // 配信判定結果が「配信不可」と判定される
    expect(result.canDeliver).toBe(false);

    // 配信不可の理由が「対象顧客なし」と正しく記録されている
    expect(result.reason).toBe('対象顧客なし');

    // エラーフラグが設定されていない（正常処理）
    expect(result.hasError).toBe(false);

    // 請求対象項目リストが空配列
    expect(result.billingItems).toEqual([]);

    // 顧客ごと集計が空オブジェクト
    expect(result.summaryByCustomer).toEqual({});

    // サービスごと集計が空オブジェクト
    expect(result.summaryByService).toEqual({});

    // メッセージが適切に設定されている
    expect(result.message).toMatch(/対象顧客/);
  });
});