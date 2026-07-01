import { generateDistributionList } from "../../src/logic/it-1-2-1";

describe("営業成果データから請求対象項目を自動抽出し、顧客ごと・サービスごとの請求額を集計する機能", () => {
  // SCEN-1159
  test("配信リスト妥当性確認・配信漏れ誤配信防止 - 有効な契約状態にある全顧客企業が配信リストに含まれ、配信漏れがないことが確認される", () => {
    // テスト環境のデータベースに有効な契約状態にある顧客企業データを複数件登録
    const validCustomers = [
      {
        customer_id: "CUST001",
        customer_name: "顧客A",
        contract_status: "active",
        contract_start_date: new Date("2024-01-01"),
        contract_end_date: new Date("2025-12-31"),
      },
      {
        customer_id: "CUST002",
        customer_name: "顧客B",
        contract_status: "active",
        contract_start_date: new Date("2023-06-15"),
        contract_end_date: new Date("2026-06-14"),
      },
      {
        customer_id: "CUST003",
        customer_name: "顧客C",
        contract_status: "active",
        contract_start_date: new Date("2024-03-01"),
        contract_end_date: new Date("2025-02-28"),
      },
      {
        customer_id: "CUST004",
        customer_name: "顧客D",
        contract_status: "active",
        contract_start_date: new Date("2024-05-10"),
        contract_end_date: new Date("2025-05-09"),
      },
      {
        customer_id: "CUST005",
        customer_name: "顧客E",
        contract_status: "active",
        contract_start_date: new Date("2024-02-01"),
        contract_end_date: new Date("2025-01-31"),
      },
    ];

    // 無効な契約状態の顧客企業データ
    const inactiveCustomers = [
      {
        customer_id: "CUST006",
        customer_name: "顧客F",
        contract_status: "terminated",
        contract_start_date: new Date("2022-01-01"),
        contract_end_date: new Date("2023-12-31"),
      },
      {
        customer_id: "CUST007",
        customer_name: "顧客G",
        contract_status: "suspended",
        contract_start_date: new Date("2024-01-01"),
        contract_end_date: new Date("2025-12-31"),
      },
    ];

    const allCustomers = [...validCustomers, ...inactiveCustomers];

    // 配信リスト生成ロジックを実行
    const distributionList = generateDistributionList(allCustomers);

    // 生成された配信リストをデータベースから取得（シミュレーション）
    const distributionListSize = distributionList.length;

    // 有効な契約状態の全顧客企業IDのリストを別途取得
    const validCustomerIds = validCustomers.map((c) => c.customer_id);
    const validCustomerCount = validCustomers.length;

    // 配信リストのサイズと有効な契約状態の顧客企業数が一致することを確認
    expect(distributionListSize).toBe(validCustomerCount);
    expect(distributionListSize).toBe(5);

    // 有効な契約状態の各顧客企業が配信リストに存在することをループで検証
    validCustomerIds.forEach((customerId) => {
      const isInDistributionList = distributionList.some(
        (item: { customer_id: string }) => item.customer_id === customerId
      );
      expect(isInDistributionList).toBe(true);
    });

    // 配信リストに含まれる顧客企業が全て有効な契約状態であることを逆検証
    distributionList.forEach((item: { customer_id: string }) => {
      const customer = validCustomers.find(
        (c) => c.customer_id === item.customer_id
      );
      expect(customer).toBeDefined();
      expect(customer?.contract_status).toBe("active");
    });

    // 無効な契約状態の顧客企業が配信リストに含まれていないことを確認
    inactiveCustomers.forEach((inactiveCustomer) => {
      const isNotInDistributionList = !distributionList.some(
        (item: { customer_id: string }) =>
          item.customer_id === inactiveCustomer.customer_id
      );
      expect(isNotInDistributionList).toBe(true);
    });

    // 配信リストの各要素が必須フィールドを持っていることを確認
    distributionList.forEach((item: Record<string, any>) => {
      expect(item.customer_id).toBeDefined();
      expect(typeof item.customer_id).toBe("string");
    });
  });
});