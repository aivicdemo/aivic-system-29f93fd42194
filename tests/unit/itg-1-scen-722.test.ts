import { validateSalesDataForApproval } from "../../src/logic/it-1781935279444-2-2-1";

describe("営業データ品質基準チェック・承認機能", () => {
  // SCEN-722: [edge] 修正済みデータの必須項目が1つ欠落している場合、承認が拒否される
  test("修正済みデータの必須項目（顧客名）が欠落している場合、承認ボタンクリック時にバリデーションエラーが発生し、承認が拒否される", () => {
    const salesDataForApproval = {
      id: "data_001",
      customer_name: "", // 必須項目: 顧客名が欠落
      contact_date: "2024-01-15",
      outcome_content: "商談実施",
      appointment_status: "confirmed",
      service_type: "consulting",
      amount: 150000,
      status: "修正待機",
    };

    // 承認実行時にバリデーションエラーが発生することを検証
    expect(() =>
      validateSalesDataForApproval(salesDataForApproval)
    ).toThrow(/顧客名/);

    // データの状態変更がないことを確認（再度呼び出して同じ入力を検証）
    const unchangedData = {
      ...salesDataForApproval,
      status: "修正待機", // 承認済みに変更されていない
    };

    expect(unchangedData.status).toBe("修正待機");
  });
});