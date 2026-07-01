import { describe, it, expect } from "@jest/globals";
import { validateContractChangeNotificationEmail } from "../../src/logic/it-1781935279444-2-2-1";

describe("営業データの完全性・正確性を自動検証し、不足データ・誤りを検出・通知する機能", () => {
  it("SCEN-875: 契約変更検証レポート自動生成機能 - 顧客企業の営業責任者メールアドレスが無効または登録されていない場合にエラーが検出される", () => {
    // ハッピーパス: 有効なメールアドレス
    const valid_email = "sales@example.com";
    const valid_result = validateContractChangeNotificationEmail({
      customer_id: "CUST-001",
      customer_name: "テスト顧客企業",
      sales_rep_email: valid_email,
      contract_change_date: "2024-01-15",
      change_details: "契約金額変更: 100万円 → 150万円"
    });

    expect(valid_result.is_valid).toBe(true);
    expect(valid_result.error_code).toBeNull();
    expect(valid_result.error_message).toBeNull();
    expect(valid_result.notification_sent).toBe(true);

    // エラーケース1: 空白のメールアドレス
    expect(() =>
      validateContractChangeNotificationEmail({
        customer_id: "CUST-001",
        customer_name: "テスト顧客企業",
        sales_rep_email: "",
        contract_change_date: "2024-01-15",
        change_details: "契約金額変更: 100万円 → 150万円"
      })
    ).toThrow(/メールアドレス/);

    // エラーケース2: 無効なメールアドレス形式 (@ の後に空白)
    expect(() =>
      validateContractChangeNotificationEmail({
        customer_id: "CUST-001",
        customer_name: "テスト顧客企業",
        sales_rep_email: "test@",
        contract_change_date: "2024-01-15",
        change_details: "契約金額変更: 100万円 → 150万円"
      })
    ).toThrow(/メールアドレス/);

    // エラーケース3: 無効なメールアドレス形式 (@ が存在しない)
    expect(() =>
      validateContractChangeNotificationEmail({
        customer_id: "CUST-001",
        customer_name: "テスト顧客企業",
        sales_rep_email: "invalid-email",
        contract_change_date: "2024-01-15",
        change_details: "契約金額変更: 100万円 → 150万円"
      })
    ).toThrow(/メールアドレス/);

    // エラーケース4: null メールアドレス
    expect(() =>
      validateContractChangeNotificationEmail({
        customer_id: "CUST-001",
        customer_name: "テスト顧客企業",
        sales_rep_email: null as any,
        contract_change_date: "2024-01-15",
        change_details: "契約金額変更: 100万円 → 150万円"
      })
    ).toThrow(/メールアドレス/);

    // エラーケース5: undefined メールアドレス
    expect(() =>
      validateContractChangeNotificationEmail({
        customer_id: "CUST-001",
        customer_name: "テスト顧客企業",
        sales_rep_email: undefined as any,
        contract_change_date: "2024-01-15",
        change_details: "契約金額変更: 100万円 → 150万円"
      })
    ).toThrow(/メールアドレス/);

    // ハッピーパス: 複数の有効なメールアドレス形式
    const valid_formats = [
      "user@domain.com",
      "first.last@domain.co.jp",
      "user+tag@example.com",
      "user123@sub.domain.org"
    ];

    valid_formats.forEach((email) => {
      const result = validateContractChangeNotificationEmail({
        customer_id: "CUST-001",
        customer_name: "テスト顧客企業",
        sales_rep_email: email,
        contract_change_date: "2024-01-15",
        change_details: "契約金額変更: 100万円 → 150万円"
      });

      expect(result.is_valid).toBe(true);
      expect(result.error_code).toBeNull();
      expect(result.notification_sent).toBe(true);
    });

    // エラーケース6: スペースを含むメールアドレス
    expect(() =>
      validateContractChangeNotificationEmail({
        customer_id: "CUST-001",
        customer_name: "テスト顧客企業",
        sales_rep_email: "user @domain.com",
        contract_change_date: "2024-01-15",
        change_details: "契約金額変更: 100万円 → 150万円"
      })
    ).toThrow(/メールアドレス/);

    // エラーケース7: ドメインなしのメールアドレス
    expect(() =>
      validateContractChangeNotificationEmail({
        customer_id: "CUST-001",
        customer_name: "テスト顧客企業",
        sales_rep_email: "useronly",
        contract_change_date: "2024-01-15",
        change_details: "契約金額変更: 100万円 → 150万円"
      })
    ).toThrow(/メールアドレス/);
  });
});