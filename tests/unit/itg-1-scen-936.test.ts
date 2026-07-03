import { describe, test, expect, beforeEach } from "@jest/globals";
import { extractContractBillingTargetsWithDiscounts } from "../../src/logic/it-1-2-1";

describe("営業成果データから請求対象項目を自動抽出し、顧客ごと・サービスごとの請求額を集計する機能", () => {
  // SCEN-936: [normal] 月次請求対象契約・割引基準の確認機能 - 有効期間内の契約が正確に抽出され、請求対象サービスと割引ルールが明確に返却される
  test("SCEN-936", () => {
    // 参照日付（テスト基準日）
    const referenceDate = new Date("2024-06-15");

    // テストデータ: 複数の契約情報（有効期間内、有効期間外、保留中を含む）
    const contracts = [
      {
        contractId: "C001",
        customerId: "CUST001",
        contractStatus: "active",
        startDate: new Date("2024-01-01"),
        endDate: new Date("2024-12-31"),
        services: [
          {
            serviceId: "SVC001",
            serviceName: "基本営業支援",
            billingTargetFlag: true,
          },
          {
            serviceId: "SVC002",
            serviceName: "追加分析",
            billingTargetFlag: true,
          },
        ],
        discountRules: [
          {
            discountRuleId: "DR001",
            discountType: "percentage",
            discountRate: 10,
            applicableCondition: "contract_value_above_1m",
            priority: 1,
          },
          {
            discountRuleId: "DR002",
            discountType: "fixed",
            discountAmount: 50000,
            applicableCondition: "service_count_above_3",
            priority: 2,
          },
        ],
      },
      {
        contractId: "C002",
        customerId: "CUST002",
        contractStatus: "active",
        startDate: new Date("2024-03-01"),
        endDate: new Date("2024-08-31"),
        services: [
          {
            serviceId: "SVC003",
            serviceName: "営業データ分析",
            billingTargetFlag: true,
          },
        ],
        discountRules: [
          {
            discountRuleId: "DR003",
            discountType: "percentage",
            discountRate: 5,
            applicableCondition: "early_payment",
            priority: 1,
          },
        ],
      },
      {
        contractId: "C003",
        customerId: "CUST003",
        contractStatus: "active",
        startDate: new Date("2024-07-01"),
        endDate: new Date("2024-12-31"),
        services: [
          {
            serviceId: "SVC004",
            serviceName: "成果レポート",
            billingTargetFlag: true,
          },
        ],
        discountRules: [],
      },
      {
        contractId: "C004",
        customerId: "CUST004",
        contractStatus: "active",
        startDate: new Date("2023-01-01"),
        endDate: new Date("2024-02-29"),
        services: [
          {
            serviceId: "SVC005",
            serviceName: "期限切れサービス",
            billingTargetFlag: true,
          },
        ],
        discountRules: [],
      },
      {
        contractId: "C005",
        customerId: "CUST005",
        contractStatus: "suspended",
        startDate: new Date("2024-04-01"),
        endDate: new Date("2024-10-31"),
        services: [
          {
            serviceId: "SVC006",
            serviceName: "保留中サービス",
            billingTargetFlag: true,
          },
        ],
        discountRules: [],
      },
    ];

    // 機能を実行
    const result = extractContractBillingTargetsWithDiscounts(
      contracts,
      referenceDate
    );

    // 検証1: 有効期間内の契約のみが抽出されている
    expect(result.validContracts).toHaveLength(3);
    expect(result.validContracts.map((c) => c.contractId)).toEqual([
      "C001",
      "C002",
      "C003",
    ]);

    // 検証2: 有効期間外の契約が除外されている
    expect(
      result.validContracts.some((c) => c.contractId === "C004")
    ).toBeFalsy();

    // 検証3: 保留中または無効状態の契約が除外されている
    expect(
      result.validContracts.some((c) => c.contractId === "C005")
    ).toBeFalsy();

    // 検証4: C001の請求対象サービスが正確に返却される
    const c001 = result.validContracts.find((c) => c.contractId === "C001");
    expect(c001).toBeDefined();
    expect(c001!.billingServices).toHaveLength(2);
    expect(c001!.billingServices[0].serviceId).toBe("SVC001");
    expect(c001!.billingServices[0].serviceName).toBe("基本営業支援");
    expect(c001!.billingServices[1].serviceId).toBe("SVC002");
    expect(c001!.billingServices[1].serviceName).toBe("追加分析");

    // 検証5: C002の請求対象サービスが正確に返却される
    const c002 = result.validContracts.find((c) => c.contractId === "C002");
    expect(c002).toBeDefined();
    expect(c002!.billingServices).toHaveLength(1);
    expect(c002!.billingServices[0].serviceId).toBe("SVC003");

    // 検証6: 割引ルール情報が明確に返却される（C001）
    expect(c001!.appliedDiscounts).toHaveLength(2);
    expect(c001!.appliedDiscounts[0]).toEqual({
      discountRuleId: "DR001",
      discountType: "percentage",
      discountRate: 10,
      applicableCondition: "contract_value_above_1m",
      priority: 1,
    });
    expect(c001!.appliedDiscounts[1]).toEqual({
      discountRuleId: "DR002",
      discountType: "fixed",
      discountAmount: 50000,
      applicableCondition: "service_count_above_3",
      priority: 2,
    });

    // 検証7: 割引ルール情報が明確に返却される（C002）
    expect(c002!.appliedDiscounts).toHaveLength(1);
    expect(c002!.appliedDiscounts[0]).toEqual({
      discountRuleId: "DR003",
      discountType: "percentage",
      discountRate: 5,
      applicableCondition: "early_payment",
      priority: 1,
    });

    // 検証8: 複数の割引ルール適用時に優先順位が正しく反映されている（C001）
    const c001DiscountsByPriority = c001!.appliedDiscounts.sort(
      (a, b) => a.priority - b.priority
    );
    expect(c001DiscountsByPriority[0].priority).toBe(1);
    expect(c001DiscountsByPriority[1].priority).toBe(2);

    // 検証9: 割引ルールがない契約（C003）でも正確に処理される
    const c003 = result.validContracts.find((c) => c.contractId === "C003");
    expect(c003).toBeDefined();
    expect(c003!.billingServices).toHaveLength(1);
    expect(c003!.appliedDiscounts).toHaveLength(0);

    // 検証10: 除外された契約の情報が記録されている
    expect(result.excludedContracts).toHaveLength(2);
    expect(
      result.excludedContracts.some((c) => c.contractId === "C004")
    ).toBeTruthy();
    expect(
      result.excludedContracts.some((c) => c.contractId === "C005")
    ).toBeTruthy();

    // 検証11: 除外理由が明確に記録されている
    const c004Excluded = result.excludedContracts.find(
      (c) => c.contractId === "C004"
    );
    expect(c004Excluded!.excludeReason).toBe("期間外");

    const c005Excluded = result.excludedContracts.find(
      (c) => c.contractId === "C005"
    );
    expect(c005Excluded!.excludeReason).toBe("無効状態");
  });
});