import { determineDistributionEligibility } from "../../src/logic/it-1781935279444-2-1-1";

describe("顧客企業別配信リスト確認 - 配信停止フラグ部分設定時の判定", () => {
  // SCEN-1137
  test("配信停止フラグが部分的に設定されている複数契約の配信リスト判定が正確に行われる", () => {
    // テストデータ: 同一顧客企業に紐付く複数の契約
    const contracts = [
      {
        contract_id: "C001",
        customer_id: "CUST-001",
        contract_name: "基本契約A",
        status: "active",
        distribution_stop_flag: false,
      },
      {
        contract_id: "C002",
        customer_id: "CUST-001",
        contract_name: "基本契約B",
        status: "active",
        distribution_stop_flag: true, // 配信停止フラグ設定
      },
      {
        contract_id: "C003",
        customer_id: "CUST-001",
        contract_name: "追加契約C",
        status: "active",
        distribution_stop_flag: false,
      },
      {
        contract_id: "C004",
        customer_id: "CUST-001",
        contract_name: "追加契約D",
        status: "active",
        distribution_stop_flag: true, // 配信停止フラグ設定
      },
      {
        contract_id: "C005",
        customer_id: "CUST-001",
        contract_name: "追加契約E",
        status: "active",
        distribution_stop_flag: false,
      },
    ];

    const customer_id = "CUST-001";

    // 関数実行
    const result = determineDistributionEligibility({
      contracts,
      customer_id,
    });

    // 期待結果の検証

    // 1. 配信対象契約の確認（配信停止フラグが false の契約のみ）
    expect(result.eligible_contracts).toEqual([
      {
        contract_id: "C001",
        customer_id: "CUST-001",
        contract_name: "基本契約A",
        status: "active",
        distribution_stop_flag: false,
      },
      {
        contract_id: "C003",
        customer_id: "CUST-001",
        contract_name: "追加契約C",
        status: "active",
        distribution_stop_flag: false,
      },
      {
        contract_id: "C005",
        customer_id: "CUST-001",
        contract_name: "追加契約E",
        status: "active",
        distribution_stop_flag: false,
      },
    ]);

    // 2. 配信停止契約の確認（配信停止フラグが true の契約）
    expect(result.stopped_contracts).toEqual([
      {
        contract_id: "C002",
        customer_id: "CUST-001",
        contract_name: "基本契約B",
        status: "active",
        distribution_stop_flag: true,
      },
      {
        contract_id: "C004",
        customer_id: "CUST-001",
        contract_name: "追加契約D",
        status: "active",
        distribution_stop_flag: true,
      },
    ]);

    // 3. 配信対象件数の検証
    expect(result.eligible_count).toBe(3);

    // 4. 配信停止件数の検証
    expect(result.stopped_count).toBe(2);

    // 5. 総契約件数の検証
    expect(result.total_count).toBe(5);

    // 6. 配信対象件数 + 配信停止件数 = 総契約件数
    expect(result.eligible_count + result.stopped_count).toBe(
      result.total_count
    );

    // 7. 顧客ID の確認
    expect(result.customer_id).toBe("CUST-001");

    // 8. 配信可能フラグの確認（配信対象契約が 0 でない場合は true）
    expect(result.can_distribute).toBe(true);

    // 9. 配信対象契約の各要素について、配信停止フラグが false であることを検証
    result.eligible_contracts.forEach((contract) => {
      expect(contract.distribution_stop_flag).toBe(false);
    });

    // 10. 配信停止契約の各要素について、配信停止フラグが true であることを検証
    result.stopped_contracts.forEach((contract) => {
      expect(contract.distribution_stop_flag).toBe(true);
    });
  });
});