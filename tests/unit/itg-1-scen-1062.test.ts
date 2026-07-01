import { determineReportDistributionRules } from "../../src/logic/it-1-br-1781935279444-1-2-1";

describe("月次サマリーテンプレートの定義・管理機能", () => {
  // SCEN-1062: [normal] レポート配信ルール判定機能 - 顧客契約に基づいて配信対象顧客・配信日時・配信形式が正確に判定される
  test("should accurately determine report distribution rules based on customer contracts", () => {
    const referenceDate = new Date("2024-06-15T09:00:00Z");

    const testContracts = [
      {
        contractId: "CTR-001",
        customerId: "CUST-A",
        contractStartDate: new Date("2024-01-01T00:00:00Z"),
        contractEndDate: new Date("2024-12-31T23:59:59Z"),
        isDistributionEnabled: true,
        distributionCycle: "monthly",
        distributionFormat: "pdf",
      },
      {
        contractId: "CTR-002",
        customerId: "CUST-B",
        contractStartDate: new Date("2024-07-01T00:00:00Z"),
        contractEndDate: new Date("2025-06-30T23:59:59Z"),
        isDistributionEnabled: true,
        distributionCycle: "monthly",
        distributionFormat: "csv",
      },
      {
        contractId: "CTR-003",
        customerId: "CUST-C",
        contractStartDate: new Date("2023-01-01T00:00:00Z"),
        contractEndDate: new Date("2024-03-31T23:59:59Z"),
        isDistributionEnabled: true,
        distributionCycle: "monthly",
        distributionFormat: "email",
      },
      {
        contractId: "CTR-004",
        customerId: "CUST-D",
        contractStartDate: new Date("2024-03-01T00:00:00Z"),
        contractEndDate: new Date("2024-09-30T23:59:59Z"),
        isDistributionEnabled: false,
        distributionCycle: "monthly",
        distributionFormat: "pdf",
      },
      {
        contractId: "CTR-005",
        customerId: "CUST-E",
        contractStartDate: new Date("2024-05-01T00:00:00Z"),
        contractEndDate: new Date("2024-11-30T23:59:59Z"),
        isDistributionEnabled: true,
        distributionCycle: "biweekly",
        distributionFormat: "pdf_csv",
      },
    ];

    const result = determineReportDistributionRules(testContracts, referenceDate);

    // 配信対象顧客の確認: 有効期間内かつ配信対象フラグがtrueの顧客のみ
    expect(result.distributionTargets).toHaveLength(3);

    // CTR-001: 有効期間内、配信対象フラグtrue → 配信対象に含まれる
    const target1 = result.distributionTargets.find(
      (t) => t.contractId === "CTR-001"
    );
    expect(target1).toBeDefined();
    expect(target1?.customerId).toBe("CUST-A");
    expect(target1?.isIncluded).toBe(true);
    expect(target1?.distributionFormat).toBe("pdf");

    // CTR-002: 契約開始日が参照日より後 → 配信対象から除外
    const excludedCTR002 = result.exclusions.find(
      (e) => e.contractId === "CTR-002"
    );
    expect(excludedCTR002).toBeDefined();
    expect(excludedCTR002?.reason).toMatch(/契約開始/);

    // CTR-003: 契約終了日が参照日より前 → 配信対象から除外
    const excludedCTR003 = result.exclusions.find(
      (e) => e.contractId === "CTR-003"
    );
    expect(excludedCTR003).toBeDefined();
    expect(excludedCTR003?.reason).toMatch(/契約終了/);

    // CTR-004: 配信対象フラグがfalse → 配信対象から除外
    const excludedCTR004 = result.exclusions.find(
      (e) => e.contractId === "CTR-004"
    );
    expect(excludedCTR004).toBeDefined();
    expect(excludedCTR004?.reason).toMatch(/配信/);

    // CTR-005: 有効期間内、配信対象フラグtrue、隔週配信 → 配信対象に含まれる
    const target5 = result.distributionTargets.find(
      (t) => t.contractId === "CTR-005"
    );
    expect(target5).toBeDefined();
    expect(target5?.customerId).toBe("CUST-E");
    expect(target5?.isIncluded).toBe(true);
    expect(target5?.distributionFormat).toBe("pdf_csv");
    expect(target5?.distributionCycle).toBe("biweekly");

    // 配信日時の計算確認: 月次配信の場合、参照日の翌月同日（月末対応）に設定
    const nextMonthDistributionDate = new Date("2024-07-15T09:00:00Z");
    expect(target1?.nextDistributionDate).toEqual(nextMonthDistributionDate);

    // 隔週配信の場合: 参照日から14日後に設定
    const biweeklyDistributionDate = new Date("2024-06-29T09:00:00Z");
    expect(target5?.nextDistributionDate).toEqual(biweeklyDistributionDate);

    // 全体の配信対象数・除外数の確認
    expect(result.totalEligibleContracts).toBe(5);
    expect(result.totalDistributionTargets).toBe(3);
    expect(result.totalExcludedContracts).toBe(2);

    // 配信スケジュール完全性の確認
    expect(result.distributionTargets.every((t) => t.nextDistributionDate !== null))
      .toBe(true);
    expect(
      result.distributionTargets.every((t) => t.distributionFormat !== "")
    ).toBe(true);

    // 各対象顧客について配信形式が明確に判定されているか
    result.distributionTargets.forEach((target) => {
      expect(["pdf", "csv", "email", "pdf_csv"]).toContain(
        target.distributionFormat
      );
    });

    // 契約内容と配信ルール判定結果の整合性確認
    expect(result.validationStatus).toBe("passed");
  });
});