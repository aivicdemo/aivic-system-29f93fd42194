import { validateCustomerInquirySlaBreach } from "../../src/logic/it-1-1-1";

describe("営業成果データの自動検証ルール定義と異常検出機能", () => {
  // SCEN-1213: 問い合わせ対応SLA管理機能 - 営業日ベースで1営業日超過時にSLA違反フラグ立てられる
  test("問い合わせ受領から回答完了までが営業日ベースで1営業日を超えた場合、SLA違反フラグが立てられる", () => {
    // 前営業日の16:00に問い合わせを受領した場合を想定
    // 2025-02-20(木) 16:00に受領 → 翌営業日 2025-02-21(金) 09:00に回答完了
    // 営業日 = 月〜金 09:00〜18:00 と定義
    // 2025-02-20(木) 16:00 から 2025-02-21(金) 09:00 は営業日ベースで1営業日以内のため、SLA違反なし

    // テストケース1: 営業日ベースで1営業日以内の回答
    const inquiry_within_sla = {
      inquiry_id: "INQ-001",
      customer_id: "CUST-A",
      received_at: new Date("2025-02-20T16:00:00+09:00"),
      response_completed_at: new Date("2025-02-21T09:00:00+09:00"),
      inquiry_category: "請求内容確認",
      response_summary: "請求額は契約条件に基づいて正確に計算されています",
    };

    const result_within = validateCustomerInquirySlaBreach(inquiry_within_sla);
    expect(result_within.is_sla_violated).toBe(false);
    expect(result_within.sla_hours_elapsed).toBe(17);

    // テストケース2: 営業日ベースで1営業日を超過した回答
    // 2025-02-20(木) 16:00に受領 → 2025-02-24(月) 10:00に回答完了
    // 営業日: 木 16:00→18:00(2時間) + 金 09:00→18:00(9時間) + 月 09:00→10:00(1時間) = 12営業時間 = 1.5営業日
    const inquiry_exceed_sla = {
      inquiry_id: "INQ-002",
      customer_id: "CUST-B",
      received_at: new Date("2025-02-20T16:00:00+09:00"),
      response_completed_at: new Date("2025-02-24T10:00:00+09:00"),
      inquiry_category: "請求額相違異議",
      response_summary: "前月の営業実績データを再確認し、請求額を修正いたします",
    };

    const result_exceed = validateCustomerInquirySlaBreach(inquiry_exceed_sla);
    expect(result_exceed.is_sla_violated).toBe(true);
    expect(result_exceed.sla_hours_elapsed).toBe(42);
    expect(result_exceed.sla_violation_category).toBe("超過");

    // テストケース3: 営日ベースで厳密に1営業日（9時間）の回答
    // 2025-02-20(木) 09:00に受領 → 2025-02-21(金) 09:00に回答完了
    // 営業日: 木 09:00→18:00(9時間) = 1営業日
    const inquiry_exactly_sla = {
      inquiry_id: "INQ-003",
      customer_id: "CUST-C",
      received_at: new Date("2025-02-20T09:00:00+09:00"),
      response_completed_at: new Date("2025-02-21T09:00:00+09:00"),
      inquiry_category: "納期確認",
      response_summary: "成果物納期は契約に記載の2025-03-15です",
    };

    const result_exactly = validateCustomerInquirySlaBreach(inquiry_exactly_sla);
    expect(result_exactly.is_sla_violated).toBe(false);
    expect(result_exactly.sla_hours_elapsed).toBe(24);

    // テストケース4: SLA違反時の詳細情報が記録されているか
    expect(result_exceed).toEqual(
      expect.objectContaining({
        inquiry_id: "INQ-002",
        customer_id: "CUST-B",
        is_sla_violated: true,
        sla_violation_category: "超過",
        sla_hours_elapsed: expect.any(Number),
        violation_recorded_at: expect.any(Date),
      })
    );

    // テストケース5: 土日を含む場合の営業日計算
    // 2025-02-21(金) 16:00に受領 → 2025-02-24(月) 10:00に回答完了
    // 金 16:00→18:00(2時間) + 月 09:00→10:00(1時間) = 3営業時間 = 0.33営業日
    const inquiry_with_weekend = {
      inquiry_id: "INQ-004",
      customer_id: "CUST-D",
      received_at: new Date("2025-02-21T16:00:00+09:00"),
      response_completed_at: new Date("2025-02-24T10:00:00+09:00"),
      inquiry_category: "レポート内容確認",
      response_summary: "レポートのアポ数集計ロジックをご説明いたします",
    };

    const result_weekend = validateCustomerInquirySlaBreach(inquiry_with_weekend);
    expect(result_weekend.is_sla_violated).toBe(false);
    expect(result_weekend.sla_hours_elapsed).toBe(3);

    // テストケース6: 受領から1営業日を1秒でも超過したらSLA違反
    // 2025-02-20(木) 09:00に受領 → 2025-02-21(金) 09:00:01に回答完了
    const inquiry_exceed_by_one_second = {
      inquiry_id: "INQ-005",
      customer_id: "CUST-E",
      received_at: new Date("2025-02-20T09:00:00+09:00"),
      response_completed_at: new Date("2025-02-21T09:00:01+09:00"),
      inquiry_category: "その他",
      response_summary: "対応いたしました",
    };

    const result_one_second = validateCustomerInquirySlaBreach(
      inquiry_exceed_by_one_second
    );
    expect(result_one_second.is_sla_violated).toBe(true);
    expect(result_one_second.sla_violation_category).toBe("超過");
  });
});