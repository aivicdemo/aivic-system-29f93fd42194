import { detectAbnormalValues } from "../../src/logic/it-1781935279444-2-2-1";

describe("営業データの完全性・正確性を自動検証し、不足データ・誤りを検出・通知する機能", () => {
  // SCEN-877: [normal] 営業データ異常値自動検出機能 - 営業データの型・範囲・形式が全て正常な場合に『正常』と返される
  test("営業データの型・範囲・形式が全て正常な場合に検出結果が『正常』と返される", () => {
    const valid_sales_data = {
      customer_name: "株式会社テスト",
      contact_date: "2024-01-15",
      contact_time: "14:30",
      contact_type: "電話",
      result_content: "商品説明実施",
      appointment_confirmed: true,
      appointment_date: "2024-01-20",
      amount: 150000,
      service_type: "基本契約",
      email: "test@example.com",
      phone_number: "090-1234-5678",
      postal_code: "100-0001",
      notes: "顧客が商品に興味を示した",
    };

    const result = detectAbnormalValues(valid_sales_data);

    expect(result.status).toBe("正常");
    expect(result.has_error).toBe(false);
    expect(result.error_details).toEqual([]);
    expect(result.message).toBe("");
  });
});