import { generateCorrectionNotification } from "../../src/logic/it-1781935279444-2-1-1";

describe("営業データ入力時の品質検証ルール定義・実行機能", () => {
  // SCEN-716: [normal] 修正指示通知生成 - 検出された複数の不備項目に対して統一フォーマットの修正指示が生成される
  test("複数の不備項目に対して統一フォーマットの修正指示通知が生成されること", () => {
    // テストデータセット1：顧客名空欄、金額形式不正、請求日未入力
    const record_1 = {
      record_id: "REC-001",
      customer_name: "",
      amount: "12,345円",
      billing_date: "",
      contact_date: "2024-01-15",
      deal_status: "open",
    };

    const detected_issues_1 = [
      {
        field_name: "customer_name",
        error_type: "required_field_missing",
        error_message: "顧客名が入力されていません",
        severity: "high",
        correction_guidance: "顧客マスタから顧客名を選択してください",
      },
      {
        field_name: "amount",
        error_type: "invalid_format",
        error_message: "金額形式が正しくありません（数値のみで入力してください）",
        severity: "high",
        correction_guidance: "数値のみを入力してください（例：12345）",
      },
      {
        field_name: "billing_date",
        error_type: "required_field_missing",
        error_message: "請求日が入力されていません",
        severity: "medium",
        correction_guidance: "YYYY-MM-DD形式で請求日を入力してください",
      },
    ];

    const notification_1 = generateCorrectionNotification(
      record_1.record_id,
      detected_issues_1
    );

    // 修正指示通知の基本構造検証
    expect(notification_1).toHaveProperty("notification_id");
    expect(notification_1).toHaveProperty("record_id");
    expect(notification_1).toHaveProperty("generated_at");
    expect(notification_1).toHaveProperty("correction_items");
    expect(notification_1).toHaveProperty("summary");
    expect(notification_1).toHaveProperty("footer");

    // record_id の一致確認
    expect(notification_1.record_id).toBe("REC-001");

    // 修正項目の個数確認
    expect(notification_1.correction_items).toHaveLength(3);

    // 各修正項目の統一フォーマット検証
    notification_1.correction_items.forEach((item: any, index: number) => {
      expect(item).toHaveProperty("item_number");
      expect(item).toHaveProperty("field_name");
      expect(item).toHaveProperty("error_type");
      expect(item).toHaveProperty("error_message");
      expect(item).toHaveProperty("severity");
      expect(item).toHaveProperty("correction_guidance");

      // item_number の連続性確認
      expect(item.item_number).toBe(index + 1);

      // severity値の妥当性確認
      expect(["high", "medium", "low"]).toContain(item.severity);
    });

    // 修正項目1：顧客名（必須項目欠落）
    expect(notification_1.correction_items[0].field_name).toBe(
      "customer_name"
    );
    expect(notification_1.correction_items[0].error_type).toBe(
      "required_field_missing"
    );
    expect(notification_1.correction_items[0].item_number).toBe(1);
    expect(notification_1.correction_items[0].severity).toBe("high");

    // 修正項目2：金額（フォーマット不正）
    expect(notification_1.correction_items[1].field_name).toBe("amount");
    expect(notification_1.correction_items[1].error_type).toBe(
      "invalid_format"
    );
    expect(notification_1.correction_items[1].item_number).toBe(2);
    expect(notification_1.correction_items[1].severity).toBe("high");

    // 修正項目3：請求日（必須項目欠落）
    expect(notification_1.correction_items[2].field_name).toBe("billing_date");
    expect(notification_1.correction_items[2].error_type).toBe(
      "required_field_missing"
    );
    expect(notification_1.correction_items[2].item_number).toBe(3);
    expect(notification_1.correction_items[2].severity).toBe("medium");

    // サマリー情報の検証
    expect(notification_1.summary).toHaveProperty("total_issues");
    expect(notification_1.summary).toHaveProperty("high_severity_count");
    expect(notification_1.summary).toHaveProperty("medium_severity_count");
    expect(notification_1.summary).toHaveProperty("low_severity_count");
    expect(notification_1.summary.total_issues).toBe(3);
    expect(notification_1.summary.high_severity_count).toBe(2);
    expect(notification_1.summary.medium_severity_count).toBe(1);
    expect(notification_1.summary.low_severity_count).toBe(0);

    // フッター情報の検証
    expect(notification_1.footer).toHaveProperty("contact_url");
    expect(notification_1.footer).toHaveProperty("deadline_date");
    expect(notification_1.footer).toHaveProperty("escalation_email");

    // generated_at が ISO 8601 形式であることを確認
    expect(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(
      notification_1.generated_at
    )).toBe(true);

    // テストデータセット2：別のレコードで同じフォーマット一貫性を検証
    const record_2 = {
      record_id: "REC-002",
      customer_name: "",
      deal_status: "",
      contact_date: "invalid-date",
    };

    const detected_issues_2 = [
      {
        field_name: "customer_name",
        error_type: "required_field_missing",
        error_message: "顧客名が入力されていません",
        severity: "high",
        correction_guidance: "顧客マスタから顧客名を選択してください",
      },
      {
        field_name: "deal_status",
        error_type: "required_field_missing",
        error_message: "商談ステータスが入力されていません",
        severity: "high",
        correction_guidance:
          "選択肢から適切なステータスを選択してください（open/closed/pending）",
      },
      {
        field_name: "contact_date",
        error_type: "invalid_format",
        error_message: "接触日時形式が正しくありません",
        severity: "medium",
        correction_guidance: "YYYY-MM-DD形式で接触日時を入力してください",
      },
    ];

    const notification_2 = generateCorrectionNotification(
      record_2.record_id,
      detected_issues_2
    );

    // record_id の確認
    expect(notification_2.record_id).toBe("REC-002");

    // 修正項目の個数確認
    expect(notification_2.correction_items).toHaveLength(3);

    // フォーマット一貫性確認：各修正項目が必須プロパティを持つ
    notification_2.correction_items.forEach((item: any, index: number) => {
      expect(item).toHaveProperty("item_number");
      expect(item).toHaveProperty("field_name");
      expect(item).toHaveProperty("error_type");
      expect(item).toHaveProperty("error_message");
      expect(item).toHaveProperty("severity");
      expect(item).toHaveProperty("correction_guidance");
      expect(item.item_number).toBe(index + 1);
    });

    // 修正項目1：顧客名
    expect(notification_2.correction_items[0].field_name).toBe(
      "customer_name"
    );
    expect(notification_2.correction_items[0].severity).toBe("high");

    // 修正項目2：商談ステータス
    expect(notification_2.correction_items[1].field_name).toBe("deal_status");
    expect(notification_2.correction_items[1].severity).toBe("high");

    // 修正項目3：接触日時
    expect(notification_2.correction_items[2].field_name).toBe("contact_date");
    expect(notification_2.correction_items[2].severity).toBe("medium");

    // サマリー情報の検証（REC-002）
    expect(notification_2.summary.total_issues).toBe(3);
    expect(notification_2.summary.high_severity_count).toBe(2);
    expect(notification_2.summary.medium_severity_count).toBe(1);
    expect(notification_2.summary.low_severity_count).toBe(0);

    // フッター情報の検証（REC-002）
    expect(notification_2.footer).toHaveProperty("contact_url");
    expect(notification_2.footer).toHaveProperty("deadline_date");
    expect(notification_2.footer).toHaveProperty("escalation_email");

    // 2つの通知のフォーマット構造が一致していることを確認
    expect(Object.keys(notification_1).sort()).toEqual(
      Object.keys(notification_2).sort()
    );

    // correction_items の構造が一致していることを確認
    expect(Object.keys(notification_1.correction_items[0]).sort()).toEqual(
      Object.keys(notification_2.correction_items[0]).sort()
    );

    // summary の構造が一致していることを確認
    expect(Object.keys(notification_1.summary).sort()).toEqual(
      Object.keys(notification_2.summary).sort()
    );

    // footer の構造が一致していることを確認
    expect(Object.keys(notification_1.footer).sort()).toEqual(
      Object.keys(notification_2.footer).sort()
    );

    // notification_id が生成されていることを確認
    expect(notification_1.notification_id).toBeDefined();
    expect(notification_2.notification_id).toBeDefined();
    expect(notification_1.notification_id).not.toBe(
      notification_2.notification_id
    );

    // generated_at の形式が一貫していることを確認
    const timestamp_pattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/;
    expect(timestamp_pattern.test(notification_1.generated_at)).toBe(true);
    expect(timestamp_pattern.test(notification_2.generated_at)).toBe(true);
  });
});