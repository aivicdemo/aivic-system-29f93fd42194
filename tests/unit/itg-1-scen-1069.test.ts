import { describe, test, expect } from "@jest/globals";
import {
  validateSalesDataCompleteness,
} from "../../src/logic/it-1781935279444-2-2-1";

describe("営業データの完全性・正確性を自動検証し、不足データ・誤りを検出・通知する機能", () => {
  // SCEN-1069: [edge] 営業データ品質検証機能 - null または空文字列の営業データが欠落として正確に検出される
  test("null値および空文字列を含むすべての営業データが欠落データとして正確に検出され、適切なエラーメッセージが返されること", () => {
    // テストデータ: null値を持つ営業データレコード
    const salesDataWithNull = {
      customer_name: "顧客A",
      contact_date: "2024-01-15",
      sales_content: null, // 欠落: null値
      appointment_status: "confirmed",
      service_type: "service_01",
      amount: 50000,
    };

    // テストデータ: 空文字列を持つ営業データレコード
    const salesDataWithEmptyString = {
      customer_name: "顧客B",
      contact_date: "2024-01-16",
      sales_content: "", // 欠落: 空文字列
      appointment_status: "confirmed",
      service_type: "service_02",
      amount: 75000,
    };

    // テストデータ: 正常なデータ（全項目入力済み）
    const validSalesData = {
      customer_name: "顧客C",
      contact_date: "2024-01-17",
      sales_content: "サービス提案実施",
      appointment_status: "confirmed",
      service_type: "service_01",
      amount: 100000,
    };

    // null値を含むデータに対して検証関数を実行
    const resultWithNull = validateSalesDataCompleteness(salesDataWithNull);
    expect(resultWithNull.is_valid).toBe(false);
    expect(resultWithNull.missing_fields).toContain("sales_content");
    expect(resultWithNull.error_messages).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/sales_content/),
      ])
    );
    expect(resultWithNull.missing_count).toBe(1);

    // 空文字列を含むデータに対して検証関数を実行
    const resultWithEmptyString = validateSalesDataCompleteness(
      salesDataWithEmptyString
    );
    expect(resultWithEmptyString.is_valid).toBe(false);
    expect(resultWithEmptyString.missing_fields).toContain("sales_content");
    expect(resultWithEmptyString.error_messages).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/sales_content/),
      ])
    );
    expect(resultWithEmptyString.missing_count).toBe(1);

    // 検出された欠落データのエラーメッセージが正しい形式で返されることを確認
    expect(resultWithNull.error_messages[0]).toMatch(/^sales_content.*欠落/);
    expect(resultWithEmptyString.error_messages[0]).toMatch(/^sales_content.*欠落/);

    // null と空文字列の両方が同じ欠落カテゴリに分類されることを確認
    expect(resultWithNull.missing_fields).toEqual(
      resultWithEmptyString.missing_fields
    );
    expect(resultWithNull.error_category).toBe("MISSING_FIELD");
    expect(resultWithEmptyString.error_category).toBe("MISSING_FIELD");
    expect(resultWithNull.error_category).toEqual(
      resultWithEmptyString.error_category
    );

    // 正常なデータは検証を通過することを確認
    const resultValid = validateSalesDataCompleteness(validSalesData);
    expect(resultValid.is_valid).toBe(true);
    expect(resultValid.missing_fields).toEqual([]);
    expect(resultValid.missing_count).toBe(0);
  });
});