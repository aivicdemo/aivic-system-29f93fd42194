import { classifyInquiry } from "../../src/logic/it-1-1-1";

describe("営業成果データの自動検証ルール定義と異常検出機能", () => {
  // SCEN-1159: [normal] 問い合わせ内容の分類・優先度決定機能 - 顧客からの問い合わせ内容を5つのカテゴリに正確に分類できる
  test("should classify customer inquiries into 5 correct categories with priority", () => {
    // 請求・支払い関連 (billing_payment) - サンプル1-3
    const billing_inquiry_1 = {
      inquiry_id: "INQ-001",
      customer_id: "CUST-A001",
      inquiry_content: "先月の請求額が前月比で20%高くなっています。請求内容の根拠を教えてください。",
      inquiry_date: "2024-01-15",
    };
    const result_1 = classifyInquiry(billing_inquiry_1);
    expect(result_1.category).toBe("billing_payment");
    expect(result_1.priority).toBe(1);
    expect(result_1.confidence).toBeGreaterThanOrEqual(0.95);

    const billing_inquiry_2 = {
      inquiry_id: "INQ-002",
      customer_id: "CUST-A002",
      inquiry_content: "請求書に記載されたサービスAの単価が契約書と異なります。確認願います。",
      inquiry_date: "2024-01-15",
    };
    const result_2 = classifyInquiry(billing_inquiry_2);
    expect(result_2.category).toBe("billing_payment");
    expect(result_2.priority).toBe(1);

    const billing_inquiry_3 = {
      inquiry_id: "INQ-003",
      customer_id: "CUST-A003",
      inquiry_content: "支払期限を30日後に延長することは可能ですか？",
      inquiry_date: "2024-01-15",
    };
    const result_3 = classifyInquiry(billing_inquiry_3);
    expect(result_3.category).toBe("billing_payment");
    expect(result_3.priority).toBe(2);

    // 製品・サービス仕様関連 (product_service_spec) - サンプル4-6
    const product_inquiry_1 = {
      inquiry_id: "INQ-004",
      customer_id: "CUST-B001",
      inquiry_content: "サービスBの対応可能な営業地域を教えてください。",
      inquiry_date: "2024-01-15",
    };
    const result_4 = classifyInquiry(product_inquiry_1);
    expect(result_4.category).toBe("product_service_spec");
    expect(result_4.priority).toBe(1);
    expect(result_4.confidence).toBeGreaterThanOrEqual(0.95);

    const product_inquiry_2 = {
      inquiry_id: "INQ-005",
      customer_id: "CUST-B002",
      inquiry_content: "プランCに含まれる成約フォローアップの回数制限は？",
      inquiry_date: "2024-01-15",
    };
    const result_5 = classifyInquiry(product_inquiry_2);
    expect(result_5.category).toBe("product_service_spec");
    expect(result_5.priority).toBe(1);

    const product_inquiry_3 = {
      inquiry_id: "INQ-006",
      customer_id: "CUST-B003",
      inquiry_content: "営業データレポートに顧客反応スコアが表示されません。仕様ですか？",
      inquiry_date: "2024-01-15",
    };
    const result_6 = classifyInquiry(product_inquiry_3);
    expect(result_6.category).toBe("product_service_spec");
    expect(result_6.priority).toBe(2);

    // 技術サポート関連 (technical_support) - サンプル7-9
    const tech_inquiry_1 = {
      inquiry_id: "INQ-007",
      customer_id: "CUST-C001",
      inquiry_content: "APIの月次集計エンドポイントがタイムアウトになります。対応いただけますか。",
      inquiry_date: "2024-01-15",
    };
    const result_7 = classifyInquiry(tech_inquiry_1);
    expect(result_7.category).toBe("technical_support");
    expect(result_7.priority).toBe(1);
    expect(result_7.confidence).toBeGreaterThanOrEqual(0.95);

    const tech_inquiry_2 = {
      inquiry_id: "INQ-008",
      customer_id: "CUST-C002",
      inquiry_content: "ポータルにログインできません。エラーメッセージが表示されます。",
      inquiry_date: "2024-01-15",
    };
    const result_8 = classifyInquiry(tech_inquiry_2);
    expect(result_8.category).toBe("technical_support");
    expect(result_8.priority).toBe(1);

    const tech_inquiry_3 = {
      inquiry_id: "INQ-009",
      customer_id: "CUST-C003",
      inquiry_content: "データエクスポート機能の使用方法を教えてください。",
      inquiry_date: "2024-01-15",
    };
    const result_9 = classifyInquiry(tech_inquiry_3);
    expect(result_9.category).toBe("technical_support");
    expect(result_9.priority).toBe(2);

    // 契約・変更関連 (contract_change) - サンプル10-12
    const contract_inquiry_1 = {
      inquiry_id: "INQ-010",
      customer_id: "CUST-D001",
      inquiry_content: "契約期間終了後の自動更新について、更新を希望しない場合の手続きを教えてください。",
      inquiry_date: "2024-01-15",
    };
    const result_10 = classifyInquiry(contract_inquiry_1);
    expect(result_10.category).toBe("contract_change");
    expect(result_10.priority).toBe(1);
    expect(result_10.confidence).toBeGreaterThanOrEqual(0.95);

    const contract_inquiry_2 = {
      inquiry_id: "INQ-011",
      customer_id: "CUST-D002",
      inquiry_content: "現在の契約内容から上位プランへのアップグレードを検討しています。可能ですか。",
      inquiry_date: "2024-01-15",
    };
    const result_11 = classifyInquiry(contract_inquiry_2);
    expect(result_11.category).toBe("contract_change");
    expect(result_11.priority).toBe(2);

    const contract_inquiry_3 = {
      inquiry_id: "INQ-012",
      customer_id: "CUST-D003",
      inquiry_content: "成果物納期の変更が通知されましたが、新しい納期に対応できません。相談可能ですか。",
      inquiry_date: "2024-01-15",
    };
    const result_12 = classifyInquiry(contract_inquiry_3);
    expect(result_12.category).toBe("contract_change");
    expect(result_12.priority).toBe(1);

    // その他 (other) - サンプル13-15
    const other_inquiry_1 = {
      inquiry_id: "INQ-013",
      customer_id: "CUST-E001",
      inquiry_content: "営業代行企業の採用情報はありますか？",
      inquiry_date: "2024-01-15",
    };
    const result_13 = classifyInquiry(other_inquiry_1);
    expect(result_13.category).toBe("other");
    expect(result_13.priority).toBe(3);
    expect(result_13.confidence).toBeGreaterThanOrEqual(0.90);

    const other_inquiry_2 = {
      inquiry_id: "INQ-014",
      customer_id: "CUST-E002",
      inquiry_content: "システムについて一般的なご質問があります。",
      inquiry_date: "2024-01-15",
    };
    const result_14 = classifyInquiry(other_inquiry_2);
    expect(result_14.category).toBe("other");
    expect(result_14.priority).toBe(3);

    // 境界値テスト: 複数カテゴリに該当する可能性のある問い合わせ
    const boundary_inquiry_1 = {
      inquiry_id: "INQ-015",
      customer_id: "CUST-F001",
      inquiry_content: "プランアップグレード時に新たな請求額や納期はどうなりますか。",
      inquiry_date: "2024-01-15",
    };
    const result_15 = classifyInquiry(boundary_inquiry_1);
    // 契約・変更が最優先だが、請求・支払いも関連
    expect(["contract_change", "billing_payment"]).toContain(result_15.category);
    expect(result_15.priority).toBeLessThanOrEqual(2);

    // 曖昧な表現: 複数解釈が可能な問い合わせ
    const boundary_inquiry_2 = {
      inquiry_id: "INQ-016",
      customer_id: "CUST-F002",
      inquiry_content: "先月のデータに異常があるようです。対応をお願いします。",
      inquiry_date: "2024-01-15",
    };
    const result_16 = classifyInquiry(boundary_inquiry_2);
    // 技術サポート、製品仕様、その他いずれかになる可能性
    expect(["technical_support", "product_service_spec", "other"]).toContain(result_16.category);
    expect(result_16.confidence).toBeGreaterThanOrEqual(0.85);

    // 不完全な問い合わせ
    const boundary_inquiry_3 = {
      inquiry_id: "INQ-017",
      customer_id: "CUST-F003",
      inquiry_content: "すみません、確認したいことがあります。",
      inquiry_date: "2024-01-15",
    };
    const result_17 = classifyInquiry(boundary_inquiry_3);
    // 不完全な質問は "other" に分類されるべき
    expect(result_17.category).toBe("other");
    expect(result_17.confidence).toBeLessThanOrEqual(0.80);

    // 分類精度の総合評価: 明確なカテゴリに該当する全15件中、14件以上が正確に分類されること (93.3% 以上で95%目標)
    const all_results = [
      result_1, result_2, result_3, result_4, result_5, result_6,
      result_7, result_8, result_9, result_10, result_11, result_12,
      result_13, result_14, result_15
    ];
    const clear_category_results = [
      result_1, result_2, result_3, result_4, result_5, result_6,
      result_7, result_8, result_9, result_10, result_11, result_12,
      result_13, result_14
    ];
    const correctly_classified = clear_category_results.filter(
      (r) => r.confidence >= 0.95
    ).length;
    const accuracy = (correctly_classified / clear_category_results.length) * 100;
    expect(accuracy).toBeGreaterThanOrEqual(93.3);

    // 優先度が正しく設定されていることを確認: 高優先度(1) > 中優先度(2) > 低優先度(3)
    expect(result_1.priority).toBe(1); // 請求額の高騰は高優先
    expect(result_3.priority).toBe(2); // 支払期限延長は中優先
    expect(result_13.priority).toBe(3); // 採用情報は低優先
  });
});