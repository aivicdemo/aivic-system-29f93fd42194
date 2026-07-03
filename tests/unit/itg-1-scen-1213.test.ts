import { describe, test, expect, beforeEach, afterEach } from "@jest/globals";

// Import the function to test
import { approveContractChange } from "../../src/logic/it-1781935279444-1-1-1";

describe("契約変更内容の承認・署名・ログ生成", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-1213
  test("営業責任者が承認を実施した場合、承認記録が保存され承認ログが生成される", () => {
    // Arrange: テスト用の契約変更内容データを準備する
    const contract_change_id = "CC-2024-001";
    const user_id = "USR-SALES-0001";
    const user_name = "田中太郎";
    const approval_timestamp = new Date("2024-01-15T11:00:00Z");
    const contract_id = "CNT-2024-0001";
    const customer_id = "CUST-0001";
    const change_content = "サービス利用量の上限を100から200に変更";
    const change_type = "service_limit_update";
    const approval_status_before = "pending_approval";
    const approval_status_after = "approved";

    // 入力パラメータ
    const input_params = {
      contract_change_id: contract_change_id,
      user_id: user_id,
      user_name: user_name,
      approval_timestamp: approval_timestamp,
      contract_id: contract_id,
      customer_id: customer_id,
      change_content: change_content,
      change_type: change_type,
      approval_status_before: approval_status_before,
    };

    // Act: 承認処理を実行する
    const result = approveContractChange(input_params);

    // Assert: 承認記録がデータベースに保存されたことを検証
    expect(result.approval_record_saved).toBe(true);
    expect(result.approval_record).toBeDefined();
    expect(result.approval_record.contract_change_id).toBe(contract_change_id);
    expect(result.approval_record.approved_by_user_id).toBe(user_id);
    expect(result.approval_record.approved_by_user_name).toBe(user_name);
    expect(result.approval_record.approval_timestamp).toEqual(approval_timestamp);
    expect(result.approval_record.approval_status).toBe(approval_status_after);

    // Assert: 承認ログが生成されたことを検証
    expect(result.approval_log_generated).toBe(true);
    expect(result.approval_log).toBeDefined();
    expect(result.approval_log.log_id).toBeDefined();
    expect(result.approval_log.contract_change_id).toBe(contract_change_id);
    expect(result.approval_log.user_id).toBe(user_id);
    expect(result.approval_log.user_name).toBe(user_name);
    expect(result.approval_log.log_timestamp).toEqual(approval_timestamp);
    expect(result.approval_log.operation_type).toBe("contract_change_approval");
    expect(result.approval_log.operation_content).toContain(change_content);
    expect(result.approval_log.operation_content).toContain(contract_id);

    // Assert: 契約変更ステータスが『承認済み』に更新されたことを検証
    expect(result.contract_change_status).toBe(approval_status_after);

    // Assert: 承認完了メッセージが返される
    expect(result.message).toBeDefined();
    expect(result.message).toMatch(/承認/);
    expect(result.message).toMatch(/完了/);

    // Assert: API レスポンスのステータスが成功を示すことを検証
    expect(result.success).toBe(true);
  });
});