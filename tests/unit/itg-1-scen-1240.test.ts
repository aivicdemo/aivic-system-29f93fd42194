import { optimizeContractChangeNotificationOrder } from "../../src/logic/it-1781935279444-2-2-1";

describe("契約変更通知順序最適化機能", () => {
  // SCEN-1240
  test("異なる顧客への変更通知の順序が請求額影響度で正確に並序される", () => {
    // テストデータ準備: 異なる請求額影響度を持つ複数の顧客契約変更情報
    const contractChanges = [
      {
        customerId: "CUST001",
        contractChangeId: "CHG001",
        billingImpactAmount: 50000,
      },
      {
        customerId: "CUST002",
        contractChangeId: "CHG002",
        billingImpactAmount: 150000,
      },
      {
        customerId: "CUST003",
        contractChangeId: "CHG003",
        billingImpactAmount: 75000,
      },
      {
        customerId: "CUST004",
        contractChangeId: "CHG004",
        billingImpactAmount: 150000,
      },
      {
        customerId: "CUST005",
        contractChangeId: "CHG005",
        billingImpactAmount: 0,
      },
    ];

    // 契約変更通知順序最適化機能を実行
    const optimizedOrder = optimizeContractChangeNotificationOrder(
      contractChanges
    );

    // 返却された配列内の各顧客の請求額影響度を確認
    expect(optimizedOrder).toHaveLength(5);

    // 配列の前から順に請求額影響度が降順（大きい順）に並んでいることを検証
    expect(optimizedOrder[0].billingImpactAmount).toBe(150000);
    expect(optimizedOrder[1].billingImpactAmount).toBe(150000);
    expect(optimizedOrder[2].billingImpactAmount).toBe(75000);
    expect(optimizedOrder[3].billingImpactAmount).toBe(50000);
    expect(optimizedOrder[4].billingImpactAmount).toBe(0);

    // 同一の請求額影響度を持つ顧客（CUST002と CUST004）が存在する場合、
    // それらの相対的な順序が一貫していることを確認
    const highImpactCustomers = optimizedOrder
      .filter((item) => item.billingImpactAmount === 150000)
      .map((item) => item.customerId);
    expect(highImpactCustomers).toHaveLength(2);
    expect(highImpactCustomers).toContain("CUST002");
    expect(highImpactCustomers).toContain("CUST004");

    // エッジケース: 請求額影響度が0の顧客が配列の末尾に配置されていることを確認
    expect(optimizedOrder[optimizedOrder.length - 1].billingImpactAmount).toBe(
      0
    );
    expect(optimizedOrder[optimizedOrder.length - 1].customerId).toBe(
      "CUST005"
    );

    // 全体的な順序検証: 降順が保証されていることを確認
    for (let i = 0; i < optimizedOrder.length - 1; i++) {
      expect(optimizedOrder[i].billingImpactAmount).toBeGreaterThanOrEqual(
        optimizedOrder[i + 1].billingImpactAmount
      );
    }
  });
});