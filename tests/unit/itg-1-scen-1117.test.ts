import { describe, test, expect } from "@jest/globals";
import { transformSalesDataToStandardFormat } from "../../src/logic/it-1-br-1781935279444-1-2-1";

describe("月次サマリーテンプレート定義・管理 - 標準フォーマット変換ルール検証", () => {
  test("SCEN-1117: 営業データが標準レポートフォーマットに正確にマッピングされる", () => {
    // ハッピーパス: 標準的な営業データサンプル
    const salesDataSample1 = {
      customerName: "株式会社ABC商事",
      salesAmount: 150000,
      salesDate: "2024-01-15",
      productCategory: "ソフトウェアライセンス",
      salesRepName: "山田太郎",
    };

    const result1 = transformSalesDataToStandardFormat(salesDataSample1);

    // 期待結果: 標準レポートフォーマットへの正確なマッピング
    expect(result1).toEqual({
      customer_name: "株式会社ABC商事",
      sales_amount_jpy: 150000,
      sales_date_yyyy_mm_dd: "2024-01-15",
      product_category_code: "SWL",
      sales_rep_name: "山田太郎",
      record_type: "SALES_TRANSACTION",
      format_version: "1.0",
    });

    // データ型検証: 金額は数値型
    expect(typeof result1.sales_amount_jpy).toBe("number");
    // 金額は正の整数
    expect(result1.sales_amount_jpy).toBeGreaterThan(0);
    expect(Number.isInteger(result1.sales_amount_jpy)).toBe(true);

    // 日付形式検証: YYYY-MM-DD形式
    expect(/^\d{4}-\d{2}-\d{2}$/.test(result1.sales_date_yyyy_mm_dd)).toBe(true);

    // カテゴリコード検証: 3文字の英数字コード
    expect(/^[A-Z]{3}$/.test(result1.product_category_code)).toBe(true);

    // フォーマットバージョン検証
    expect(result1.format_version).toBe("1.0");

    // 記録タイプ検証
    expect(result1.record_type).toBe("SALES_TRANSACTION");

    // ===============================================
    // パターン2: 異なる値でのテスト（エッジケース）
    const salesDataSample2 = {
      customerName: "個人事業主 田中花子",
      salesAmount: 50000,
      salesDate: "2024-12-31",
      productCategory: "コンサルティングサービス",
      salesRepName: "鈴木次郎",
    };

    const result2 = transformSalesDataToStandardFormat(salesDataSample2);

    expect(result2).toEqual({
      customer_name: "個人事業主 田中花子",
      sales_amount_jpy: 50000,
      sales_date_yyyy_mm_dd: "2024-12-31",
      product_category_code: "CON",
      sales_rep_name: "鈴木次郎",
      record_type: "SALES_TRANSACTION",
      format_version: "1.0",
    });

    // 期末の日付も正確にマッピング
    expect(result2.sales_date_yyyy_mm_dd).toBe("2024-12-31");

    // ===============================================
    // パターン3: 高額取引のテスト
    const salesDataSample3 = {
      customerName: "大規模企業グループ",
      salesAmount: 5000000,
      salesDate: "2024-06-15",
      productCategory: "エンタープライズシステム",
      salesRepName: "佐藤三郎",
    };

    const result3 = transformSalesDataToStandardFormat(salesDataSample3);

    expect(result3).toEqual({
      customer_name: "大規模企業グループ",
      sales_amount_jpy: 5000000,
      sales_date_yyyy_mm_dd: "2024-06-15",
      product_category_code: "ENT",
      sales_rep_name: "佐藤三郎",
      record_type: "SALES_TRANSACTION",
      format_version: "1.0",
    });

    // 大型金額も正確に数値として保持
    expect(result3.sales_amount_jpy).toBe(5000000);

    // ===============================================
    // 複数パターンの共通検証: マッピング対応関係の確認
    const allResults = [result1, result2, result3];

    allResults.forEach((result) => {
      // すべての必須フィールドが存在
      expect(result).toHaveProperty("customer_name");
      expect(result).toHaveProperty("sales_amount_jpy");
      expect(result).toHaveProperty("sales_date_yyyy_mm_dd");
      expect(result).toHaveProperty("product_category_code");
      expect(result).toHaveProperty("sales_rep_name");
      expect(result).toHaveProperty("record_type");
      expect(result).toHaveProperty("format_version");

      // フィールド数が正確に7個
      expect(Object.keys(result).length).toBe(7);

      // すべてのフィールドが非null、非undefined
      Object.values(result).forEach((value) => {
        expect(value).not.toBeNull();
        expect(value).not.toBeUndefined();
      });
    });

    // ===============================================
    // エラーケース検証

    // 必須フィールド欠落: customerName がない
    expect(() =>
      transformSalesDataToStandardFormat({
        salesAmount: 100000,
        salesDate: "2024-01-15",
        productCategory: "ソフトウェア",
        salesRepName: "太郎",
      } as any)
    ).toThrow(/顧客名/);

    // 金額が負の値
    expect(() =>
      transformSalesDataToStandardFormat({
        customerName: "テスト顧客",
        salesAmount: -50000,
        salesDate: "2024-01-15",
        productCategory: "サービス",
        salesRepName: "太郎",
      })
    ).toThrow(/金額/);

    // 日付形式が不正
    expect(() =>
      transformSalesDataToStandardFormat({
        customerName: "テスト顧客",
        salesAmount: 100000,
        salesDate: "2024/01/15",
        productCategory: "サービス",
        salesRepName: "太郎",
      })
    ).toThrow(/日付/);

    // カテゴリが不正（マッピング対象外）
    expect(() =>
      transformSalesDataToStandardFormat({
        customerName: "テスト顧客",
        salesAmount: 100000,
        salesDate: "2024-01-15",
        productCategory: "不明なカテゴリ",
        salesRepName: "太郎",
      })
    ).toThrow(/カテゴリ/);

    // 営業担当者名が空
    expect(() =>
      transformSalesDataToStandardFormat({
        customerName: "テスト顧客",
        salesAmount: 100000,
        salesDate: "2024-01-15",
        productCategory: "ソフトウェア",
        salesRepName: "",
      })
    ).toThrow(/営業担当者/);
  });
});