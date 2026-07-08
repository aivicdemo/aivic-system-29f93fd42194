import { generateMonthlyAnalysisReport } from "../../src/logic/it-1-br-2-2-2-1";

describe("査定員ごとの判定結果と根拠の月次集計・分析ダッシュボード", () => {
  test("SCEN-1057: 月次査定件数がゼロの場合にレポート生成がエラーを返す", () => {
    // Arrange: 査定件数がゼロの月を指定
    const targetYear = 2024;
    const targetMonth = 2;
    const assessmentCount = 0;
    const assessorId = "ASR-001";

    // Act & Assert: エラーが発生することを検証
    expect(() =>
      generateMonthlyAnalysisReport({
        targetYear,
        targetMonth,
        assessmentCount,
        assessorId,
      })
    ).toThrow(/査定件数/);

    // また別のエラーケースとしてメッセージの内容を検証
    let errorThrown = false;
    let errorMessage = "";
    try {
      generateMonthlyAnalysisReport({
        targetYear,
        targetMonth,
        assessmentCount,
        assessorId,
      });
    } catch (error: unknown) {
      errorThrown = true;
      if (error instanceof Error) {
        errorMessage = error.message;
      }
    }

    // Assert: エラーが発生したことと、メッセージに期待される文言が含まれていることを検証
    expect(errorThrown).toBe(true);
    expect(errorMessage).toMatch(/査定件数がありません|データが不足しています/);
  });
});