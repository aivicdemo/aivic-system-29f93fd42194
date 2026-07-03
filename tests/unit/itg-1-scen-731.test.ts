import { validateSalesActivityData } from "../../src/logic/it-1781935279444-2-1-1";

describe("営業活動データ品質自動検出・通知機能", () => {
  // SCEN-731: [normal] 営業活動データがすべての必須項目を含み、データ型が正確で通知されない
  test("すべての必須項目を含み、データ型が正確な営業活動データは検証成功し、エラー通知が発生しない", () => {
    const salesActivityData = {
      activity_date: "2024-01-15",
      sales_rep_name: "田中太郎",
      customer_name: "株式会社ABC",
      activity_content: "顧客訪問・商品説明",
      activity_result: "アポイント確定",
      activity_amount: 50000,
    };

    const result = validateSalesActivityData(salesActivityData);

    expect(result.is_valid).toBe(true);
    expect(result.validation_status).toBe("success");
    expect(result.error_list).toEqual([]);
    expect(result.admin_error_notification).toBe(false);
    expect(result.user_alert_notification).toBe(false);
    expect(result.error_count).toBe(0);
  });

  test("必須項目の営業活動日が欠落している場合、検証失敗しエラー通知が発生する", () => {
    const salesActivityData = {
      sales_rep_name: "田中太郎",
      customer_name: "株式会社ABC",
      activity_content: "顧客訪問・商品説明",
      activity_result: "アポイント確定",
      activity_amount: 50000,
    };

    expect(() => validateSalesActivityData(salesActivityData)).toThrow(
      /営業活動日/
    );
  });

  test("必須項目の営業担当者が欠落している場合、検証失敗しエラー通知が発生する", () => {
    const salesActivityData = {
      activity_date: "2024-01-15",
      customer_name: "株式会社ABC",
      activity_content: "顧客訪問・商品説明",
      activity_result: "アポイント確定",
      activity_amount: 50000,
    };

    expect(() => validateSalesActivityData(salesActivityData)).toThrow(
      /営業担当者/
    );
  });

  test("必須項目の顧客名が欠落している場合、検証失敗しエラー通知が発生する", () => {
    const salesActivityData = {
      activity_date: "2024-01-15",
      sales_rep_name: "田中太郎",
      activity_content: "顧客訪問・商品説明",
      activity_result: "アポイント確定",
      activity_amount: 50000,
    };

    expect(() => validateSalesActivityData(salesActivityData)).toThrow(
      /顧客名/
    );
  });

  test("必須項目の活動内容が欠落している場合、検証失敗しエラー通知が発生する", () => {
    const salesActivityData = {
      activity_date: "2024-01-15",
      sales_rep_name: "田中太郎",
      customer_name: "株式会社ABC",
      activity_result: "アポイント確定",
      activity_amount: 50000,
    };

    expect(() => validateSalesActivityData(salesActivityData)).toThrow(
      /活動内容/
    );
  });

  test("必須項目の活動結果が欠落している場合、検証失敗しエラー通知が発生する", () => {
    const salesActivityData = {
      activity_date: "2024-01-15",
      sales_rep_name: "田中太郎",
      customer_name: "株式会社ABC",
      activity_content: "顧客訪問・商品説明",
      activity_amount: 50000,
    };

    expect(() => validateSalesActivityData(salesActivityData)).toThrow(
      /活動結果/
    );
  });

  test("営業活動日のデータ型が不正な場合、検証失敗しエラー通知が発生する", () => {
    const salesActivityData = {
      activity_date: "2024/01/15",
      sales_rep_name: "田中太郎",
      customer_name: "株式会社ABC",
      activity_content: "顧客訪問・商品説明",
      activity_result: "アポイント確定",
      activity_amount: 50000,
    };

    expect(() => validateSalesActivityData(salesActivityData)).toThrow(
      /日付形式/
    );
  });

  test("活動金額のデータ型が文字列の場合、検証失敗しエラー通知が発生する", () => {
    const salesActivityData = {
      activity_date: "2024-01-15",
      sales_rep_name: "田中太郎",
      customer_name: "株式会社ABC",
      activity_content: "顧客訪問・商品説明",
      activity_result: "アポイント確定",
      activity_amount: "50000",
    };

    expect(() => validateSalesActivityData(salesActivityData)).toThrow(
      /金額/
    );
  });

  test("営業担当者名が空文字列の場合、検証失敗しエラー通知が発生する", () => {
    const salesActivityData = {
      activity_date: "2024-01-15",
      sales_rep_name: "",
      customer_name: "株式会社ABC",
      activity_content: "顧客訪問・商品説明",
      activity_result: "アポイント確定",
      activity_amount: 50000,
    };

    expect(() => validateSalesActivityData(salesActivityData)).toThrow(
      /営業担当者/
    );
  });

  test("複数の必須項目が欠落している場合、検証失敗し全エラーが通知される", () => {
    const salesActivityData = {
      sales_rep_name: "田中太郎",
      activity_result: "アポイント確定",
    };

    expect(() => validateSalesActivityData(salesActivityData)).toThrow(
      /営業活動日|顧客名|活動内容/
    );
  });

  test("すべての必須項目を含み、すべてのデータ型が正確な場合、検証成功し管理者通知はfalse", () => {
    const salesActivityData = {
      activity_date: "2024-02-28",
      sales_rep_name: "山田花子",
      customer_name: "株式会社XYZ",
      activity_content: "電話営業",
      activity_result: "興味表示",
      activity_amount: 0,
    };

    const result = validateSalesActivityData(salesActivityData);

    expect(result.is_valid).toBe(true);
    expect(result.admin_error_notification).toBe(false);
    expect(result.user_alert_notification).toBe(false);
  });

  test("営業活動日が範囲外の過去日付の場合、検証失敗し警告通知が発生する", () => {
    const salesActivityData = {
      activity_date: "1999-01-01",
      sales_rep_name: "田中太郎",
      customer_name: "株式会社ABC",
      activity_content: "顧客訪問・商品説明",
      activity_result: "アポイント確定",
      activity_amount: 50000,
    };

    expect(() => validateSalesActivityData(salesActivityData)).toThrow(
      /日付範囲/
    );
  });

  test("活動金額が負数の場合、検証失敗し警告通知が発生する", () => {
    const salesActivityData = {
      activity_date: "2024-01-15",
      sales_rep_name: "田中太郎",
      customer_name: "株式会社ABC",
      activity_content: "顧客訪問・商品説明",
      activity_result: "アポイント確定",
      activity_amount: -50000,
    };

    expect(() => validateSalesActivityData(salesActivityData)).toThrow(
      /金額範囲/
    );
  });
});