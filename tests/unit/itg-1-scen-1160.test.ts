import { detectInvalidDeliveries } from "../../src/logic/it-1-2-1";

describe("営業成果データから請求対象項目を自動抽出し、顧客ごと・サービスごとの請求額を集計する機能", () => {
  test("SCEN-1160: 配信停止フラグが有効な顧客企業が配信リストに含まれている場合、誤配信として検出される", () => {
    // テストデータ: 配信停止フラグが'true'に設定された顧客企業レコード
    const delivery_list = [
      {
        customer_enterprise_id: "CUST001",
        enterprise_name: "株式会社A",
        distribution_stop_flag: false,
        monthly_report_month: "2024-01",
      },
      {
        customer_enterprise_id: "CUST002",
        enterprise_name: "株式会社B",
        distribution_stop_flag: true,
        monthly_report_month: "2024-01",
      },
      {
        customer_enterprise_id: "CUST003",
        enterprise_name: "株式会社C",
        distribution_stop_flag: true,
        monthly_report_month: "2024-01",
      },
      {
        customer_enterprise_id: "CUST004",
        enterprise_name: "株式会社D",
        distribution_stop_flag: false,
        monthly_report_month: "2024-01",
      },
    ];

    // 配信リスト妥当性確認処理を実行
    const result = detectInvalidDeliveries(delivery_list);

    // 期待結果: 配信停止フラグが有効な顧客企業が誤配信として検出される
    expect(result).toEqual({
      is_valid: false,
      invalid_delivery_count: 2,
      invalid_deliveries: [
        {
          customer_enterprise_id: "CUST002",
          enterprise_name: "株式会社B",
          distribution_stop_flag: true,
          error_message: "配信停止フラグが有効です",
        },
        {
          customer_enterprise_id: "CUST003",
          enterprise_name: "株式会社C",
          distribution_stop_flag: true,
          error_message: "配信停止フラグが有効です",
        },
      ],
    });

    // 誤配信対象について、エラー情報（顧客企業ID、企業名、配信停止フラグ状態）を確認
    expect(result.invalid_deliveries.length).toBe(2);
    expect(result.invalid_deliveries[0].customer_enterprise_id).toBe("CUST002");
    expect(result.invalid_deliveries[0].enterprise_name).toBe("株式会社B");
    expect(result.invalid_deliveries[0].distribution_stop_flag).toBe(true);
    expect(result.invalid_deliveries[1].customer_enterprise_id).toBe("CUST003");
    expect(result.invalid_deliveries[1].enterprise_name).toBe("株式会社C");
    expect(result.invalid_deliveries[1].distribution_stop_flag).toBe(true);

    // 配信可能な顧客企業のみが有効なリストとして識別される
    expect(result.is_valid).toBe(false);
  });
});