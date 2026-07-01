import { generateDistributionList } from '../../src/logic/it-1-2-1';

describe('営業成果データから請求対象項目を自動抽出し、顧客ごと・サービスごとの請求額を集計する機能', () => {
  // SCEN-1161: [error] 配信リスト妥当性確認・配信漏れ誤配信防止 - 契約満了日を過ぎた顧客企業が配信リストから適切に除外されている
  test('契約満了日を過ぎた顧客企業が配信リストから除外されること', () => {
    const now = new Date('2024-06-15T10:00:00Z');
    const past_date = new Date('2024-01-15T00:00:00Z');
    const future_date = new Date('2024-12-31T23:59:59Z');

    // テストデータベースに契約満了日が過去日付の顧客企業レコードを10件以上作成
    const expired_customers = Array.from({ length: 10 }, (_, i) => ({
      customer_id: `EXPIRED_${i + 1}`,
      customer_name: `Expired Company ${i + 1}`,
      contract_end_date: past_date,
      is_active: true,
    }));

    // テストデータベースに契約満了日が未来日付の顧客企業レコードを5件以上作成
    const active_customers = Array.from({ length: 5 }, (_, i) => ({
      customer_id: `ACTIVE_${i + 1}`,
      customer_name: `Active Company ${i + 1}`,
      contract_end_date: future_date,
      is_active: true,
    }));

    const all_customers = [...expired_customers, ...active_customers];

    // 配信リスト生成機能を実行
    const distribution_list = generateDistributionList(all_customers, now);

    // 生成された配信リストのJSON形式のデータを取得
    expect(Array.isArray(distribution_list)).toBe(true);
    expect(distribution_list.length).toBeGreaterThan(0);

    // 配信リストに含まれる顧客企業IDの一覧を抽出
    const included_customer_ids = distribution_list.map((item: any) => item.customer_id);

    // 抽出した顧客企業IDが契約満了日が過去日付のレコードと重複していないことをアサート
    const expired_customer_ids = expired_customers.map((c) => c.customer_id);
    const overlap = included_customer_ids.filter((id: string) => expired_customer_ids.includes(id));
    expect(overlap.length).toBe(0);

    // 配信リストに含まれる顧客企業IDがすべて契約満了日が未来日付のレコードに属していることをアサート
    const active_customer_ids = active_customers.map((c) => c.customer_id);
    const all_included_in_active = included_customer_ids.every((id: string) =>
      active_customer_ids.includes(id)
    );
    expect(all_included_in_active).toBe(true);

    // 配信リストから除外された顧客企業IDの数が契約満了日が過去日付のレコード数と一致していることをアサート
    const excluded_count = all_customers.length - distribution_list.length;
    expect(excluded_count).toBe(expired_customers.length);

    // 配信リストに含まれるすべての顧客企業がアクティブステータスであることをアサート
    const all_active_status = distribution_list.every((item: any) => item.is_active === true);
    expect(all_active_status).toBe(true);

    // 配信リストの個数が未来日付の顧客企業数と一致していることをアサート
    expect(distribution_list.length).toBe(active_customers.length);
  });
});