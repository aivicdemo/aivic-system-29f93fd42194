import { describe, test, expect } from "@jest/globals";
import { validateReportChecklist } from "../../src/logic/it-1-br-1781935279444-1-2-1";

describe("月次サマリーテンプレートの定義・管理機能", () => {
  test("SCEN-670: 自動生成レポート品質チェック検証機能 - チェックリスト項目の境界値で検証結果が正確に切り替わる", () => {
    // テストシナリオの前提: チェックリスト項目の検証ルール
    // - 営業データ数: 最小1件、最大100件
    // - 完全性チェック（必須項目）: 欠落数が0件でPASS
    // - データ型妥当性: 異常値0件でPASS
    // - 金額範囲: 0以上1000000以下でPASS

    // ケース1: 営業データ数の最小境界値（下限値）= 1件でテスト
    const result_min_boundary = validateReportChecklist({
      recordCount: 1,
      missingRequiredFields: 0,
      dataTypeErrors: 0,
      amountMin: 0,
      amountMax: 999999,
    });
    expect(result_min_boundary.status).toBe("PASS");
    expect(result_min_boundary.errors).toEqual([]);

    // ケース2: 営業データ数が最小境界値より1つ下（下限値-1）= 0件でテスト
    const result_below_min = validateReportChecklist({
      recordCount: 0,
      missingRequiredFields: 0,
      dataTypeErrors: 0,
      amountMin: 0,
      amountMax: 999999,
    });
    expect(result_below_min.status).toBe("FAIL");
    expect(result_below_min.errors).toContain("営業データ");

    // ケース3: 営業データ数の最大境界値（上限値）= 100件でテスト
    const result_max_boundary = validateReportChecklist({
      recordCount: 100,
      missingRequiredFields: 0,
      dataTypeErrors: 0,
      amountMin: 0,
      amountMax: 999999,
    });
    expect(result_max_boundary.status).toBe("PASS");
    expect(result_max_boundary.errors).toEqual([]);

    // ケース4: 営業データ数が最大境界値より1つ上（上限値+1）= 101件でテスト
    const result_above_max = validateReportChecklist({
      recordCount: 101,
      missingRequiredFields: 0,
      dataTypeErrors: 0,
      amountMin: 0,
      amountMax: 999999,
    });
    expect(result_above_max.status).toBe("FAIL");
    expect(result_above_max.errors).toContain("営業データ");

    // ケース5: 必須項目欠落の最小境界値（下限値）= 0件（欠落なし）でテスト
    const result_required_min = validateReportChecklist({
      recordCount: 50,
      missingRequiredFields: 0,
      dataTypeErrors: 0,
      amountMin: 0,
      amountMax: 999999,
    });
    expect(result_required_min.status).toBe("PASS");
    expect(result_required_min.errors).toEqual([]);

    // ケース6: 必須項目欠落が最小境界値より上（欠落あり）= 1件でテスト
    const result_required_above = validateReportChecklist({
      recordCount: 50,
      missingRequiredFields: 1,
      dataTypeErrors: 0,
      amountMin: 0,
      amountMax: 999999,
    });
    expect(result_required_above.status).toBe("FAIL");
    expect(result_required_above.errors).toContain("必須項目");

    // ケース7: データ型エラーの最小境界値（下限値）= 0件（エラーなし）でテスト
    const result_dtype_min = validateReportChecklist({
      recordCount: 50,
      missingRequiredFields: 0,
      dataTypeErrors: 0,
      amountMin: 0,
      amountMax: 999999,
    });
    expect(result_dtype_min.status).toBe("PASS");
    expect(result_dtype_min.errors).toEqual([]);

    // ケース8: データ型エラーが最小境界値より上 = 1件でテスト
    const result_dtype_above = validateReportChecklist({
      recordCount: 50,
      missingRequiredFields: 0,
      dataTypeErrors: 1,
      amountMin: 0,
      amountMax: 999999,
    });
    expect(result_dtype_above.status).toBe("FAIL");
    expect(result_dtype_above.errors).toContain("データ型");

    // ケース9: 金額範囲の最小境界値（下限値）= 0でテスト
    const result_amount_min = validateReportChecklist({
      recordCount: 50,
      missingRequiredFields: 0,
      dataTypeErrors: 0,
      amountMin: 0,
      amountMax: 999999,
    });
    expect(result_amount_min.status).toBe("PASS");
    expect(result_amount_min.errors).toEqual([]);

    // ケース10: 金額範囲が最小境界値より下 = -1でテスト
    const result_amount_below_min = validateReportChecklist({
      recordCount: 50,
      missingRequiredFields: 0,
      dataTypeErrors: 0,
      amountMin: -1,
      amountMax: 999999,
    });
    expect(result_amount_below_min.status).toBe("FAIL");
    expect(result_amount_below_min.errors).toContain("金額");

    // ケース11: 金額範囲の最大境界値（上限値）= 1000000でテスト
    const result_amount_max = validateReportChecklist({
      recordCount: 50,
      missingRequiredFields: 0,
      dataTypeErrors: 0,
      amountMin: 0,
      amountMax: 1000000,
    });
    expect(result_amount_max.status).toBe("PASS");
    expect(result_amount_max.errors).toEqual([]);

    // ケース12: 金額範囲が最大境界値より上 = 1000001でテスト
    const result_amount_above_max = validateReportChecklist({
      recordCount: 50,
      missingRequiredFields: 0,
      dataTypeErrors: 0,
      amountMin: 0,
      amountMax: 1000001,
    });
    expect(result_amount_above_max.status).toBe("FAIL");
    expect(result_amount_above_max.errors).toContain("金額");

    // 全体の一貫性検証: 境界値の切り替わりが確実に機能すること
    expect([
      result_min_boundary.status,
      result_max_boundary.status,
      result_required_min.status,
      result_dtype_min.status,
      result_amount_min.status,
      result_amount_max.status,
    ]).toEqual(["PASS", "PASS", "PASS", "PASS", "PASS", "PASS"]);

    expect([
      result_below_min.status,
      result_above_max.status,
      result_required_above.status,
      result_dtype_above.status,
      result_amount_below_min.status,
      result_amount_above_max.status,
    ]).toEqual(["FAIL", "FAIL", "FAIL", "FAIL", "FAIL", "FAIL"]);
  });
});