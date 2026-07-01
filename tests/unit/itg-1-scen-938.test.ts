import { describe, test, expect, beforeEach } from "@jest/globals";
import {
  validateMonthlyScheduleExecution,
  type MonthlyScheduleExecutionInput,
} from "../../src/logic/it-1-1-1";

describe("営業成果データの自動検証ルール定義と異常検出機能", () => {
  // SCEN-938
  test("月次業務スケジュール管理・期限通知機能 - 営業データが記録されていない状態での月次業務発火時にエラーハンドリングが実行される", () => {
    const emptyExecutionInput: MonthlyScheduleExecutionInput = {
      triggeredAt: new Date("2024-01-15T09:00:00Z"),
      salesDataRecordCount: 0,
      targetPeriodStart: new Date("2024-01-01T00:00:00Z"),
      targetPeriodEnd: new Date("2024-01-31T23:59:59Z"),
      systemStatusBefore: "IDLE",
    };

    const result = validateMonthlyScheduleExecution(emptyExecutionInput);

    // エラー検出の確認
    expect(result.hasError).toBe(true);
    expect(result.errorType).toBe("DATA_NOT_FOUND");
    expect(result.errorMessage).toMatch(/営業データ/);

    // エラーログが記録されていることを確認
    expect(result.errorLog).toBeDefined();
    expect(result.errorLog?.timestamp).toEqual(new Date("2024-01-15T09:00:00Z"));
    expect(result.errorLog?.severity).toBe("ERROR");
    expect(result.errorLog?.details).toMatch(/記録されていない/);

    // システムが安全な状態を維持していることを確認
    expect(result.systemStatusAfter).toBe("SKIP");
    expect(result.proceedToNextStep).toBe(false);

    // 空のデータセットであることの詳細ログ
    expect(result.diagnosticInfo).toBeDefined();
    expect(result.diagnosticInfo?.recordCount).toBe(0);
    expect(result.diagnosticInfo?.period).toEqual({
      start: new Date("2024-01-01T00:00:00Z"),
      end: new Date("2024-01-31T23:59:59Z"),
    });
  });

  test("月次業務スケジュール管理・期限通知機能 - 営業データが存在する場合は正常に処理が進行する", () => {
    const validExecutionInput: MonthlyScheduleExecutionInput = {
      triggeredAt: new Date("2024-01-15T09:00:00Z"),
      salesDataRecordCount: 42,
      targetPeriodStart: new Date("2024-01-01T00:00:00Z"),
      targetPeriodEnd: new Date("2024-01-31T23:59:59Z"),
      systemStatusBefore: "IDLE",
    };

    const result = validateMonthlyScheduleExecution(validExecutionInput);

    // 正常系: エラーがないことを確認
    expect(result.hasError).toBe(false);
    expect(result.errorType).toBeNull();
    expect(result.errorMessage).toBeNull();

    // 次のステップへの遷移が許可されることを確認
    expect(result.proceedToNextStep).toBe(true);
    expect(result.systemStatusAfter).toBe("EXECUTING");

    // データ件数が正しく記録されていることを確認
    expect(result.diagnosticInfo?.recordCount).toBe(42);
  });

  test("月次業務スケジュール管理・期限通知機能 - 不正なトリガー時刻でのエラーハンドリング", () => {
    const invalidTriggerInput: MonthlyScheduleExecutionInput = {
      triggeredAt: new Date("2024-01-15T23:59:59Z"),
      salesDataRecordCount: 0,
      targetPeriodStart: new Date("2024-02-01T00:00:00Z"),
      targetPeriodEnd: new Date("2024-02-29T23:59:59Z"),
      systemStatusBefore: "IDLE",
    };

    const result = validateMonthlyScheduleExecution(invalidTriggerInput);

    // トリガーと対象期間の乖離を検出
    expect(result.hasError).toBe(true);
    expect(result.errorType).toBe("INVALID_TRIGGER_TIMING");
    expect(result.errorLog?.severity).toBe("WARNING");
    expect(result.systemStatusAfter).toBe("SKIP");
  });

  test("月次業務スケジュール管理・期限通知機能 - システムが既に実行中の場合のハンドリング", () => {
    const concurrentExecutionInput: MonthlyScheduleExecutionInput = {
      triggeredAt: new Date("2024-01-15T09:00:00Z"),
      salesDataRecordCount: 15,
      targetPeriodStart: new Date("2024-01-01T00:00:00Z"),
      targetPeriodEnd: new Date("2024-01-31T23:59:59Z"),
      systemStatusBefore: "EXECUTING",
    };

    const result = validateMonthlyScheduleExecution(concurrentExecutionInput);

    // 並行実行の競合を検出
    expect(result.hasError).toBe(true);
    expect(result.errorType).toBe("CONCURRENT_EXECUTION");
    expect(result.errorMessage).toMatch(/実行中/);
    expect(result.proceedToNextStep).toBe(false);
    expect(result.systemStatusAfter).toBe("EXECUTING");
  });

  test("月次業務スケジュール管理・期限通知機能 - エラーログに詳細な診断情報が含まれることを確認", () => {
    const diagnosticInput: MonthlyScheduleExecutionInput = {
      triggeredAt: new Date("2024-01-15T09:00:00Z"),
      salesDataRecordCount: 0,
      targetPeriodStart: new Date("2024-01-01T00:00:00Z"),
      targetPeriodEnd: new Date("2024-01-31T23:59:59Z"),
      systemStatusBefore: "IDLE",
    };

    const result = validateMonthlyScheduleExecution(diagnosticInput);

    expect(result.errorLog).toBeDefined();
    expect(result.errorLog?.timestamp).toEqual(
      new Date("2024-01-15T09:00:00Z")
    );
    expect(result.errorLog?.details).toContain("営業データ");
    expect(result.diagnosticInfo?.period.start).toEqual(
      new Date("2024-01-01T00:00:00Z")
    );
    expect(result.diagnosticInfo?.period.end).toEqual(
      new Date("2024-01-31T23:59:59Z")
    );
    expect(result.diagnosticInfo?.recordCount).toBe(0);
  });
});