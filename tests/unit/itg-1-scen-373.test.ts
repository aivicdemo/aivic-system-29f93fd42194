import { determineProductionInstructionApprovalAuthority } from "../../src/logic/it-1";

describe("製品仕様・納期・工程・資材・担当者情報を統合して標準化された生産指示書を自動生成する機能", () => {
  test("重要度が境界値Mediumの生産指示書で部長承認者が選定される", () => {
    // SCEN-373
    const creatorRole = "section_chief";
    const instructionType = "normal";
    const orderAmount = 3000000;
    const deliveryDate = "2024-02-15";
    const isUrgent = false;

    const result = determineProductionInstructionApprovalAuthority(
      creatorRole,
      instructionType,
      orderAmount,
      deliveryDate,
      isUrgent
    );

    expect(result.approvalRequired).toBe(true);
    expect(result.approverRole).toBe("department_manager");
    expect(result.approvalLevel).toBe(2);
    expect(result.canSelfApprove).toBe(false);
  });
});