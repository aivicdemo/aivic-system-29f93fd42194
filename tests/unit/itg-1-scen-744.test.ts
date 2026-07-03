import { extractBillableItems } from '../../src/logic/it-1-2-1';

describe('営業成果データから請求対象項目を自動抽出し、顧客ごと・サービスごとの請求額を集計する機能', () => {
  // SCEN-744: [error] 請求対象項目の自動抽出・集計 - 請求ルールが定義されていない項目またはサービスは請求対象から除外される
  test('請求ルールが定義されていない項目またはサービスは請求対象から除外される', () => {
    // 前提: 営業データと請求ルール定義が存在し、一部の項目・サービスの請求ルールが未定義
    const sales_data = {
      customer_id: 'CUST001',
      customer_name: '顧客A',
      service_items: [
        {
          service_id: 'SVC001',
          service_name: '営業支援',
          item_id: 'ITEM001',
          item_name: 'アポ数',
          value: 10,
          unit: '件',
        },
        {
          service_id: 'SVC001',
          service_name: '営業支援',
          item_id: 'ITEM002',
          item_name: '成約数',
          value: 3,
          unit: '件',
        },
        {
          service_id: 'SVC002',
          service_name: '未定義サービス',
          item_id: 'ITEM003',
          item_name: '顧客反応',
          value: 25,
          unit: '%',
        },
        {
          service_id: 'SVC001',
          service_name: '営業支援',
          item_id: 'ITEM004',
          item_name: '未定義項目',
          value: 5,
          unit: 'pt',
        },
      ],
      period: {
        start_date: '2024-01-01',
        end_date: '2024-01-31',
      },
    };

    const billing_rules = {
      CUST001: {
        SVC001: [
          {
            item_id: 'ITEM001',
            item_name: 'アポ数',
            unit_price: 1000,
            min_qty: 1,
            max_qty: 100,
          },
          {
            item_id: 'ITEM002',
            item_name: '成約数',
            unit_price: 5000,
            min_qty: 1,
            max_qty: 50,
          },
        ],
      },
    };

    const excluded_items_log: string[] = [];

    // 発生条件: 請求対象の自動抽出機能を実行する
    const result = extractBillableItems(
      sales_data,
      billing_rules,
      excluded_items_log
    );

    // 結果: 請求ルールが定義されていない項目またはサービスは請求対象から除外される
    // 1. ITEM001（アポ数、SVC001）: 請求ルール定義あり → 集計対象
    const item001_result = result.find(
      (item) => item.item_id === 'ITEM001' && item.service_id === 'SVC001'
    );
    expect(item001_result).toBeDefined();
    expect(item001_result?.value).toBe(10);
    expect(item001_result?.billing_amount).toBe(10000); // 10 * 1000

    // 2. ITEM002（成約数、SVC001）: 請求ルール定義あり → 集計対象
    const item002_result = result.find(
      (item) => item.item_id === 'ITEM002' && item.service_id === 'SVC001'
    );
    expect(item002_result).toBeDefined();
    expect(item002_result?.value).toBe(3);
    expect(item002_result?.billing_amount).toBe(15000); // 3 * 5000

    // 3. ITEM003（顧客反応、SVC002 未定義サービス）: 請求ルール未定義 → 除外
    const item003_result = result.find(
      (item) => item.item_id === 'ITEM003' && item.service_id === 'SVC002'
    );
    expect(item003_result).toBeUndefined();

    // 4. ITEM004（未定義項目、SVC001）: 請求ルール未定義 → 除外
    const item004_result = result.find(
      (item) => item.item_id === 'ITEM004' && item.service_id === 'SVC001'
    );
    expect(item004_result).toBeUndefined();

    // 除外処理がログに記録されていることを確認
    expect(excluded_items_log.length).toBeGreaterThan(0);
    const svc002_excluded_log = excluded_items_log.find((log) =>
      log.includes('SVC002')
    );
    expect(svc002_excluded_log).toBeDefined();
    expect(svc002_excluded_log).toMatch(/請求ルール未定義/);

    const item004_excluded_log = excluded_items_log.find((log) =>
      log.includes('ITEM004')
    );
    expect(item004_excluded_log).toBeDefined();
    expect(item004_excluded_log).toMatch(/請求ルール未定義/);

    // 抽出結果の構成確認（定義済みの項目のみが含まれている）
    expect(result.length).toBe(2); // ITEM001 と ITEM002 のみ
    expect(result.every((item) => item.billing_amount !== undefined)).toBe(
      true
    );
  });
});