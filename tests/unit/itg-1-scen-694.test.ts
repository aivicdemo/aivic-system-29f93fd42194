import { validateSalesActivityData } from "../../src/logic/it-1781935279444-2-2-1";

describe("営業データの完全性・正確性自動検証", () => {
  // SCEN-694
  test("すべての必須フィールドが正しいデータ型で入力された営業活動データが検証に合格する", () => {
    const input = {
      sales_person_name: "山田太郎",
      customer_name: "株式会社ABC",
      activity_datetime: "2024-01-15T14:30:00Z",
      activity_type: "初回訪問",
      amount: 150000,
      appointment_confirmed: true,
      service_type: "営業支援サービス",
      notes: "初回打ち合わせ実施"
    };

    const result = validateSalesActivityData(input);

    expect(result.status).toBe("success");
    expect(result.is_valid).toBe(true);
    expect(result.error_messages).toEqual([]);
    expect(result.validation_summary).toEqual({
      required_fields_complete: true,
      data_types_correct: true,
      value_ranges_valid: true
    });
  });
});