import { detectDataQualityIssues } from "../../src/logic/it-1781935279444-2-2-1";

describe("営業データの完全性・正確性を自動検証し、不足データ・誤りを検出・通知する機能", () => {
  // SCEN-1134: [normal] 異常値・欠落データ自動検出 - 複数の異常値と欠落データが混在する場合、全て検出され修正対象として通知される
  test("複数の異常値と欠落データが混在する場合、全て検出され修正対象として通知される", () => {
    const input_sales_data = [
      {
        record_id: "REC-001",
        customer_name: "A社",
        sales_amount: -50000,
        sales_date: "2024-13-45",
        discount_rate: 150,
        billing_amount: 100000,
        delivery_date: "2024-01-31",
      },
      {
        record_id: "REC-002",
        customer_name: "",
        sales_amount: 75000,
        sales_date: "2024-01-15",
        discount_rate: 20,
        billing_amount: 60000,
        delivery_date: "2024-02-28",
      },
      {
        record_id: "REC-003",
        customer_name: "B社",
        sales_amount: 120000,
        sales_date: "2024-01-20",
        discount_rate: 35,
        billing_amount: undefined,
        delivery_date: "2024-03-15",
      },
      {
        record_id: "REC-004",
        customer_name: "C社",
        sales_amount: 90000,
        sales_date: "2024-02-10",
        discount_rate: 10,
        billing_amount: 81000,
        delivery_date: undefined,
      },
    ];

    const result = detectDataQualityIssues(input_sales_data);

    expect(result.detection_status).toBe("COMPLETED");
    expect(result.total_records_processed).toBe(4);
    expect(result.records_with_issues).toBe(4);

    // 異常値検出: 負の売上額
    expect(result.abnormal_values).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          record_id: "REC-001",
          field_name: "sales_amount",
          detected_value: -50000,
          issue_type: "NEGATIVE_VALUE",
        }),
      ])
    );

    // 異常値検出: 不正な日付形式
    expect(result.abnormal_values).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          record_id: "REC-001",
          field_name: "sales_date",
          detected_value: "2024-13-45",
          issue_type: "INVALID_DATE_FORMAT",
        }),
      ])
    );

    // 異常値検出: 範囲外の割引率
    expect(result.abnormal_values).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          record_id: "REC-001",
          field_name: "discount_rate",
          detected_value: 150,
          issue_type: "OUT_OF_RANGE",
        }),
      ])
    );

    expect(result.abnormal_values).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          record_id: "REC-003",
          field_name: "discount_rate",
          detected_value: 35,
          issue_type: "OUT_OF_RANGE",
        }),
      ])
    );

    // 欠落データ検出: 顧客名の欠落
    expect(result.missing_data).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          record_id: "REC-002",
          field_name: "customer_name",
          issue_type: "MISSING_REQUIRED_FIELD",
        }),
      ])
    );

    // 欠落データ検出: 請求金額の欠落
    expect(result.missing_data).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          record_id: "REC-003",
          field_name: "billing_amount",
          issue_type: "MISSING_REQUIRED_FIELD",
        }),
      ])
    );

    // 欠落データ検出: 納期の欠落
    expect(result.missing_data).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          record_id: "REC-004",
          field_name: "delivery_date",
          issue_type: "MISSING_REQUIRED_FIELD",
        }),
      ])
    );

    // 検出された全ての異常値・欠落データが修正対象として通知されている
    expect(result.correction_required_records).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          record_id: "REC-001",
          correction_items: expect.arrayContaining([
            "sales_amount",
            "sales_date",
            "discount_rate",
          ]),
          severity: "HIGH",
        }),
        expect.objectContaining({
          record_id: "REC-002",
          correction_items: expect.arrayContaining(["customer_name"]),
          severity: "HIGH",
        }),
        expect.objectContaining({
          record_id: "REC-003",
          correction_items: expect.arrayContaining([
            "discount_rate",
            "billing_amount",
          ]),
          severity: "HIGH",
        }),
        expect.objectContaining({
          record_id: "REC-004",
          correction_items: expect.arrayContaining(["delivery_date"]),
          severity: "MEDIUM",
        }),
      ])
    );

    // 通知内容にレコード特定情報と修正が必要な項目が明記されている
    expect(result.notification_message).toContain("REC-001");
    expect(result.notification_message).toContain("REC-002");
    expect(result.notification_message).toContain("REC-003");
    expect(result.notification_message).toContain("REC-004");
    expect(result.notification_message).toContain("sales_amount");
    expect(result.notification_message).toContain("sales_date");
    expect(result.notification_message).toContain("discount_rate");
    expect(result.notification_message).toContain("customer_name");
    expect(result.notification_message).toContain("billing_amount");
    expect(result.notification_message).toContain("delivery_date");

    // 修正対象の件数が正確に計算されている
    expect(result.correction_required_records.length).toBe(4);

    // 異常値の総数が正確である
    expect(result.abnormal_values.length).toBeGreaterThanOrEqual(4);

    // 欠落データの総数が正確である
    expect(result.missing_data.length).toBeGreaterThanOrEqual(3);
  });
});