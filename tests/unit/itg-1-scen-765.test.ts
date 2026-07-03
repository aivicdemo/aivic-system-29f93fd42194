import { determineValidDocumentVersion } from "../../src/logic/it-1781935279444-2-1-1";

describe("営業データ入力時の品質検証ルール定義・実行機能", () => {
  test("SCEN-765: 顧客別・案件別の有効版自動判定 - 有効期限の開始日時と終了日時の境界値で正確に判定される", () => {
    // テストデータ: 開始日時2024-01-01T00:00:00Z、終了日時2024-12-31T23:59:59Z
    const customerData = {
      customerId: "cust_001",
      contractId: "cont_001",
      documentVersionId: "doc_v1",
      effectiveStartAt: new Date("2024-01-01T00:00:00Z"),
      effectiveEndAt: new Date("2024-12-31T23:59:59Z"),
      status: "active",
    };

    // ケース1: 開始日時ちょうど(2024-01-01T00:00:00Z) → 有効
    const result1 = determineValidDocumentVersion(customerData, new Date("2024-01-01T00:00:00Z"));
    expect(result1.isValid).toBe(true);
    expect(result1.status).toBe("active");

    // ケース2: 開始日時から1秒後(2024-01-01T00:00:01Z) → 有効
    const result2 = determineValidDocumentVersion(customerData, new Date("2024-01-01T00:00:01Z"));
    expect(result2.isValid).toBe(true);
    expect(result2.status).toBe("active");

    // ケース3: 終了日時ちょうど(2024-12-31T23:59:59Z) → 有効
    const result3 = determineValidDocumentVersion(customerData, new Date("2024-12-31T23:59:59Z"));
    expect(result3.isValid).toBe(true);
    expect(result3.status).toBe("active");

    // ケース4: 終了日時の次秒(2025-01-01T00:00:00Z) → 無効
    const result4 = determineValidDocumentVersion(customerData, new Date("2025-01-01T00:00:00Z"));
    expect(result4.isValid).toBe(false);
    expect(result4.status).toBe("expired");

    // ケース5: 開始日時より前(2023-12-31T23:59:59Z) → 無効
    const result5 = determineValidDocumentVersion(customerData, new Date("2023-12-31T23:59:59Z"));
    expect(result5.isValid).toBe(false);
    expect(result5.status).toBe("not_yet_effective");

    // ケース6: 開始日時と終了日時が同一の案件データ
    const singlePointData = {
      customerId: "cust_002",
      contractId: "cont_002",
      documentVersionId: "doc_v2",
      effectiveStartAt: new Date("2024-06-15T12:00:00Z"),
      effectiveEndAt: new Date("2024-06-15T12:00:00Z"),
      status: "active",
    };

    // 開始・終了日時と同じ時刻で判定 → 有効
    const result6 = determineValidDocumentVersion(singlePointData, new Date("2024-06-15T12:00:00Z"));
    expect(result6.isValid).toBe(true);
    expect(result6.status).toBe("active");

    // 開始・終了日時より1秒後で判定 → 無効
    const result7 = determineValidDocumentVersion(singlePointData, new Date("2024-06-15T12:00:01Z"));
    expect(result7.isValid).toBe(false);
    expect(result7.status).toBe("expired");

    // 開始・終了日時より1秒前で判定 → 無効
    const result8 = determineValidDocumentVersion(singlePointData, new Date("2024-06-15T11:59:59Z"));
    expect(result8.isValid).toBe(false);
    expect(result8.status).toBe("not_yet_effective");
  });
});