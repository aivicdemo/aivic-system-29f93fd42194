import { describe, it, expect } from "@jest/globals";
import { validateInvoiceChecklist } from "../../src/logic/it-1781935279444-2-1-1";

describe("Invoice Checklist Validation", () => {
  it("SCEN-904: [normal] 請求書作成チェックリスト検証機能 - 全チェックリスト項目が検証基準を満たし、完了ステータスが返される", () => {
    const invoice_data = {
      customer_name: "テスト顧客",
      invoice_amount: 100000,
      invoice_date: "2024-01-15",
      payment_due_date: "2024-02-15",
      tax_rate: 0.1,
      subtotal: 100000,
      tax_amount: 10000,
      total_amount: 110000,
      bank_account_number: "1234567890",
    };

    const result = validateInvoiceChecklist(invoice_data);

    expect(result.status).toBe("完了");
    expect(result.checklist_items).toHaveLength(6);

    const item_1_customer_name = result.checklist_items[0];
    expect(item_1_customer_name.check_item).toBe("顧客名");
    expect(item_1_customer_name.is_valid).toBe(true);

    const item_2_invoice_amount = result.checklist_items[1];
    expect(item_2_invoice_amount.check_item).toBe("請求金額");
    expect(item_2_invoice_amount.is_valid).toBe(true);

    const item_3_invoice_date = result.checklist_items[2];
    expect(item_3_invoice_date.check_item).toBe("請求日付");
    expect(item_3_invoice_date.is_valid).toBe(true);

    const item_4_payment_due = result.checklist_items[3];
    expect(item_4_payment_due.check_item).toBe("支払期限");
    expect(item_4_payment_due.is_valid).toBe(true);

    const item_5_tax = result.checklist_items[4];
    expect(item_5_tax.check_item).toBe("消費税");
    expect(item_5_tax.is_valid).toBe(true);

    const item_6_bank_account = result.checklist_items[5];
    expect(item_6_bank_account.check_item).toBe("銀行口座情報");
    expect(item_6_bank_account.is_valid).toBe(true);

    expect(result.all_checks_passed).toBe(true);
  });
});