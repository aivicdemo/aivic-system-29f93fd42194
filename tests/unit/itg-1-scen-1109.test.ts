import {
  validateIntegratedTasks,
  type TaskValidationInput,
  type TaskValidationResult,
} from "../../src/logic/it-1781935279444-2-2-1";

describe("営業データの完全性・正確性を自動検証し、不足データ・誤りを検出・通知する機能", () => {
  // SCEN-1109
  test("3業務統合検証・進行判定 - いずれか1業務が不合格の場合、修正指示が生成されて再実行に遷移すること", () => {
    // 前提: 営業データ検証、請求データ検証、マスタデータ検証の3業務が定義されている
    // トリガー: 複数業務（営業データ検証、請求データ検証、マスタデータ検証）を実行し、いずれか1業務を意図的に不合格状態に設定
    // 期待結果: 不合格業務が特定され、修正指示が自動生成される。修正指示には対象業務名、エラー詳細、推奨される修正方法が含まれ、システムが再実行状態に遷移

    const input: TaskValidationInput = {
      taskExecutionBatch: {
        batchId: "batch-20240115-001",
        executionDateTime: "2024-01-15T09:00:00Z",
        tasks: [
          {
            taskId: "task-sales-data-001",
            taskName: "営業データ検証",
            taskType: "sales_data_validation",
            executionStatus: "completed",
            validationResult: {
              isValid: true,
              errorCount: 0,
              warningCount: 0,
              details: [],
            },
          },
          {
            taskId: "task-billing-data-002",
            taskName: "請求データ検証",
            taskType: "billing_data_validation",
            executionStatus: "completed",
            validationResult: {
              isValid: false,
              errorCount: 2,
              warningCount: 1,
              details: [
                {
                  errorType: "missing_required_field",
                  fieldName: "請求先顧客ID",
                  errorMessage: "請求先顧客IDが入力されていません",
                  affectedRecordCount: 3,
                  severity: "error",
                },
                {
                  errorType: "invalid_value_range",
                  fieldName: "請求額",
                  errorMessage: "請求額が許容範囲を超えています",
                  affectedRecordCount: 1,
                  severity: "error",
                },
              ],
            },
          },
          {
            taskId: "task-master-data-003",
            taskName: "マスタデータ検証",
            taskType: "master_data_validation",
            executionStatus: "completed",
            validationResult: {
              isValid: true,
              errorCount: 0,
              warningCount: 0,
              details: [],
            },
          },
        ],
      },
      progressionRules: {
        allowProgressionOnWarningOnly: false,
        requireAllTasksValid: true,
      },
    };

    const result: TaskValidationResult = validateIntegratedTasks(input);

    // 1. システムが不合格業務を特定したことを検証
    expect(result.overallStatus).toBe("failed");
    expect(result.failedTaskCount).toBe(1);
    expect(result.failedTasks).toHaveLength(1);
    expect(result.failedTasks[0].taskId).toBe("task-billing-data-002");
    expect(result.failedTasks[0].taskName).toBe("請求データ検証");

    // 2. 修正指示が自動生成されたことを検証
    expect(result.correctionInstructions).toBeDefined();
    expect(result.correctionInstructions).toHaveLength(1);

    // 3. 修正指示の内容を検証（対象業務名、エラー詳細、推奨される修正方法を含むこと）
    const instruction = result.correctionInstructions[0];
    expect(instruction.targetTaskId).toBe("task-billing-data-002");
    expect(instruction.targetTaskName).toBe("請求データ検証");
    expect(instruction.correctionInstructionType).toBe(
      "data_validation_failure"
    );

    // エラー詳細を検証
    expect(instruction.errorSummary).toContain("請求先顧客ID");
    expect(instruction.errorDetails).toHaveLength(2);
    expect(instruction.errorDetails[0].fieldName).toBe("請求先顧客ID");
    expect(instruction.errorDetails[0].errorMessage).toBe(
      "請求先顧客IDが入力されていません"
    );
    expect(instruction.errorDetails[0].affectedRecordCount).toBe(3);
    expect(instruction.errorDetails[1].fieldName).toBe("請求額");
    expect(instruction.errorDetails[1].errorMessage).toBe(
      "請求額が許容範囲を超えています"
    );

    // 推奨される修正方法を検証
    expect(instruction.recommendedCorrectionMethod).toBeDefined();
    expect(instruction.recommendedCorrectionMethod.length).toBeGreaterThan(0);
    expect(
      instruction.recommendedCorrectionMethod.some((m: string) =>
        m.includes("請求先顧客ID")
      )
    ).toBe(true);

    // 4. システムが再実行状態に遷移したことを検証
    expect(result.progressionDecision).toBe("halt_pending_correction");
    expect(result.nextStatus).toBe("awaiting_correction");

    // 5. 再実行ステータスが正しく表示されていることを検証
    expect(result.reExecutionState).toBeDefined();
    expect(result.reExecutionState.isReExecutionRequired).toBe(true);
    expect(result.reExecutionState.reExecutionTargetTasks).toHaveLength(1);
    expect(result.reExecutionState.reExecutionTargetTasks[0]).toBe(
      "task-billing-data-002"
    );
    expect(result.reExecutionState.correctionDeadlineDateTime).toBeDefined();

    // 6. 成功した業務はカウントされていることを検証
    expect(result.successfulTaskCount).toBe(2);
    expect(result.successfulTasks).toHaveLength(2);
    expect(result.successfulTasks.map((t) => t.taskId)).toEqual(
      expect.arrayContaining(["task-sales-data-001", "task-master-data-003"])
    );

    // 7. 全体的な検証結果サマリーを検証
    expect(result.summary).toContain("請求データ検証");
    expect(result.summary).toContain("修正が必要");
  });
});