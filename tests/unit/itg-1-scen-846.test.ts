import { describe, test, expect } from "@jest/globals";
import { recordContractChangeNotification } from "../../src/logic/it-1781935279444-2-2-1";

describe("契約変更内容の標準化記録機能", () => {
  // SCEN-846
  test("必須項目が不足した契約変更通知の記録時にバリデーションエラーが発生する", () => {
    // 契約ID を空のまま、変更内容を空のまま、その他必須項目は有効値で入力
    const invalid_contract_change_input = {
      contract_id: "",
      customer_name: "テスト顧客株式会社",
      change_content: "",
      change_date_time: new Date("2024-01-15T10:00:00Z"),
      changed_by: "operator_001",
    };

    // バリデーションエラーが発生することを検証
    // 複数の必須項目が不足しているため、エラーメッセージに各項目が含まれることを確認
    expect(() =>
      recordContractChangeNotification(invalid_contract_change_input)
    ).toThrow(/契約ID/);

    // 別途、変更内容の不足もエラーメッセージに含まれることを確認
    expect(() =>
      recordContractChangeNotification(invalid_contract_change_input)
    ).toThrow(/変更内容/);
  });
});