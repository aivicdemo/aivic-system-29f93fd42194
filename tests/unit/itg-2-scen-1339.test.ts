import { validateEstimateFormatCompleteness } from "../../src/logic/it-6-2-2-2";

describe("査定員別の判定精度・乖離パターン分析ダッシュボード", () => {
  // SCEN-1339
  test("見積フォーマット完全性チェック - 必須項目不足時にエラー詳細を表示", () => {
    // 前提: 見積フォーマット仕様で必須項目が定義されている
    // 品名、数量、単価が必須項目として定義
    const requiredFields = ["品名", "数量", "単価"];

    // トリガー: 必須項目が不足した見積フォーマットをアップロード
    const incompleteEstimate = {
      行番号: 1,
      品名: "", // 空白 - 必須項目不足
      数量: 10,
      単価: 5000,
      合計: 50000,
    };

    // 実行
    const result = validateEstimateFormatCompleteness(
      incompleteEstimate,
      requiredFields
    );

    // 期待結果: 完全性チェック失敗、エラー詳細が構造化された形で返される
    expect(result.isValid).toBe(false);
    expect(result.errorStatus).toBe("INCOMPLETE_FORMAT");
    expect(result.missingFields).toEqual(["品名"]);
    expect(result.missingFieldDescriptions).toContain("品名が不足しています");
    expect(result.failedLineNumber).toBe(1);
    expect(result.requiredFieldsList).toEqual(["品名", "数量", "単価"]);
    expect(result.errorMessage).toMatch(/品名/);
  });

  test("見積フォーマット完全性チェック - 複数の必須項目が不足している場合", () => {
    const requiredFields = ["品名", "数量", "単価", "工種"];

    const incompleteEstimate = {
      行番号: 2,
      品名: "",
      数量: 0,
      単価: 0,
      工種: "鉄筋工",
    };

    const result = validateEstimateFormatCompleteness(
      incompleteEstimate,
      requiredFields
    );

    expect(result.isValid).toBe(false);
    expect(result.errorStatus).toBe("INCOMPLETE_FORMAT");
    expect(result.missingFields.length).toBe(3);
    expect(result.missingFields).toContain("品名");
    expect(result.missingFields).toContain("数量");
    expect(result.missingFields).toContain("単価");
    expect(result.failedLineNumber).toBe(2);
  });

  test("見積フォーマット完全性チェック - 必須項目がすべて揃っている場合は成功", () => {
    const requiredFields = ["品名", "数量", "単価"];

    const completeEstimate = {
      行番号: 1,
      品名: "鋼板",
      数量: 10,
      単価: 5000,
      合計: 50000,
    };

    const result = validateEstimateFormatCompleteness(
      completeEstimate,
      requiredFields
    );

    expect(result.isValid).toBe(true);
    expect(result.errorStatus).toBeNull();
    expect(result.missingFields).toEqual([]);
    expect(result.failedLineNumber).toBeNull();
  });

  test("見積フォーマット完全性チェック - 数値0は有効値として判定", () => {
    const requiredFields = ["品名", "数量", "単価"];

    const estimateWithZero = {
      行番号: 1,
      品名: "材料費",
      数量: 0,
      単価: 0,
    };

    const result = validateEstimateFormatCompleteness(
      estimateWithZero,
      requiredFields
    );

    expect(result.isValid).toBe(true);
    expect(result.missingFields).toEqual([]);
  });

  test("見積フォーマット完全性チェック - null値は不足として判定", () => {
    const requiredFields = ["品名", "数量", "単価"];

    const estimateWithNull = {
      行番号: 1,
      品名: "材料",
      数量: null,
      単価: 5000,
    };

    const result = validateEstimateFormatCompleteness(
      estimateWithNull,
      requiredFields
    );

    expect(result.isValid).toBe(false);
    expect(result.missingFields).toContain("数量");
    expect(result.errorStatus).toBe("INCOMPLETE_FORMAT");
  });

  test("見積フォーマット完全性チェック - undefined値は不足として判定", () => {
    const requiredFields = ["品名", "数量", "単価"];

    const estimateWithUndefined = {
      行番号: 1,
      品名: "材料",
      数量: undefined,
      単価: 5000,
    };

    const result = validateEstimateFormatCompleteness(
      estimateWithUndefined,
      requiredFields
    );

    expect(result.isValid).toBe(false);
    expect(result.missingFields).toContain("数量");
  });

  test("見積フォーマット完全性チェック - 空白文字列は不足として判定", () => {
    const requiredFields = ["品名", "数量", "単価"];

    const estimateWithBlank = {
      行番号: 1,
      品名: "   ",
      数量: 10,
      単価: 5000,
    };

    const result = validateEstimateFormatCompleteness(
      estimateWithBlank,
      requiredFields
    );

    expect(result.isValid).toBe(false);
    expect(result.missingFields).toContain("品名");
  });

  test("見積フォーマット完全性チェック - OCR読取失敗時に同様のエラー詳細を返す", () => {
    const requiredFields = ["品名", "数量", "単価"];

    const ocrFailedResult = {
      行番号: 3,
      品名: "",
      数量: "",
      単価: "",
      ocrFailureReason: "テキスト抽出失敗",
    };

    const result = validateEstimateFormatCompleteness(
      ocrFailedResult,
      requiredFields
    );

    expect(result.isValid).toBe(false);
    expect(result.errorStatus).toBe("INCOMPLETE_FORMAT");
    expect(result.missingFields).toContain("品名");
    expect(result.missingFields).toContain("数量");
    expect(result.missingFields).toContain("単価");
    expect(result.failedLineNumber).toBe(3);
  });

  test("見積フォーマット完全性チェック - 必須項目一覧の完全性検証", () => {
    const requiredFields = ["品名", "数量", "単価", "工種", "地域"];

    const partialEstimate = {
      行番号: 1,
      品名: "鋼板",
      数量: 10,
      単価: 5000,
      工種: "",
      地域: "",
    };

    const result = validateEstimateFormatCompleteness(
      partialEstimate,
      requiredFields
    );

    expect(result.isValid).toBe(false);
    expect(result.requiredFieldsList).toEqual([
      "品名",
      "数量",
      "単価",
      "工種",
      "地域",
    ]);
    expect(result.missingFields).toContain("工種");
    expect(result.missingFields).toContain("地域");
    expect(result.missingFieldDescriptions.length).toBeGreaterThanOrEqual(2);
  });
});