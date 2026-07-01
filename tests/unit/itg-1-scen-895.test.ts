import { defineMetadataItem } from "../../src/logic/it-1781935279444-1-1-1";

describe("営業データ項目のメタデータ管理機能", () => {
  // SCEN-895: [error] 適用請求ルール・割引基準の明確化 - 契約書で請求ルールが定義されていない場合、エラーメッセージが返される
  test("should throw error when billing rule is not defined in contract", () => {
    const contractWithoutBillingRule = {
      contractId: "CONTRACT-001",
      customerId: "CUST-001",
      contractName: "Test Contract",
      startDate: "2024-01-01",
      endDate: "2024-12-31",
      billingRuleId: null,
      discountBasisId: null,
    };

    expect(() =>
      defineMetadataItem({
        contractId: contractWithoutBillingRule.contractId,
        customerId: contractWithoutBillingRule.customerId,
        contractName: contractWithoutBillingRule.contractName,
        startDate: contractWithoutBillingRule.startDate,
        endDate: contractWithoutBillingRule.endDate,
        billingRuleId: contractWithoutBillingRule.billingRuleId,
        discountBasisId: contractWithoutBillingRule.discountBasisId,
      })
    ).toThrow(/請求ルール/);
  });
});