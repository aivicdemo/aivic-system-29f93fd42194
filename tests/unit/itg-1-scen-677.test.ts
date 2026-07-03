import { describe, test, expect } from "@jest/globals";
import {
  validateSalesDataItemMetadata,
  generateReportWithMetadata,
} from "../../src/logic/it-1781935279444-1-1-1";

describe("営業データ項目メタデータ管理機能 - 計算ロジック矛盾検出", () => {
  // SCEN-677
  test("計算ロジックが矛盾する場合、レポート生成がエラーで中断される", () => {
    // ===== 前提条件 =====
    // 営業データ項目メタデータ一元管理機能が開かれている状態
    // 矛盾する計算ロジックを含むメタデータを設定する

    const contradictoryMetadata = {
      itemId: "md_calc_001",
      itemName: "売上合計",
      unit: "円",
      dataType: "number",
      calculationLogic: {
        formula: "itemA + itemB = itemC",
        itemA: {
          name: "基本売上",
          value: 100,
        },
        itemB: {
          name: "追加売上",
          value: 200,
        },
        itemC: {
          name: "期待合計",
          value: 250, // 矛盾: 100 + 200 = 300 であるべき
        },
      },
      reportMapping: {
        reportFieldName: "total_sales",
        displayFormat: "currency",
      },
    };

    // ===== 検証処理実行 =====
    // メタデータ保存時に計算ロジック検証を実行
    const validationResult = validateSalesDataItemMetadata(contradictoryMetadata);

    // ===== 検証結果の確認 =====
    // 矛盾が検出されることを確認
    expect(validationResult.isValid).toBe(false);
    expect(validationResult.errors).toBeDefined();
    expect(validationResult.errors.length).toBeGreaterThan(0);

    // エラーメッセージが矛盾の内容を明記していることを確認
    const calculationErrorMessage = validationResult.errors.find((err) =>
      /計算ロジック/.test(err.message)
    );
    expect(calculationErrorMessage).toBeDefined();
    expect(calculationErrorMessage?.message).toMatch(/矛盾/);
    expect(calculationErrorMessage?.message).toMatch(/100/);
    expect(calculationErrorMessage?.message).toMatch(/200/);
    expect(calculationErrorMessage?.message).toMatch(/250/);

    // ===== レポート生成実行 =====
    // レポート生成機能を実行
    const reportGenerationFn = () => {
      return generateReportWithMetadata({
        metadata: contradictoryMetadata,
        reportType: "monthly_summary",
        targetDate: "2024-01-31",
      });
    };

    // ===== レポート生成がエラーで中断されることを確認 =====
    expect(reportGenerationFn).toThrow(/計算ロジック/);

    // ===== エラーメッセージの詳細確認 =====
    try {
      reportGenerationFn();
      fail("エラーが発生すべき");
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      const errorMessage = (error as Error).message;
      // 矛盾の内容が明記されていることを確認
      expect(errorMessage).toMatch(/計算ロジックが矛盾しています/);
      // 実際の計算結果と期待値が表記されていることを確認
      expect(errorMessage).toMatch(/300/); // 100 + 200 の正しい合計
      expect(errorMessage).toMatch(/250/); // 設定された矛盾した値
    }
  });
});