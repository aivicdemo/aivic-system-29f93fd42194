import { validateContractChecklist } from "../../src/logic/it-1-1-1";

describe("営業成果データの自動検証ルール定義と異常検出機能", () => {
  test("SCEN-1106: 契約書管理チェックリスト検証 - 顧客情報の必須項目欠落時に不合格判定", () => {
    // 契約書管理チェックリスト検証：顧客メールアドレスが欠落している場合
    const input = {
      customer_name: "○○株式会社",
      address: "東京都渋谷区",
      phone_number: "03-XXXX-XXXX",
      email: "", // 必須項目の欠落
    };

    const result = validateContractChecklist(input);

    // 検証結果ステータスが『不合格』であること
    expect(result.status).toBe("不合格");

    // エラーメッセージが必須項目不足を示すこと
    expect(result.error_message).toMatch(/必須項目/);

    // 欠落項目が『顧客メールアドレス』と特定されること
    expect(result.missing_fields).toContain("email");

    // 検証ルール違反フラグが立つこと
    expect(result.validation_failed).toBe(true);

    // 顧客情報の完全性が確認できないこと
    expect(result.can_proceed_to_next_step).toBe(false);
  });
});