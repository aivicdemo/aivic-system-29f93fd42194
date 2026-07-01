import { describe, test, expect } from "@jest/globals";
import { validateContractIdAndFetchReport } from "../../src/logic/it-1-2-1";

describe("営業成果データから請求対象項目を自動抽出し、顧客ごと・サービスごとの請求額を集計する機能", () => {
  test("SCEN-660: 割り当て契約IDが空の場合、レポートが表示されず、エラーメッセージが表示される", () => {
    const emptyContractId = "";
    const userId = "user_001";

    expect(() =>
      validateContractIdAndFetchReport({ contractId: emptyContractId, userId })
    ).toThrow(/契約ID/);
  });

  test("SCEN-661: 有効な契約IDが提供される場合、レポートが正常に取得され、顧客ごと・サービスごとの請求額が返される", () => {
    const contractId = "contract_12345";
    const userId = "user_001";

    const result = validateContractIdAndFetchReport({
      contractId,
      userId,
    });

    expect(result).toEqual({
      contractId: "contract_12345",
      customerId: "cust_abc",
      serviceBillingAmounts: [
        { serviceId: "svc_001", serviceName: "コンサルティング", amount: 150000 },
        { serviceId: "svc_002", serviceName: "システム構築", amount: 250000 },
      ],
      totalAmount: 400000,
      reportStatus: "available",
    });
  });

  test("SCEN-662: ユーザーが契約IDに対するアクセス権限がない場合、エラーメッセージが表示される", () => {
    const contractId = "contract_99999";
    const userId = "user_unauthorized";

    expect(() =>
      validateContractIdAndFetchReport({ contractId, userId })
    ).toThrow(/権限/);
  });

  test("SCEN-663: 契約IDが存在しない場合、エラーメッセージが表示される", () => {
    const contractId = "contract_nonexistent";
    const userId = "user_001";

    expect(() =>
      validateContractIdAndFetchReport({ contractId, userId })
    ).toThrow(/契約/);
  });

  test("SCEN-664: 複数のサービスを持つ契約の場合、各サービスごとの請求額が正確に集計される", () => {
    const contractId = "contract_multi_service";
    const userId = "user_001";

    const result = validateContractIdAndFetchReport({
      contractId,
      userId,
    });

    expect(result.serviceBillingAmounts).toHaveLength(3);
    expect(result.serviceBillingAmounts[0].amount).toBe(100000);
    expect(result.serviceBillingAmounts[1].amount).toBe(200000);
    expect(result.serviceBillingAmounts[2].amount).toBe(300000);
    expect(result.totalAmount).toBe(600000);
  });

  test("SCEN-665: 契約IDフィールドが null である場合、エラーメッセージが表示される", () => {
    const contractId = null as any;
    const userId = "user_001";

    expect(() =>
      validateContractIdAndFetchReport({ contractId, userId })
    ).toThrow(/契約ID/);
  });

  test("SCEN-666: 複数顧客の契約を持つユーザーが特定の契約IDを指定した場合、その契約に紐付くデータのみが返される", () => {
    const contractId = "contract_cust_001";
    const userId = "user_multi_customer";

    const result = validateContractIdAndFetchReport({
      contractId,
      userId,
    });

    expect(result.contractId).toBe("contract_cust_001");
    expect(result.customerId).toBe("cust_001");
    expect(result.serviceBillingAmounts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ serviceId: "svc_001" }),
      ])
    );
  });

  test("SCEN-667: 請求対象項目が存在しない契約の場合、空のサービスリストが返される", () => {
    const contractId = "contract_empty_billing";
    const userId = "user_001";

    const result = validateContractIdAndFetchReport({
      contractId,
      userId,
    });

    expect(result.serviceBillingAmounts).toEqual([]);
    expect(result.totalAmount).toBe(0);
  });

  test("SCEN-668: 契約IDが特殊文字を含む場合でも、有効な契約IDであれば正常に処理される", () => {
    const contractId = "contract_2024-01-15_abc";
    const userId = "user_001";

    const result = validateContractIdAndFetchReport({
      contractId,
      userId,
    });

    expect(result.contractId).toBe("contract_2024-01-15_abc");
    expect(result.reportStatus).toBe("available");
  });

  test("SCEN-669: 割引が適用された請求の場合、割引後の金額が正確に計算される", () => {
    const contractId = "contract_with_discount";
    const userId = "user_001";

    const result = validateContractIdAndFetchReport({
      contractId,
      userId,
    });

    expect(result.serviceBillingAmounts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          serviceId: "svc_discount",
          amount: 180000,
        }),
      ])
    );
  });
});