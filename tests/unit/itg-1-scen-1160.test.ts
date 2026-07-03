import { classifyInquiry } from "../../src/logic/it-1-1-1";

describe("営業成果データの自動検証ルール定義と異常検出機能", () => {
  test("SCEN-1160: 複数カテゴリに該当する問い合わせを優先度ルールに基づいて主要カテゴリに分類", () => {
    // テストデータ1: 請求内容 + 技術サポートの両方に該当する問い合わせ
    const inquiryMultipleCategories = {
      inquiryId: "INQ-20240115-001",
      content:
        "先月の請求書に記載されたサービス料金が正しく計算されていない。また、API接続に関するエラーが発生している。",
      submittedAt: "2024-01-15T09:30:00Z",
      customerId: "CUST-12345",
    };

    const resultMultiple = classifyInquiry(inquiryMultipleCategories);

    // 複数カテゴリに該当する問い合わせが優先度ルールに基づいて主要カテゴリに分類されることを確認
    // 期待: 請求関連(優先度1)が優先されて主要カテゴリとなる
    expect(resultMultiple.primaryCategory).toBe("billing");
    expect(resultMultiple.secondaryCategories).toContain("technical_support");
    expect(resultMultiple.priorityScore).toBe(95); // 請求(80) + 技術(15) = 95
    expect(resultMultiple.classificationLogId).toBeDefined();
    expect(resultMultiple.classificationLogId).toMatch(/^LOG-/);

    // テストデータ2: 同一の問い合わせを複数回入力
    const resultFirst = classifyInquiry(inquiryMultipleCategories);
    const resultSecond = classifyInquiry(inquiryMultipleCategories);

    // 同一の問い合わせに対しては常に一貫した分類結果が得られることを確認
    expect(resultFirst.primaryCategory).toBe(resultSecond.primaryCategory);
    expect(resultFirst.priorityScore).toBe(resultSecond.priorityScore);
    expect(resultFirst.secondaryCategories).toEqual(
      resultSecond.secondaryCategories
    );

    // テストデータ3: 技術サポート + 契約変更の問い合わせ
    const inquiryTechContract = {
      inquiryId: "INQ-20240115-002",
      content:
        "契約内容を変更したいが、システムの技術仕様が不明。また、変更後の料金計算方法を確認したい。",
      submittedAt: "2024-01-15T10:15:00Z",
      customerId: "CUST-67890",
    };

    const resultTechContract = classifyInquiry(inquiryTechContract);

    // 契約関連(優先度2)が優先されて主要カテゴリとなることを確認
    expect(resultTechContract.primaryCategory).toBe("contract");
    expect(resultTechContract.secondaryCategories).toContain("technical_support");
    expect(resultTechContract.priorityScore).toBe(85); // 契約(70) + 技術(15) = 85
    expect(resultTechContract.classificationLogId).toBeDefined();

    // テストデータ4: 単一カテゴリのみの問い合わせ（請求）
    const inquirySingleCategory = {
      inquiryId: "INQ-20240115-003",
      content:
        "先月の請求額について質問があります。内訳の詳細を教えてください。",
      submittedAt: "2024-01-15T11:00:00Z",
      customerId: "CUST-11111",
    };

    const resultSingle = classifyInquiry(inquirySingleCategory);

    // 単一カテゴリの場合は該当カテゴリが主要カテゴリとなることを確認
    expect(resultSingle.primaryCategory).toBe("billing");
    expect(resultSingle.secondaryCategories).toHaveLength(0);
    expect(resultSingle.priorityScore).toBe(80); // 請求のみ

    // テストデータ5: レポート + 成果指標の問い合わせ
    const inquiryReportMetrics = {
      inquiryId: "INQ-20240115-004",
      content:
        "月次レポートの成果指標の計算方法が変わったのか？先月比でデータが異なる。",
      submittedAt: "2024-01-15T11:45:00Z",
      customerId: "CUST-22222",
    };

    const resultReportMetrics = classifyInquiry(inquiryReportMetrics);

    // レポート関連(優先度3)が優先されて主要カテゴリとなることを確認
    expect(resultReportMetrics.primaryCategory).toBe("reporting");
    expect(resultReportMetrics.secondaryCategories).toContain("metrics");
    expect(resultReportMetrics.priorityScore).toBe(65); // レポート(50) + 成果指標(15) = 65

    // 分類結果がシステム内に正常に記録されていることを確認
    expect(resultReportMetrics.classificationLogId).toBeDefined();
    expect(resultReportMetrics.classificationLogId).toMatch(/^LOG-\d+$/);
    expect(resultReportMetrics.classifiedAt).toBeDefined();

    // テストデータ6: その他カテゴリのみ
    const inquiryOther = {
      inquiryId: "INQ-20240115-005",
      content: "営業担当者の連絡先を教えてください。",
      submittedAt: "2024-01-15T12:30:00Z",
      customerId: "CUST-33333",
    };

    const resultOther = classifyInquiry(inquiryOther);

    // その他カテゴリとして分類されることを確認
    expect(resultOther.primaryCategory).toBe("other");
    expect(resultOther.priorityScore).toBe(10); // その他の最低優先度

    // テストデータ7: 緊急性を含む複数カテゴリの問い合わせ
    const inquiryUrgentMulti = {
      inquiryId: "INQ-20240115-006",
      content:
        "至急対応が必要です。請求書の金額が大幅に異なり、支払いできません。また、システムエラーで営業データが失われている可能性があります。",
      submittedAt: "2024-01-15T13:00:00Z",
      customerId: "CUST-44444",
      isUrgent: true,
    };

    const resultUrgent = classifyInquiry(inquiryUrgentMulti);

    // 緊急フラグが付いた場合、優先度スコアが増加することを確認
    expect(resultUrgent.primaryCategory).toBe("billing");
    expect(resultUrgent.priorityScore).toBeGreaterThan(95); // 緊急時は通常より高い
    expect(resultUrgent.isUrgent).toBe(true);

    // テストデータ8: 分類一貫性の再検証（別のインスタンスで同じ結果）
    const inquiryConsistency1 = {
      inquiryId: "INQ-20240115-007",
      content:
        "請求データと営業実績が一致していない。請求ルールと契約内容を確認してほしい。",
      submittedAt: "2024-01-15T14:00:00Z",
      customerId: "CUST-55555",
    };

    const resultConsistency1First = classifyInquiry(inquiryConsistency1);
    const resultConsistency1Second = classifyInquiry(inquiryConsistency1);
    const resultConsistency1Third = classifyInquiry(inquiryConsistency1);

    // 3回の呼び出しで常に同じ分類結果が得られることを確認
    expect(resultConsistency1First.primaryCategory).toBe(
      resultConsistency1Second.primaryCategory
    );
    expect(resultConsistency1Second.primaryCategory).toBe(
      resultConsistency1Third.primaryCategory
    );
    expect(resultConsistency1First.priorityScore).toBe(
      resultConsistency1Second.priorityScore
    );
    expect(resultConsistency1Second.priorityScore).toBe(
      resultConsistency1Third.priorityScore
    );

    // 分類ログIDが異なることを確認（毎回新しいログが生成される）
    expect(resultConsistency1First.classificationLogId).not.toBe(
      resultConsistency1Second.classificationLogId
    );
    expect(resultConsistency1Second.classificationLogId).not.toBe(
      resultConsistency1Third.classificationLogId
    );
  });
});