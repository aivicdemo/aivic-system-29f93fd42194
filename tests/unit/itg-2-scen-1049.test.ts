import { describe, test, expect } from "@jest/globals";
import { validateQuotationComparisonData } from "../../src/logic/it-1-br-2-2-2-1";

describe("査定員ごとの判定結果と根拠の月次集計・分析ダッシュボード", () => {
  // SCEN-1049: [error] 判定根拠表示・ダッシュボード統合機能 - 照合対象となる過去案件データが存在しない場合にエラー状態を表示する
  test("should display error state when reference past project data does not exist", () => {
    const input_quote_id = "QT-20240115-001";
    const input_quote_amount = 5000000;
    const input_quote_items = [
      {
        item_id: "ITEM-001",
        item_name: "基礎工事",
        quantity: 100,
        unit_price: 50000,
      },
    ];
    const input_past_project_data = [];
    const input_price_book_data = [
      {
        book_id: "PB-2024-01",
        category: "基礎工事",
        base_unit_price: 48000,
        region: "東京都",
        effective_date: "2024-01-01",
      },
    ];

    const result = validateQuotationComparisonData({
      quote_id: input_quote_id,
      quote_amount: input_quote_amount,
      quote_items: input_quote_items,
      past_project_data: input_past_project_data,
      price_book_data: input_price_book_data,
    });

    expect(result.is_valid).toBe(false);
    expect(result.error_code).toBe("PAST_PROJECT_DATA_NOT_FOUND");
    expect(result.error_message).toMatch(/照合対象/);
    expect(result.error_status_code).toBe(404);
    expect(result.error_severity).toBe("HIGH");
    expect(result.user_notification_message).toMatch(/データが見つかりません/);
    expect(result.suggested_actions).toContain("データの再確認");
    expect(result.suggested_actions).toContain("サポートへの連絡");
  });
});