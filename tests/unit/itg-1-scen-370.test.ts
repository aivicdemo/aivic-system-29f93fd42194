import { determineProductionInstructionApprovalAuthority } from "../../src/logic/it-1";

describe("製品仕様・納期・工程・資材・担当者情報を統合して標準化された生産指示書を自動生成する機能", () => {
  test("管理者権限で重要度Highの生産指示書作成時に専務承認者が選定される", () => {
    // SCEN-370
    const result = determineProductionInstructionApprovalAuthority(
      "manager",
      "high_priority",
      8000000,
      "2024-01-31",
      true
    );

    expect(result.approvalRequired).toBe(true);
    expect(result.approverRole).toBe("executive_director");
    expect(result.approvalLevel).toBe(3);
    expect(result.canSelfApprove).toBe(false);
  });
});