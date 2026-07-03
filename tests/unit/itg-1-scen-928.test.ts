import { describe, test, expect } from "@jest/globals";
import { validateSalesDataQuality } from "../../src/logic/it-1781935279444-2-2-1";

describe("営業データ品質検証ルール適用", () => {
  test("SCEN-928: 金額異常値（期待値の±20%超過）を検出し、修正指示が通知対象として記録される", () => {
    // 営業データ品質検証ルール適用機能の初期化と入力データの準備
    const expectedAmount = 100000;
    const toleranceRate = 0.2;
    const toleranceLowerBound = expectedAmount * (1 - toleranceRate);
    const toleranceUpperBound = expectedAmount * (1 + toleranceRate);
    const actualAmount = 150000;

    const salesData = {
      sales_transaction_id: "TXN-20240115-001",
      customer_id: "CUST-A001",
      service_id: "SVC-BASIC",
      amount: actualAmount,
      transaction_date: "2024-01-15T10:00:00Z",
      status: "confirmed",
    };

    const validationRule = {
      rule_id: "RULE-AMOUNT-001",
      field_name: "amount",
      rule_type: "range",
      expected_value: expectedAmount,
      tolerance_rate: toleranceRate,
      lower_bound: toleranceLowerBound,
      upper_bound: toleranceUpperBound,
    };

    // 検証ルールエンジンを実行
    const validationResult = validateSalesDataQuality({
      sales_data: salesData,
      validation_rules: [validationRule],
    });

    // 金額異常値が検出されたことを確認
    expect(validationResult.validation_status).toBe("failed");
    expect(validationResult.detected_errors).toHaveLength(1);

    const detectedError = validationResult.detected_errors[0];
    expect(detectedError.field_name).toBe("amount");
    expect(detectedError.error_type).toBe("range_exceeded");
    expect(detectedError.actual_value).toBe(150000);
    expect(detectedError.expected_value).toBe(100000);
    expect(detectedError.tolerance_lower_bound).toBe(80000);
    expect(detectedError.tolerance_upper_bound).toBe(120000);

    // 異常値が上限を超えていることを検証
    expect(actualAmount).toBeGreaterThan(toleranceUpperBound);
    const exceededAmount = actualAmount - toleranceUpperBound;
    expect(exceededAmount).toBe(30000);

    // 修正指示が生成されたことを確認
    expect(validationResult.correction_instructions).toBeDefined();
    expect(validationResult.correction_instructions).toHaveLength(1);

    const correctionInstruction = validationResult.correction_instructions[0];
    expect(correctionInstruction.instruction_id).toBeDefined();
    expect(correctionInstruction.field_name).toBe("amount");
    expect(correctionInstruction.issue_summary).toContain("金額異常値");
    expect(correctionInstruction.expected_range_min).toBe(80000);
    expect(correctionInstruction.expected_range_max).toBe(120000);
    expect(correctionInstruction.actual_value).toBe(150000);
    expect(correctionInstruction.difference_from_upper_bound).toBe(30000);
    expect(correctionInstruction.action_required).toBe("correction_needed");

    // 修正指示が通知対象として記録されたことを確認
    expect(validationResult.notification_targets).toBeDefined();
    expect(validationResult.notification_targets).toHaveLength(1);

    const notificationTarget = validationResult.notification_targets[0];
    expect(notificationTarget.notification_type).toBe("correction_instruction");
    expect(notificationTarget.severity_level).toBe("error");
    expect(notificationTarget.recipient_role).toBe("operations_manager");
    expect(notificationTarget.sales_transaction_id).toBe("TXN-20240115-001");
    expect(notificationTarget.customer_id).toBe("CUST-A001");

    // 通知対象の記録内容の詳細検証
    expect(notificationTarget.error_details).toBeDefined();
    expect(notificationTarget.error_details.field_name).toBe("amount");
    expect(notificationTarget.error_details.actual_value).toBe(150000);
    expect(notificationTarget.error_details.expected_value).toBe(100000);
    expect(notificationTarget.error_details.tolerance_lower_bound).toBe(80000);
    expect(notificationTarget.error_details.tolerance_upper_bound).toBe(120000);
    expect(notificationTarget.error_details.exceeds_upper_bound_by).toBe(30000);

    expect(notificationTarget.correction_guidance).toBeDefined();
    expect(notificationTarget.correction_guidance.required_action).toBe(
      "review_and_correct_amount"
    );
    expect(notificationTarget.correction_guidance.acceptable_range_min).toBe(
      80000
    );
    expect(notificationTarget.correction_guidance.acceptable_range_max).toBe(
      120000
    );
    expect(notificationTarget.correction_guidance.correction_deadline).toBeDefined();

    // 通知タイムスタンプと記録ステータスの確認
    expect(notificationTarget.created_at).toBeDefined();
    expect(notificationTarget.status).toBe("pending_notification");
  });
});