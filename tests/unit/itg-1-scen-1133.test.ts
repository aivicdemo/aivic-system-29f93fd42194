import { extractValidDistributionList } from "../../src/logic/it-1-2-1";

describe("営業成果データから請求対象項目を自動抽出し、顧客ごと・サービスごとの請求額を集計する機能", () => {
  // SCEN-1133
  test("配信リスト妥当性確認 - 契約状態が失効した顧客も含めた配信リストから最新ステータスの顧客のみが抽出される", () => {
    const distributionList = [
      {
        customerId: "CUST001",
        customerName: "顧客A",
        contractStatus: "有効",
        statusUpdatedAt: new Date("2024-12-15T10:00:00Z"),
        previousStatusUpdatedAt: new Date("2024-11-15T10:00:00Z"),
        previousStatus: "休止",
      },
      {
        customerId: "CUST002",
        customerName: "顧客B",
        contractStatus: "失効",
        statusUpdatedAt: new Date("2024-12-10T09:00:00Z"),
        previousStatusUpdatedAt: new Date("2024-11-10T09:00:00Z"),
        previousStatus: "有効",
      },
      {
        customerId: "CUST003",
        customerName: "顧客C",
        contractStatus: "休止",
        statusUpdatedAt: new Date("2024-12-20T14:30:00Z"),
        previousStatusUpdatedAt: new Date("2024-11-20T14:30:00Z"),
        previousStatus: "有効",
      },
    ];

    const result = extractValidDistributionList(distributionList);

    expect(result).toHaveLength(2);
    expect(result.map((c) => c.customerId)).toEqual(["CUST001", "CUST003"]);
    expect(result.map((c) => c.contractStatus)).toEqual(["有効", "休止"]);

    const customer1 = result.find((c) => c.customerId === "CUST001");
    expect(customer1).toBeDefined();
    expect(customer1?.statusUpdatedAt).toEqual(
      new Date("2024-12-15T10:00:00Z")
    );
    expect(customer1?.previousStatusUpdatedAt).toEqual(
      new Date("2024-11-15T10:00:00Z")
    );

    const customer3 = result.find((c) => c.customerId === "CUST003");
    expect(customer3).toBeDefined();
    expect(customer3?.statusUpdatedAt).toEqual(
      new Date("2024-12-20T14:30:00Z")
    );
    expect(customer3?.previousStatusUpdatedAt).toEqual(
      new Date("2024-11-20T14:30:00Z")
    );

    const excludedCustomer = result.find((c) => c.customerId === "CUST002");
    expect(excludedCustomer).toBeUndefined();

    result.forEach((customer) => {
      expect(customer.contractStatus).not.toBe("失効");
      expect(["有効", "休止"]).toContain(customer.contractStatus);
    });
  });
});