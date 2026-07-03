import { extractBillingContracts } from "../../src/logic/it-1-2-1";

describe("営業成果データから請求対象項目を自動抽出し、顧客ごと・サービスごとの請求額を集計する機能", () => {
  test("SCEN-939: 請求対象サービスが空の契約は請求対象外として除外される", () => {
    // テストデータ: 請求対象サービスが空の契約と正常な契約
    const contracts = [
      {
        contract_id: "CONTRACT_001",
        customer_id: "CUST_A",
        service_ids: [], // 請求対象サービスが空
        base_fee: 10000,
        discount_rate: 0.1,
        effective_date: "2024-01-01",
        end_date: "2024-12-31",
      },
      {
        contract_id: "CONTRACT_002",
        customer_id: "CUST_B",
        service_ids: ["SERVICE_1", "SERVICE_2"], // 請求対象サービスが存在
        base_fee: 15000,
        discount_rate: 0.05,
        effective_date: "2024-01-01",
        end_date: "2024-12-31",
      },
      {
        contract_id: "CONTRACT_003",
        customer_id: "CUST_C",
        service_ids: [], // 請求対象サービスが空
        base_fee: 20000,
        discount_rate: 0,
        effective_date: "2024-01-01",
        end_date: "2024-12-31",
      },
      {
        contract_id: "CONTRACT_004",
        customer_id: "CUST_D",
        service_ids: ["SERVICE_3"], // 請求対象サービスが存在
        base_fee: 25000,
        discount_rate: 0.15,
        effective_date: "2024-01-01",
        end_date: "2024-12-31",
      },
    ];

    const result = extractBillingContracts(contracts);

    // 期待結果: 請求対象サービスが存在する契約のみが返却される
    expect(result.valid_contracts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          contract_id: "CONTRACT_002",
          customer_id: "CUST_B",
          service_ids: ["SERVICE_1", "SERVICE_2"],
        }),
        expect.objectContaining({
          contract_id: "CONTRACT_004",
          customer_id: "CUST_D",
          service_ids: ["SERVICE_3"],
        }),
      ])
    );

    // 除外された契約数は 2 件
    expect(result.valid_contracts.length).toBe(2);

    // 除外ログに CONTRACT_001 と CONTRACT_003 が記録されている
    expect(result.excluded_contracts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          contract_id: "CONTRACT_001",
          reason: "請求対象サービスが空",
        }),
        expect.objectContaining({
          contract_id: "CONTRACT_003",
          reason: "請求対象サービスが空",
        }),
      ])
    );

    // 除外ログの件数は 2 件
    expect(result.excluded_contracts.length).toBe(2);

    // 監査ログが生成されている
    expect(result.audit_log).toBeDefined();
    expect(result.audit_log.length).toBeGreaterThan(0);

    // 監査ログに除外契約の記録が含まれている
    expect(result.audit_log).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          contract_id: "CONTRACT_001",
          action: "exclude",
          reason: "請求対象サービスが空",
        }),
        expect.objectContaining({
          contract_id: "CONTRACT_003",
          action: "exclude",
          reason: "請求対象サービスが空",
        }),
      ])
    );

    // 正常な契約は割引ルールが正確に適用されている
    const contract_002_record = result.valid_contracts.find(
      (c) => c.contract_id === "CONTRACT_002"
    );
    expect(contract_002_record).toBeDefined();
    expect(contract_002_record?.base_fee).toBe(15000);
    expect(contract_002_record?.discount_rate).toBe(0.05);
    const expected_discounted_fee_002 = 15000 * (1 - 0.05); // 14250
    expect(contract_002_record?.billing_amount).toBe(expected_discounted_fee_002);

    const contract_004_record = result.valid_contracts.find(
      (c) => c.contract_id === "CONTRACT_004"
    );
    expect(contract_004_record).toBeDefined();
    expect(contract_004_record?.base_fee).toBe(25000);
    expect(contract_004_record?.discount_rate).toBe(0.15);
    const expected_discounted_fee_004 = 25000 * (1 - 0.15); // 21250
    expect(contract_004_record?.billing_amount).toBe(expected_discounted_fee_004);

    // システムエラーが発生していないことを確認
    expect(result.error).toBeUndefined();
    expect(result.success).toBe(true);
  });
});