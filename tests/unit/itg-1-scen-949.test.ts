import {
  identifyBillingTargetContracts,
} from "../../src/logic/it-1-br-1781935279444-1-2-1";

describe("月次サマリーテンプレートの定義・管理機能", () => {
  test("SCEN-949: [normal] 請求対象契約確認・割引基準識別機能 - 各契約の有効期間が正しく判定され、請求対象契約が正確に抽出される", () => {
    // テストデータ: 複数の契約情報パターン
    const today = new Date("2024-06-15T00:00:00Z");

    const contracts = [
      {
        contractId: "CTR-001",
        customerId: "CUST-A",
        startDate: new Date("2024-01-01T00:00:00Z"),
        endDate: new Date("2024-12-31T23:59:59Z"),
        status: "active",
        contractYears: 1,
        contractAmount: 500000,
        customerSegment: "enterprise",
      },
      {
        contractId: "CTR-002",
        customerId: "CUST-A",
        startDate: new Date("2024-06-15T00:00:00Z"),
        endDate: new Date("2024-06-15T23:59:59Z"),
        status: "active",
        contractYears: 1,
        contractAmount: 300000,
        customerSegment: "enterprise",
      },
      {
        contractId: "CTR-003",
        customerId: "CUST-B",
        startDate: new Date("2024-01-01T00:00:00Z"),
        endDate: new Date("2024-06-14T23:59:59Z"),
        status: "active",
        contractYears: 1,
        contractAmount: 200000,
        customerSegment: "smb",
      },
      {
        contractId: "CTR-004",
        customerId: "CUST-C",
        startDate: new Date("2024-07-01T00:00:00Z"),
        endDate: new Date("2024-12-31T23:59:59Z"),
        status: "active",
        contractYears: 1,
        contractAmount: 400000,
        customerSegment: "startup",
      },
      {
        contractId: "CTR-005",
        customerId: "CUST-B",
        startDate: new Date("2023-01-01T00:00:00Z"),
        endDate: new Date("2024-01-31T23:59:59Z"),
        status: "terminated",
        contractYears: 1,
        contractAmount: 100000,
        customerSegment: "smb",
      },
      {
        contractId: "CTR-006",
        customerId: "CUST-D",
        startDate: new Date("2024-01-01T00:00:00Z"),
        endDate: new Date("2024-12-31T23:59:59Z"),
        status: "suspended",
        contractYears: 2,
        contractAmount: 1000000,
        customerSegment: "enterprise",
      },
      {
        contractId: "CTR-007",
        customerId: "CUST-A",
        startDate: new Date("2024-01-01T00:00:00Z"),
        endDate: new Date("2024-12-31T23:59:59Z"),
        status: "active",
        contractYears: 3,
        contractAmount: 1500000,
        customerSegment: "enterprise",
      },
    ];

    // 割引基準定義
    const discountRules = [
      {
        ruleId: "DISC-YEARS-2",
        type: "contractYears",
        threshold: 2,
        discountRate: 0.1,
      },
      {
        ruleId: "DISC-YEARS-3",
        type: "contractYears",
        threshold: 3,
        discountRate: 0.15,
      },
      {
        ruleId: "DISC-AMOUNT-1M",
        type: "contractAmount",
        threshold: 1000000,
        discountRate: 0.05,
      },
      {
        ruleId: "DISC-SEGMENT-ENT",
        type: "customerSegment",
        threshold: null,
        discountRate: 0.08,
        segment: "enterprise",
      },
    ];

    // 機能実行
    const result = identifyBillingTargetContracts(
      contracts,
      discountRules,
      today
    );

    // 検証1: 請求対象契約の件数（本日有効な契約）
    // 有効な契約: CTR-001, CTR-002（本日が終了日）, CTR-007 = 3件
    // 除外対象: CTR-003（終了済み）, CTR-004（未開始）, CTR-005（terminated）, CTR-006（suspended）
    expect(result.billingTargetContracts.length).toBe(3);

    // 検証2: 請求対象契約に含まれる契約ID
    const billingContractIds = result.billingTargetContracts.map(
      (c) => c.contractId
    );
    expect(billingContractIds).toContain("CTR-001");
    expect(billingContractIds).toContain("CTR-002");
    expect(billingContractIds).toContain("CTR-007");
    expect(billingContractIds).not.toContain("CTR-003");
    expect(billingContractIds).not.toContain("CTR-004");
    expect(billingContractIds).not.toContain("CTR-005");
    expect(billingContractIds).not.toContain("CTR-006");

    // 検証3: 顧客A（CUST-A）の複数契約がそれぞれ正しく判定されているか
    const custAContracts = result.billingTargetContracts.filter(
      (c) => c.customerId === "CUST-A"
    );
    expect(custAContracts.length).toBe(3);

    // CTR-001の検証
    const ctr001 = result.billingTargetContracts.find(
      (c) => c.contractId === "CTR-001"
    );
    expect(ctr001).toBeDefined();
    expect(ctr001?.isValid).toBe(true);
    expect(ctr001?.appliedDiscounts.length).toBeGreaterThanOrEqual(1);

    // CTR-002の検証（終了日が本日）
    const ctr002 = result.billingTargetContracts.find(
      (c) => c.contractId === "CTR-002"
    );
    expect(ctr002).toBeDefined();
    expect(ctr002?.isValid).toBe(true);

    // CTR-007の検証（契約年数3年で割引適用）
    const ctr007 = result.billingTargetContracts.find(
      (c) => c.contractId === "CTR-007"
    );
    expect(ctr007).toBeDefined();
    expect(ctr007?.isValid).toBe(true);
    expect(
      ctr007?.appliedDiscounts.some((d) => d.ruleId === "DISC-YEARS-3")
    ).toBe(true);

    // 検証4: 割引基準の正確な識別
    // CTR-001: enterprise割引 8% + 契約金額50万は1M未満なので金額割引なし
    const ctr001Discounts = ctr001?.appliedDiscounts || [];
    expect(ctr001Discounts.some((d) => d.ruleId === "DISC-SEGMENT-ENT")).toBe(
      true
    );
    expect(ctr001Discounts.some((d) => d.ruleId === "DISC-AMOUNT-1M")).toBe(
      false
    );

    // CTR-007: enterprise割引 8% + 契約年数3年割引 15% + 契約金額150万で1M超過割引 5%
    const ctr007Discounts = ctr007?.appliedDiscounts || [];
    expect(ctr007Discounts.some((d) => d.ruleId === "DISC-SEGMENT-ENT")).toBe(
      true
    );
    expect(ctr007Discounts.some((d) => d.ruleId === "DISC-YEARS-3")).toBe(true);
    expect(ctr007Discounts.some((d) => d.ruleId === "DISC-AMOUNT-1M")).toBe(
      true
    );

    // 検証5: 除外対象の確認
    expect(result.excludedContracts.length).toBe(4);
    const excludedIds = result.excludedContracts.map((c) => c.contractId);
    expect(excludedIds).toContain("CTR-003"); // 終了済み
    expect(excludedIds).toContain("CTR-004"); // 未開始
    expect(excludedIds).toContain("CTR-005"); // terminated
    expect(excludedIds).toContain("CTR-006"); // suspended

    // 検証6: 除外理由の妥当性
    const ctr003Excluded = result.excludedContracts.find(
      (c) => c.contractId === "CTR-003"
    );
    expect(ctr003Excluded?.reason).toMatch(/期間外|終了/);

    const ctr004Excluded = result.excludedContracts.find(
      (c) => c.contractId === "CTR-004"
    );
    expect(ctr004Excluded?.reason).toMatch(/期間外|未開始/);

    const ctr005Excluded = result.excludedContracts.find(
      (c) => c.contractId === "CTR-005"
    );
    expect(ctr005Excluded?.reason).toMatch(/ステータス|終了/);

    const ctr006Excluded = result.excludedContracts.find(
      (c) => c.contractId === "CTR-006"
    );
    expect(ctr006Excluded?.reason).toMatch(/ステータス|停止|休止/);

    // 検証7: 完全性チェック（総件数）
    expect(result.billingTargetContracts.length + result.excludedContracts.length).toBe(
      contracts.length
    );

    // 検証8: 顧客ごとの请求对象契約が正確に抽出されているか
    const custBTarget = result.billingTargetContracts.filter(
      (c) => c.customerId === "CUST-B"
    );
    expect(custBTarget.length).toBe(0); // CUST-Bは有効な契約なし

    const custCTarget = result.billingTargetContracts.filter(
      (c) => c.customerId === "CUST-C"
    );
    expect(custCTarget.length).toBe(0); // CUST-Cは未開始なので除外

    const custDTarget = result.billingTargetContracts.filter(
      (c) => c.customerId === "CUST-D"
    );
    expect(custDTarget.length).toBe(0); // CUST-Dは suspended なので除外

    // 検証9: 各契約のメタデータ確認
    for (const contract of result.billingTargetContracts) {
      expect(contract.contractId).toBeDefined();
      expect(contract.customerId).toBeDefined();
      expect(contract.isValid).toBe(true);
      expect(contract.appliedDiscounts).toBeInstanceOf(Array);
      expect(contract.appliedDiscounts.every((d) => d.ruleId && d.discountRate !== undefined)).toBe(true);
    }

    // 検証10: 割引率の妥当性
    const ctr001AppliedRate = ctr001?.appliedDiscounts.reduce(
      (sum, d) => sum + d.discountRate,
      0
    ) || 0;
    expect(ctr001AppliedRate).toBe(0.08); // enterprise 8% のみ

    const ctr007AppliedRate = ctr007?.appliedDiscounts.reduce(
      (sum, d) => sum + d.discountRate,
      0
    ) || 0;
    // enterprise 8% + 契約年数3年 15% + 契約金額1M超 5% = 28%
    expect(ctr007AppliedRate).toBe(0.28);
  });
});