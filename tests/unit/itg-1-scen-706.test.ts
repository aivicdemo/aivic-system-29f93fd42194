import { describe, test, expect } from "@jest/globals";
import {
  generateManualCorrectionInstructions,
} from "../../src/logic/it-1-1-1";

describe("営業成果データの自動検証ルール定義と異常検出機能", () => {
  // SCEN-706: [error] 営業データ補正指示生成機能 - 自動補正不可能なエラーに対して手動修正指示を生成する
  test("should generate manual correction instructions for uncorrectable errors", () => {
    const uncorrectableErrors = [
      {
        error_id: "ERR-001",
        sales_data_id: "SD-2024-001",
        error_type: "customer_master_mismatch",
        error_content: "顧客コード：C001が顧客マスタに存在しない",
        affected_amount: 150000,
        is_auto_correctable: false,
        detected_at: "2024-01-15T09:30:00Z",
      },
      {
        error_id: "ERR-002",
        sales_data_id: "SD-2024-002",
        error_type: "duplicate_revenue_posting",
        error_content: "同一顧客・サービス・期間で2件の重複売上計上を検出",
        affected_amount: 250000,
        is_auto_correctable: false,
        detected_at: "2024-01-15T10:15:00Z",
      },
      {
        error_id: "ERR-003",
        sales_data_id: "SD-2024-003",
        error_type: "contract_term_violation",
        error_content: "計上売上が契約上限額を超過（超過額：50000円）",
        affected_amount: 50000,
        is_auto_correctable: false,
        detected_at: "2024-01-15T11:00:00Z",
      },
    ];

    const result = generateManualCorrectionInstructions(uncorrectableErrors);

    expect(result).toEqual({
      instruction_id: "CORR-2024-001",
      generated_at: "2024-01-15T12:00:00Z",
      total_uncorrectable_errors: 3,
      total_affected_amount: 450000,
      instructions: [
        {
          instruction_seq: 1,
          error_id: "ERR-001",
          sales_data_id: "SD-2024-001",
          error_type: "customer_master_mismatch",
          priority: "high",
          correction_method:
            "顧客マスタを確認し、顧客コード：C001を新規登録するか既存顧客に統合してください",
          action_owner: "営業オペレーター",
          estimated_effort_hours: 1,
          required_approver: "営業代表",
          impact_description: "売上計上の妥当性に直結する必須修正項目",
          correction_deadline: "2024-01-15T17:00:00Z",
        },
        {
          instruction_seq: 2,
          error_id: "ERR-002",
          sales_data_id: "SD-2024-002",
          error_type: "duplicate_revenue_posting",
          priority: "critical",
          correction_method:
            "2件の重複売上を特定し、営業実績と契約内容を照合して正当な1件のみを確認し、不正な1件を削除または修正してください",
          action_owner: "営業代表",
          estimated_effort_hours: 2,
          required_approver: "代表兼営業オペレーター",
          impact_description: "売上額の二重計上は請求額に直接影響し、最優先対応が必須",
          correction_deadline: "2024-01-15T15:00:00Z",
        },
        {
          instruction_seq: 3,
          error_id: "ERR-003",
          sales_data_id: "SD-2024-003",
          error_type: "contract_term_violation",
          priority: "high",
          correction_method:
            "契約書で定義された上限額を確認し、超過部分50000円について契約変更が必要か、請求対象外とするかを判定してください",
          action_owner: "営業オペレーター",
          estimated_effort_hours: 1,
          required_approver: "営業代表",
          impact_description: "契約違反となる可能性があるため、顧客との合意確認が必要",
          correction_deadline: "2024-01-15T16:00:00Z",
        },
      ],
      correction_workflow_status: "pending_review",
      notification_targets: [
        {
          recipient_type: "営業オペレーター",
          recipient_id: "OP-001",
          notification_method: "email",
          priority_level: "high",
        },
        {
          recipient_type: "営業代表",
          recipient_id: "REP-001",
          notification_method: "email",
          priority_level: "critical",
        },
      ],
    });

    expect(result.total_uncorrectable_errors).toBe(3);
    expect(result.total_affected_amount).toBe(450000);
    expect(result.instructions.length).toBe(3);
    expect(result.instructions[0].priority).toBe("high");
    expect(result.instructions[1].priority).toBe("critical");
    expect(result.instructions[1].estimated_effort_hours).toBe(2);
    expect(result.instructions[2].required_approver).toBe("営業代表");
    expect(result.correction_workflow_status).toBe("pending_review");
    expect(result.notification_targets.length).toBe(2);
  });

  test("should throw error when uncorrectable errors list is empty", () => {
    const emptyErrors: any[] = [];

    expect(() => generateManualCorrectionInstructions(emptyErrors)).toThrow(
      /エラー/
    );
  });

  test("should throw error when error object is missing required fields", () => {
    const invalidErrors = [
      {
        error_id: "ERR-001",
        // sales_data_id is missing
        error_type: "customer_master_mismatch",
      },
    ];

    expect(() =>
      generateManualCorrectionInstructions(invalidErrors as any)
    ).toThrow(/必須項目/);
  });

  test("should throw error when error is marked as auto_correctable", () => {
    const autoCorrectableError = [
      {
        error_id: "ERR-001",
        sales_data_id: "SD-2024-001",
        error_type: "customer_master_mismatch",
        error_content: "顧客コード不整合",
        affected_amount: 100000,
        is_auto_correctable: true,
        detected_at: "2024-01-15T09:30:00Z",
      },
    ];

    expect(() =>
      generateManualCorrectionInstructions(autoCorrectableError)
    ).toThrow(/自動補正/);
  });

  test("should handle mixed error types with correct priority assignment", () => {
    const mixedErrors = [
      {
        error_id: "ERR-004",
        sales_data_id: "SD-2024-004",
        error_type: "data_type_mismatch",
        error_content: "営業担当者コードが数値型ではなくテキスト型で入力されている",
        affected_amount: 30000,
        is_auto_correctable: false,
        detected_at: "2024-01-15T13:00:00Z",
      },
      {
        error_id: "ERR-005",
        sales_data_id: "SD-2024-005",
        error_type: "duplicate_revenue_posting",
        error_content: "同一案件で3件の重複売上計上",
        affected_amount: 500000,
        is_auto_correctable: false,
        detected_at: "2024-01-15T13:30:00Z",
      },
    ];

    const result = generateManualCorrectionInstructions(mixedErrors);

    expect(result.total_uncorrectable_errors).toBe(2);
    expect(result.total_affected_amount).toBe(530000);
    expect(result.instructions[1].error_type).toBe("duplicate_revenue_posting");
    expect(result.instructions[1].priority).toBe("critical");
    expect(result.instructions[0].priority).toBe("medium");
  });

  test("should include detailed correction method for contract violation errors", () => {
    const contractViolationErrors = [
      {
        error_id: "ERR-006",
        sales_data_id: "SD-2024-006",
        error_type: "contract_term_violation",
        error_content: "契約期間外の売上計上（契約期間：2024-01-01～2024-01-31、計上日：2024-02-05）",
        affected_amount: 75000,
        is_auto_correctable: false,
        detected_at: "2024-01-15T14:00:00Z",
      },
    ];

    const result = generateManualCorrectionInstructions(contractViolationErrors);

    expect(result.instructions[0].error_type).toBe("contract_term_violation");
    expect(result.instructions[0].correction_method).toContain("契約書");
    expect(result.instructions[0].correction_method).toContain("期間");
    expect(result.instructions[0].required_approver).toBe("営業代表");
  });

  test("should set appropriate deadlines based on error priority", () => {
    const criticalAndHighErrors = [
      {
        error_id: "ERR-007",
        sales_data_id: "SD-2024-007",
        error_type: "duplicate_revenue_posting",
        error_content: "重複売上計上",
        affected_amount: 300000,
        is_auto_correctable: false,
        detected_at: "2024-01-15T09:00:00Z",
      },
      {
        error_id: "ERR-008",
        sales_data_id: "SD-2024-008",
        error_type: "customer_master_mismatch",
        error_content: "顧客マスタ不整合",
        affected_amount: 100000,
        is_auto_correctable: false,
        detected_at: "2024-01-15T10:00:00Z",
      },
    ];

    const result = generateManualCorrectionInstructions(criticalAndHighErrors);

    const criticalDeadline = new Date(result.instructions[0].correction_deadline);
    const highDeadline = new Date(result.instructions[1].correction_deadline);
    const criticalTime = criticalDeadline.getTime();
    const highTime = highDeadline.getTime();

    expect(criticalTime).toBeLessThan(highTime);
  });

  test("should include all required notification targets", () => {
    const testErrors = [
      {
        error_id: "ERR-009",
        sales_data_id: "SD-2024-009",
        error_type: "customer_master_mismatch",
        error_content: "顧客情報不整合",
        affected_amount: 80000,
        is_auto_correctable: false,
        detected_at: "2024-01-15T15:00:00Z",
      },
    ];

    const result = generateManualCorrectionInstructions(testErrors);

    expect(result.notification_targets).toBeDefined();
    expect(result.notification_targets.length).toBeGreaterThan(0);
    expect(result.notification_targets[0]).toHaveProperty("recipient_type");
    expect(result.notification_targets[0]).toHaveProperty("notification_method");
    expect(result.notification_targets[0]).toHaveProperty("priority_level");
  });
});