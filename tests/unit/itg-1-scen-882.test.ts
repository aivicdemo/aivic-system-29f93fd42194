import { describe, test, expect, beforeEach } from "@jest/globals";
import { validateSalesDataAndNotifyManager } from "../../src/logic/it-1-br-1781935279444-1-2-1";

describe("月次サマリーテンプレート定義管理機能 - 検証結果異常時の上位管理者自動通知", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-882: [edge] 検証結果異常時の上位管理者自動通知 - 検証結果『正常』と判定された場合、上位管理者への通知は生成されない
  test("should not generate manager notification when validation result is marked as normal", () => {
    const validation_result_id = "val_20240115_001";
    const validation_execution_id = "exec_20240115_0001";
    const sales_data_id = "sales_20240115_0001";
    const customer_id = "cust_0001";
    const required_field_validation = true;
    const data_type_validation = true;
    const range_validation = true;
    const anomaly_validation = true;
    const validation_status = "normal";
    const validation_timestamp = new Date("2024-01-15T09:00:00Z").toISOString();
    const manager_notification_count = 0;
    const manager_notification_generated = false;

    const validationData = {
      validation_result_id,
      validation_execution_id,
      sales_data_id,
      customer_id,
      required_field_validation,
      data_type_validation,
      range_validation,
      anomaly_validation,
      validation_status,
      validation_timestamp,
    };

    const result = validateSalesDataAndNotifyManager(validationData);

    expect(result.validation_status).toBe("normal");
    expect(result.should_notify_manager).toBe(false);
    expect(result.notification_generated_count).toBe(manager_notification_count);
    expect(result.manager_notification_exists).toBe(manager_notification_generated);
    expect(result.notification_queue_entries).toEqual([]);
    expect(result.notification_history_entries).toEqual([]);
    expect(result.validation_passed).toBe(true);
  });
});