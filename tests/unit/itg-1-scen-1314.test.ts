import { validateBillingData } from "../../src/logic/it-1781935279444-2-2-1";

describe("請求データ自動検証", () => {
  // SCEN-1314: [normal] 請求データ自動検証 - 受領した請求データが契約内容・過去請求パターンと照合され妥当性が自動検証される
  test("受領した請求データが契約内容・過去請求パターンと正常に照合され、すべての検証項目に合致する場合は『妥当性あり』と判定される", () => {
    const contractInfo = {
      contractId: "C-2024-001",
      contractAmount: 100000,
      contractStartDate: new Date("2024-01-01T00:00:00Z"),
      contractEndDate: new Date("2024-12-31T23:59:59Z"),
      serviceContent: "営業代行サービス",
    };

    const pastBillingData = [
      {
        billingId: "B-2024-11",
        contractId: "C-2024-001",
        billingAmount: 100000,
        billingDate: new Date("2024-11-01T00:00:00Z"),
        billingContent: "営業代行サービス",
      },
      {
        billingId: "B-2024-10",
        contractId: "C-2024-001",
        billingAmount: 100000,
        billingDate: new Date("2024-10-01T00:00:00Z"),
        billingContent: "営業代行サービス",
      },
      {
        billingId: "B-2024-09",
        contractId: "C-2024-001",
        billingAmount: 100000,
        billingDate: new Date("2024-09-01T00:00:00Z"),
        billingContent: "営業代行サービス",
      },
    ];

    const newBillingData = {
      contractId: "C-2024-001",
      billingAmount: 100000,
      billingDate: new Date("2024-12-01T00:00:00Z"),
      billingContent: "営業代行サービス",
      billerInfo: "顧客企業営業部",
    };

    const result = validateBillingData(
      contractInfo,
      pastBillingData,
      newBillingData
    );

    expect(result.isValid).toBe(true);
    expect(result.validityStatus).toBe("妥当性あり");
    expect(result.validationItems).toEqual({
      contractIdMatch: true,
      billingAmountInRange: true,
      billingDateInPeriod: true,
      pastPatternCompliance: true,
    });
    expect(result.validationErrors).toEqual([]);
  });

  test("請求データの契約IDが登録済み契約と不一致の場合は検証エラーが検出される", () => {
    const contractInfo = {
      contractId: "C-2024-001",
      contractAmount: 100000,
      contractStartDate: new Date("2024-01-01T00:00:00Z"),
      contractEndDate: new Date("2024-12-31T23:59:59Z"),
      serviceContent: "営業代行サービス",
    };

    const pastBillingData = [
      {
        billingId: "B-2024-11",
        contractId: "C-2024-001",
        billingAmount: 100000,
        billingDate: new Date("2024-11-01T00:00:00Z"),
        billingContent: "営業代行サービス",
      },
    ];

    const newBillingData = {
      contractId: "C-2024-999",
      billingAmount: 100000,
      billingDate: new Date("2024-12-01T00:00:00Z"),
      billingContent: "営業代行サービス",
      billerInfo: "顧客企業営業部",
    };

    const result = validateBillingData(
      contractInfo,
      pastBillingData,
      newBillingData
    );

    expect(result.isValid).toBe(false);
    expect(result.validityStatus).toBe("妥当性なし");
    expect(result.validationItems.contractIdMatch).toBe(false);
    expect(result.validationErrors).toContain(
      expect.objectContaining({
        field: "contractId",
        errorType: "契約ID不一致",
      })
    );
  });

  test("請求金額が契約金額の範囲を超過する場合は検証エラーが検出される", () => {
    const contractInfo = {
      contractId: "C-2024-001",
      contractAmount: 100000,
      contractStartDate: new Date("2024-01-01T00:00:00Z"),
      contractEndDate: new Date("2024-12-31T23:59:59Z"),
      serviceContent: "営業代行サービス",
    };

    const pastBillingData = [
      {
        billingId: "B-2024-11",
        contractId: "C-2024-001",
        billingAmount: 100000,
        billingDate: new Date("2024-11-01T00:00:00Z"),
        billingContent: "営業代行サービス",
      },
    ];

    const newBillingData = {
      contractId: "C-2024-001",
      billingAmount: 150000,
      billingDate: new Date("2024-12-01T00:00:00Z"),
      billingContent: "営業代行サービス",
      billerInfo: "顧客企業営業部",
    };

    const result = validateBillingData(
      contractInfo,
      pastBillingData,
      newBillingData
    );

    expect(result.isValid).toBe(false);
    expect(result.validityStatus).toBe("妥当性なし");
    expect(result.validationItems.billingAmountInRange).toBe(false);
    expect(result.validationErrors).toContain(
      expect.objectContaining({
        field: "billingAmount",
        errorType: "金額範囲外",
      })
    );
  });

  test("請求日が契約期間外の場合は検証エラーが検出される", () => {
    const contractInfo = {
      contractId: "C-2024-001",
      contractAmount: 100000,
      contractStartDate: new Date("2024-01-01T00:00:00Z"),
      contractEndDate: new Date("2024-12-31T23:59:59Z"),
      serviceContent: "営業代行サービス",
    };

    const pastBillingData = [
      {
        billingId: "B-2024-11",
        contractId: "C-2024-001",
        billingAmount: 100000,
        billingDate: new Date("2024-11-01T00:00:00Z"),
        billingContent: "営業代行サービス",
      },
    ];

    const newBillingData = {
      contractId: "C-2024-001",
      billingAmount: 100000,
      billingDate: new Date("2025-01-15T00:00:00Z"),
      billingContent: "営業代行サービス",
      billerInfo: "顧客企業営業部",
    };

    const result = validateBillingData(
      contractInfo,
      pastBillingData,
      newBillingData
    );

    expect(result.isValid).toBe(false);
    expect(result.validityStatus).toBe("妥当性なし");
    expect(result.validationItems.billingDateInPeriod).toBe(false);
    expect(result.validationErrors).toContain(
      expect.objectContaining({
        field: "billingDate",
        errorType: "請求日期間外",
      })
    );
  });

  test("請求金額の変動が過去パターンの閾値を超える場合は検証エラーが検出される", () => {
    const contractInfo = {
      contractId: "C-2024-001",
      contractAmount: 100000,
      contractStartDate: new Date("2024-01-01T00:00:00Z"),
      contractEndDate: new Date("2024-12-31T23:59:59Z"),
      serviceContent: "営業代行サービス",
    };

    const pastBillingData = [
      {
        billingId: "B-2024-11",
        contractId: "C-2024-001",
        billingAmount: 100000,
        billingDate: new Date("2024-11-01T00:00:00Z"),
        billingContent: "営業代行サービス",
      },
      {
        billingId: "B-2024-10",
        contractId: "C-2024-001",
        billingAmount: 100000,
        billingDate: new Date("2024-10-01T00:00:00Z"),
        billingContent: "営業代行サービス",
      },
      {
        billingId: "B-2024-09",
        contractId: "C-2024-001",
        billingAmount: 100000,
        billingDate: new Date("2024-09-01T00:00:00Z"),
        billingContent: "営業代行サービス",
      },
    ];

    const newBillingData = {
      contractId: "C-2024-001",
      billingAmount: 75000,
      billingDate: new Date("2024-12-01T00:00:00Z"),
      billingContent: "営業代行サービス",
      billerInfo: "顧客企業営業部",
    };

    const result = validateBillingData(
      contractInfo,
      pastBillingData,
      newBillingData
    );

    expect(result.isValid).toBe(false);
    expect(result.validityStatus).toBe("妥当性なし");
    expect(result.validationItems.pastPatternCompliance).toBe(false);
    expect(result.validationErrors).toContain(
      expect.objectContaining({
        field: "billingAmount",
        errorType: "過去パターン逸脱",
      })
    );
  });

  test("複数の検証項目が不一致の場合、すべての検証エラーが返却される", () => {
    const contractInfo = {
      contractId: "C-2024-001",
      contractAmount: 100000,
      contractStartDate: new Date("2024-01-01T00:00:00Z"),
      contractEndDate: new Date("2024-12-31T23:59:59Z"),
      serviceContent: "営業代行サービス",
    };

    const pastBillingData = [
      {
        billingId: "B-2024-11",
        contractId: "C-2024-001",
        billingAmount: 100000,
        billingDate: new Date("2024-11-01T00:00:00Z"),
        billingContent: "営業代行サービス",
      },
    ];

    const newBillingData = {
      contractId: "C-2024-999",
      billingAmount: 150000,
      billingDate: new Date("2025-01-15T00:00:00Z"),
      billingContent: "営業代行サービス",
      billerInfo: "顧客企業営業部",
    };

    const result = validateBillingData(
      contractInfo,
      pastBillingData,
      newBillingData
    );

    expect(result.isValid).toBe(false);
    expect(result.validityStatus).toBe("妥当性なし");
    expect(result.validationItems.contractIdMatch).toBe(false);
    expect(result.validationItems.billingAmountInRange).toBe(false);
    expect(result.validationItems.billingDateInPeriod).toBe(false);
    expect(result.validationErrors.length).toBeGreaterThanOrEqual(3);
  });
});