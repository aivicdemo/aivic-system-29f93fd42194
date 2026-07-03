import { describe, test, expect, beforeEach } from "@jest/globals";
import { notifyContractChangeToManager } from "../../src/logic/it-1-1-1";

describe("営業成果データの自動検証ルール定義と異常検出機能", () => {
  // SCEN-632: [error] 契約変更内容の自動通知機能 - 営業責任者のメールアドレスが登録されていない場合は通知失敗エラーが発生する
  test("should throw error when sales manager email is not registered", () => {
    const contractChangeData = {
      contractId: "CTR-20240115-001",
      customerId: "CUST-2024-0042",
      salesManagerId: "MGR-202401-015",
      changeContent: "Service tier upgraded from Standard to Premium",
      changeDate: new Date("2024-01-15T09:30:00Z"),
      effectiveDate: new Date("2024-02-01T00:00:00Z"),
      changedBy: "OPE-202401-003",
    };

    const managerInfo = {
      managerId: "MGR-202401-015",
      managerName: "山田太郎",
      email: null,
      companyId: "CUST-2024-0042",
      department: "営業部",
      registeredAt: new Date("2023-06-10T14:22:00Z"),
    };

    expect(() =>
      notifyContractChangeToManager(contractChangeData, managerInfo)
    ).toThrow(/営業責任者のメールアドレス/);
  });
});