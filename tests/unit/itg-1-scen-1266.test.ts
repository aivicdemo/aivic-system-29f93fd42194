import { prioritizeContractChanges } from "../../src/logic/it-1781935279444-1-1-1";

describe("営業データ項目のメタデータ管理機能", () => {
  test("SCEN-1266: 複数契約変更の優先順序判定 - 請求額計算への影響度が0円の変更が最後に配置される", () => {
    // テストデータ: 複数の契約変更データ（影響度あり、影響度なし、影響度ありの3件）
    const contractChanges = [
      {
        id: "change_001",
        customerId: "cust_A",
        changeType: "service_expansion",
        billingImpactAmount: 5000,
        changeDate: "2024-02-01",
        affectedServiceIds: ["svc_001"],
      },
      {
        id: "change_002",
        customerId: "cust_B",
        changeType: "price_adjustment",
        billingImpactAmount: 0,
        changeDate: "2024-02-02",
        affectedServiceIds: ["svc_002"],
      },
      {
        id: "change_003",
        customerId: "cust_C",
        changeType: "volume_increase",
        billingImpactAmount: 8500,
        changeDate: "2024-02-03",
        affectedServiceIds: ["svc_003"],
      },
    ];

    // 優先順序判定処理を実行
    const prioritizedList = prioritizeContractChanges(contractChanges);

    // 返却された優先順序リストを検証
    expect(prioritizedList).toHaveLength(3);

    // 影響度が0円の契約変更（change_002）が最後に配置されていることを確認
    expect(prioritizedList[2].id).toBe("change_002");
    expect(prioritizedList[2].billingImpactAmount).toBe(0);

    // 影響度ありの契約変更（change_001とchange_003）が最初の2つの位置に配置されていることを確認
    const impactfulChanges = prioritizedList.slice(0, 2);
    expect(impactfulChanges).toContainEqual(
      expect.objectContaining({
        id: "change_001",
        billingImpactAmount: 5000,
      })
    );
    expect(impactfulChanges).toContainEqual(
      expect.objectContaining({
        id: "change_003",
        billingImpactAmount: 8500,
      })
    );

    // 影響度ありの契約変更が影響度0円の契約変更より前に配置されていることを確認
    const indexChange002 = prioritizedList.findIndex(
      (c) => c.id === "change_002"
    );
    const indexChange001 = prioritizedList.findIndex(
      (c) => c.id === "change_001"
    );
    const indexChange003 = prioritizedList.findIndex(
      (c) => c.id === "change_003"
    );

    expect(indexChange001).toBeLessThan(indexChange002);
    expect(indexChange003).toBeLessThan(indexChange002);
  });

  test("SCEN-1266: 複数契約変更の優先順序判定 - 複数の影響度0円の変更が同一の最低優先度グループに分類される", () => {
    // テストデータ: 影響度0円の契約変更が複数存在するケース
    const contractChanges = [
      {
        id: "change_101",
        customerId: "cust_D",
        changeType: "service_expansion",
        billingImpactAmount: 3000,
        changeDate: "2024-02-10",
        affectedServiceIds: ["svc_004"],
      },
      {
        id: "change_102",
        customerId: "cust_E",
        changeType: "metadata_update",
        billingImpactAmount: 0,
        changeDate: "2024-02-11",
        affectedServiceIds: [],
      },
      {
        id: "change_103",
        customerId: "cust_F",
        changeType: "contact_change",
        billingImpactAmount: 0,
        changeDate: "2024-02-12",
        affectedServiceIds: [],
      },
    ];

    // 優先順序判定処理を実行
    const prioritizedList = prioritizeContractChanges(contractChanges);

    // 返却リストを検証
    expect(prioritizedList).toHaveLength(3);

    // 影響度ありの契約変更が最初に配置されていることを確認
    expect(prioritizedList[0].id).toBe("change_101");
    expect(prioritizedList[0].billingImpactAmount).toBe(3000);

    // 複数の影響度0円の契約変更が最後のグループに配置されていることを確認
    const lastTwoChanges = prioritizedList.slice(1, 3);
    expect(lastTwoChanges).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "change_102",
          billingImpactAmount: 0,
        }),
        expect.objectContaining({
          id: "change_103",
          billingImpactAmount: 0,
        }),
      ])
    );

    // 影響度0円の契約変更がすべて同一の最低優先度グループにあることを確認
    const zeroImpactChanges = prioritizedList.filter(
      (c) => c.billingImpactAmount === 0
    );
    expect(zeroImpactChanges).toHaveLength(2);

    // 影響度0円の契約変更がすべてリストの最後に配置されていることを確認
    const indexChange102 = prioritizedList.findIndex(
      (c) => c.id === "change_102"
    );
    const indexChange103 = prioritizedList.findIndex(
      (c) => c.id === "change_103"
    );
    const indexChange101 = prioritizedList.findIndex(
      (c) => c.id === "change_101"
    );

    expect(indexChange102).toBeGreaterThan(indexChange101);
    expect(indexChange103).toBeGreaterThan(indexChange101);
  });
});