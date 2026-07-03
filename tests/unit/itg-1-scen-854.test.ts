import { validateContractIntegrity } from "../../src/logic/it-1781935279444-2-2-1";

describe("営業データの完全性・正確性を自動検証し、不足データ・誤りを検出・通知する機能", () => {
  // SCEN-854: [error] 契約変更前後の整合性検証機能 - 契約条件の矛盾や不正なパターンが特定される
  test("契約変更前後の整合性検証で矛盾パターンをすべて検出できる", () => {
    // 矛盾パターン1: 開始日が終了日より後の契約
    const pattern1_before = {
      contractId: "CNT001",
      customerId: "CUST001",
      startDate: new Date("2024-03-01T00:00:00Z"),
      endDate: new Date("2024-02-01T00:00:00Z"),
      billingAmount: 100000,
      billingCycle: 30,
      discountRate: 0.1,
    };

    expect(() => validateContractIntegrity(pattern1_before)).toThrow(
      /開始日/
    );

    // 矛盾パターン2: 金額が負数の契約条件
    const pattern2_before = {
      contractId: "CNT002",
      customerId: "CUST002",
      startDate: new Date("2024-01-01T00:00:00Z"),
      endDate: new Date("2024-12-31T00:00:00Z"),
      billingAmount: -50000,
      billingCycle: 30,
      discountRate: 0.05,
    };

    expect(() => validateContractIntegrity(pattern2_before)).toThrow(/金額/);

    // 矛盾パターン3: 変更前後で顧客IDが異なる契約
    const pattern3_before = {
      contractId: "CNT003",
      customerId: "CUST003",
      startDate: new Date("2024-01-01T00:00:00Z"),
      endDate: new Date("2024-12-31T00:00:00Z"),
      billingAmount: 150000,
      billingCycle: 30,
      discountRate: 0.0,
    };

    const pattern3_after = {
      contractId: "CNT003",
      customerId: "CUST999",
      startDate: new Date("2024-01-01T00:00:00Z"),
      endDate: new Date("2024-12-31T00:00:00Z"),
      billingAmount: 150000,
      billingCycle: 30,
      discountRate: 0.0,
    };

    expect(() =>
      validateContractIntegrity({
        before: pattern3_before,
        after: pattern3_after,
      })
    ).toThrow(/顧客ID/);

    // 矛盾パターン4: 請求周期が無効な値（0以下）
    const pattern4_before = {
      contractId: "CNT004",
      customerId: "CUST004",
      startDate: new Date("2024-01-01T00:00:00Z"),
      endDate: new Date("2024-12-31T00:00:00Z"),
      billingAmount: 200000,
      billingCycle: 0,
      discountRate: 0.0,
    };

    expect(() => validateContractIntegrity(pattern4_before)).toThrow(
      /請求周期/
    );

    // 矛盾パターン5: 割引率が100%を超える値
    const pattern5_before = {
      contractId: "CNT005",
      customerId: "CUST005",
      startDate: new Date("2024-01-01T00:00:00Z"),
      endDate: new Date("2024-12-31T00:00:00Z"),
      billingAmount: 120000,
      billingCycle: 30,
      discountRate: 1.5,
    };

    expect(() => validateContractIntegrity(pattern5_before)).toThrow(
      /割引率/
    );

    // 正常系: すべての条件を満たす契約
    const validContract = {
      contractId: "CNT006",
      customerId: "CUST006",
      startDate: new Date("2024-01-01T00:00:00Z"),
      endDate: new Date("2024-12-31T00:00:00Z"),
      billingAmount: 100000,
      billingCycle: 30,
      discountRate: 0.1,
    };

    const result = validateContractIntegrity(validContract);
    expect(result).toEqual({
      isValid: true,
      errors: [],
      contractId: "CNT006",
    });

    // 正常系: 変更前後の契約が整合性を満たす場合
    const validBefore = {
      contractId: "CNT007",
      customerId: "CUST007",
      startDate: new Date("2024-01-01T00:00:00Z"),
      endDate: new Date("2024-12-31T00:00:00Z"),
      billingAmount: 100000,
      billingCycle: 30,
      discountRate: 0.1,
    };

    const validAfter = {
      contractId: "CNT007",
      customerId: "CUST007",
      startDate: new Date("2024-01-01T00:00:00Z"),
      endDate: new Date("2025-12-31T00:00:00Z"),
      billingAmount: 120000,
      billingCycle: 30,
      discountRate: 0.15,
    };

    const changeResult = validateContractIntegrity({
      before: validBefore,
      after: validAfter,
    });
    expect(changeResult).toEqual({
      isValid: true,
      errors: [],
      contractId: "CNT007",
      changeDetected: true,
      differences: {
        endDate: {
          before: new Date("2024-12-31T00:00:00Z"),
          after: new Date("2025-12-31T00:00:00Z"),
        },
        billingAmount: {
          before: 100000,
          after: 120000,
        },
        discountRate: {
          before: 0.1,
          after: 0.15,
        },
      },
    });
  });
});