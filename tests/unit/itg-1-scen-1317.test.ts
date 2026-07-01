import { executePaymentProcessing } from "../../src/logic/it-1781935279444-2-2-1";

describe("支払い処理自動判定機能", () => {
  // SCEN-1317
  test("支払い承認基準をすべて満たす請求情報の場合、支払い処理が実行され処理完了が記録される", () => {
    const invoice_id = "INV-2024-001";
    const customer_id = "CUST-2024-A001";
    const amount = 150000;
    const invoice_date = "2024-01-15";
    const due_date = "2024-02-15";
    const quality_check_status = "pass";
    const contract_amount = 200000;
    const payment_terms_days = 30;

    const billing_info = {
      invoice_id,
      customer_id,
      amount,
      invoice_date,
      due_date,
      quality_check_status,
      contract_amount,
      payment_terms_days,
    };

    const result = executePaymentProcessing(billing_info);

    expect(result.payment_executed).toBe(true);
    expect(result.status).toBe("completed");
    expect(result.processing_id).toBeDefined();
    expect(typeof result.processing_id).toBe("string");
    expect(result.processing_id.length).toBeGreaterThan(0);

    expect(result.processed_amount).toBe(150000);

    expect(result.completion_timestamp).toBeDefined();
    const completion_time = new Date(result.completion_timestamp);
    expect(completion_time.getTime()).toBeGreaterThan(0);

    expect(result.quality_verified).toBe(true);
    expect(result.amount_within_contract).toBe(true);
    expect(result.due_date_valid).toBe(true);

    expect(result.processing_history).toBeDefined();
    expect(Array.isArray(result.processing_history)).toBe(true);
    expect(result.processing_history.length).toBeGreaterThan(0);

    const history_entry = result.processing_history[0];
    expect(history_entry.invoice_id).toBe(invoice_id);
    expect(history_entry.amount).toBe(150000);
    expect(history_entry.status).toBe("completed");
    expect(history_entry.timestamp).toBeDefined();
  });
});