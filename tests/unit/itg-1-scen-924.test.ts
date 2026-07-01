import { describe, test, expect } from "@jest/globals";
import { recordStructuredExceptionFromQualityCheck } from "../../src/logic/it-1781935279444-2-1-1";

describe("営業データ入力時の品質検証ルール定義・実行機能", () => {
  test("SCEN-924: 例外ケース・判断基準の構造化記録機能 - 営業データ品質チェック中の予期しない例外について、例外内容・採用判断基準・理由が構造化フォーマットで記録される", () => {
    // Arrange: テスト用の例外データを準備
    const exceptionOccurredAt = new Date("2024-01-15T09:30:00Z");
    const exceptionInput = {
      exceptionType: "InvalidDataFormat",
      errorMessage: "営業データ項目『顧客名』のデータ型が不正です。文字列型が期待されていますが、数値型が入力されました。",
      stackTrace: "at validateCustomerName (quality-check.ts:145)\nat performQualityCheck (quality-check.ts:89)",
      appliedRuleName: "必須項目_データ型検証",
      decisionLogic: "営業データ品質基準に基づき、顧客名フィールドは必ず文字列型である必要がある",
      decisionReasoning: "営業データの入力形式が統一されないと、後続の請求額計算やレポート生成で計算誤りが発生するため、入力段階で型チェックを厳格に実施する",
      affectedScope: "当月営業データ集計対象期間内の該当顧客のアポ数・成約数集計に影響",
      recoveryMeasure: "営業担当者に修正指示を送信し、顧客名を正しい文字列形式で再入力させる",
    };

    // Act: 構造化例外記録関数を呼び出す
    const recordedException = recordStructuredExceptionFromQualityCheck(
      exceptionInput,
      exceptionOccurredAt
    );

    // Assert: 記録された例外情報が構造化フォーマットで正確に保存されていることを検証
    expect(recordedException).toEqual({
      exceptionId: expect.stringMatching(/^EXC-\d{10}$/),
      exceptionOccurredAt: "2024-01-15T09:30:00Z",
      exceptionType: "InvalidDataFormat",
      errorMessage: "営業データ項目『顧客名』のデータ型が不正です。文字列型が期待されていますが、数値型が入力されました。",
      stackTrace: "at validateCustomerName (quality-check.ts:145)\nat performQualityCheck (quality-check.ts:89)",
      appliedRuleName: "必須項目_データ型検証",
      decisionLogic: "営業データ品質基準に基づき、顧客名フィールドは必ず文字列型である必要がある",
      decisionReasoning: "営業データの入力形式が統一されないと、後続の請求額計算やレポート生成で計算誤りが発生するため、入力段階で型チェックを厳格に実施する",
      affectedScope: "当月営業データ集計対象期間内の該当顧客のアポ数・成約数集計に影響",
      recoveryMeasure: "営業担当者に修正指示を送信し、顧客名を正しい文字列形式で再入力させる",
      recordedAt: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/),
      status: "recorded",
    });

    // 例外ID形式の確認（EXC- で始まる10桁の数値）
    expect(recordedException.exceptionId).toMatch(/^EXC-\d{10}$/);

    // 記録タイムスタンプが現在時刻付近であることを確認（ISO 8601形式）
    expect(recordedException.recordedAt).toBeTruthy();
    const recordedTime = new Date(recordedException.recordedAt);
    expect(recordedTime.getTime()).toBeGreaterThanOrEqual(
      new Date("2024-01-15T09:29:00Z").getTime()
    );
    expect(recordedTime.getTime()).toBeLessThanOrEqual(
      new Date("2024-01-15T09:31:00Z").getTime()
    );

    // 例外発生日時と例外内容・判断基準・理由が完全に記録されていることを確認
    expect(recordedException.exceptionOccurredAt).toBe(
      "2024-01-15T09:30:00Z"
    );
    expect(recordedException.exceptionType).toBe("InvalidDataFormat");
    expect(recordedException.errorMessage).toContain("データ型が不正");
    expect(recordedException.appliedRuleName).toBe("必須項目_データ型検証");
    expect(recordedException.decisionLogic).toContain("文字列型");
    expect(recordedException.decisionReasoning).toContain(
      "入力段階で型チェック"
    );
    expect(recordedException.affectedScope).toContain("アポ数・成約数集計");
    expect(recordedException.recoveryMeasure).toContain("修正指示を送信");
    expect(recordedException.status).toBe("recorded");
  });
});