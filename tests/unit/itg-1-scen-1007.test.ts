import { describe, test, expect } from "@jest/globals";
import { validateSalesDataAndApprove } from "../../src/logic/it-1781935279444-2-2-1";

describe("営業データ品質検証・承認判定", () => {
  // SCEN-1007: [edge] 検証結果レポート確認・承認判定 - 検証エラー件数がちょうど0件の場合に承認可能と判定される
  test("検証エラー件数がちょうど0件の場合、承認可能と判定され承認処理が正常に完了すること", () => {
    // テストデータ: 検証エラー件数が0件のレポート
    const reportInput = {
      reportId: "RPT-20240115-001",
      salesDataList: [
        {
          dataId: "SD-001",
          customerId: "CUST-A",
          serviceId: "SVC-001",
          appointmentCount: 5,
          contractCount: 2,
          contactDate: "2024-01-10",
          status: "completed",
        },
        {
          dataId: "SD-002",
          customerId: "CUST-B",
          serviceId: "SVC-002",
          appointmentCount: 3,
          contractCount: 1,
          contactDate: "2024-01-12",
          status: "completed",
        },
      ],
      validationRules: [
        {
          ruleId: "RULE-001",
          fieldName: "appointmentCount",
          requiredFlag: true,
          dataType: "number",
          minValue: 0,
          maxValue: 1000,
        },
        {
          ruleId: "RULE-002",
          fieldName: "contractCount",
          requiredFlag: true,
          dataType: "number",
          minValue: 0,
          maxValue: 1000,
        },
        {
          ruleId: "RULE-003",
          fieldName: "contactDate",
          requiredFlag: true,
          dataType: "string",
          dateFormat: "YYYY-MM-DD",
        },
      ],
      approvalThreshold: {
        maxAllowedErrorCount: 0,
        requiredApprovalStatus: "ready_for_approval",
      },
    };

    // 実行: 検証と承認判定を実行
    const result = validateSalesDataAndApprove(reportInput);

    // 検証エラー件数が0件であることを確認
    expect(result.validationErrorCount).toBe(0);

    // システムが承認可能と判定したことを確認
    expect(result.approvalJudgment).toBe("approved");

    // 承認処理が正常に完了したことを確認
    expect(result.approvalStatus).toBe("approved");

    // レポートステータスが承認済みに更新されたことを確認
    expect(result.reportStatus).toBe("approved");

    // 承認時刻が記録されていることを確認
    expect(result.approvedAt).toBeDefined();
    expect(typeof result.approvedAt).toBe("string");

    // 承認者情報が記録されていることを確認
    expect(result.approvedBy).toBeDefined();
    expect(result.approvedBy).toBe("system_validator");

    // 検証エラーリストが空であることを確認
    expect(Array.isArray(result.validationErrors)).toBe(true);
    expect(result.validationErrors.length).toBe(0);

    // 警告メッセージがないことを確認
    expect(result.warningMessages.length).toBe(0);

    // 処理結果が成功であることを確認
    expect(result.success).toBe(true);
  });
});