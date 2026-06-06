import { determineProductionInstructionApprovalAuthority } from '../../src/logic/it-1';

describe("製品仕様・納期・工程・資材・担当者情報を統合して標準化された生産指示書を自動生成する機能", () => {
  test("SCEN-372: 存在しない役職で承認権限判定を行うとエラーが発生する", () => {
    // SCEN-372
    expect(() => 
      determineProductionInstructionApprovalAuthority(
        "INVALID_ROLE_001",
        "normal",
        3000000,
        "2024-02-15",
        false
      )
    ).toThrow(/役職/);
  });
});