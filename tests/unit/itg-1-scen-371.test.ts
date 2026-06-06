import { determineProductionInstructionApprovalAuthority } from '../../src/logic/it-1';

describe("製品仕様・納期・工程・資材・担当者情報を統合して標準化された生産指示書を自動生成する機能", () => {
  test("一般権限で重要度Lowの生産指示書作成時に課長承認者が選定される", () => {
    // SCEN-371
    const result = determineProductionInstructionApprovalAuthority(
      "general_staff",
      "normal",
      1000000,
      "2024-02-15",
      false
    );

    expect(result.approvalRequired).toBe(true);
    expect(result.approverRole).toBe("section_chief");
    expect(result.approvalLevel).toBe(1);
    expect(result.canSelfApprove).toBe(false);
  });
});