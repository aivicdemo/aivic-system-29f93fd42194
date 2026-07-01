import { validateInvoiceAmountAndDeterminApprovalFlow } from "../../src/logic/it-1781935279444-2-1-1";

describe("営業データ入力時の品質検証ルール定義・実行機能", () => {
  test("SCEN-914: [error] 請求額異常値判定・承認フロー自動決定機能 - 請求額が検証ルール違反で、要修正フローが決定される", () => {
    // テスト用の請求データを準備（請求額が検証ルール違反の値）
    const invoiceData = {
      invoice_id: "INV-2024-001",
      customer_id: "CUST-123",
      service_id: "SRV-456",
      invoice_amount: -50000, // 負の金額は検証ルール違反
      invoice_date: "2024-01-15",
      contract_id: "CONTRACT-789",
      status: "pending_approval",
    };

    // 請求額異常値判定機能を実行
    const result = validateInvoiceAmountAndDeterminApprovalFlow(invoiceData);

    // システムが検証ルール違反を検出したことを確認
    expect(result.is_valid).toBe(false);
    expect(result.validation_error_count).toBe(1);

    // 承認フロー自動決定ロジックが実行され、決定されたフロー種別が『要修正フロー』であることを確認
    expect(result.approval_flow_type).toBe("修正要求フロー");

    // 修正指示が生成されていることを確認
    expect(result.correction_instruction).toBeDefined();
    expect(result.correction_instruction.instruction_id).toBeDefined();

    // 修正内容の詳細情報が正確に記録されていることを確認
    expect(result.correction_instruction.violation_item).toBe("invoice_amount");
    expect(result.correction_instruction.violation_reason).toMatch(/金額/);
    expect(result.correction_instruction.correction_method).toBeDefined();

    // ステータスが『修正待ち』に遷移していることを確認
    expect(result.new_status).toBe("修正待ち");

    // 検証ルール違反の詳細メッセージが記録されていることを確認
    expect(result.validation_errors).toHaveLength(1);
    expect(result.validation_errors[0]).toMatch(/請求額/);
  });
});