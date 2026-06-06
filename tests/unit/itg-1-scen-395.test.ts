import { validateProductionResults } from "../../src/logic/it-1-br-1-2-1";

describe("作業完了実績の登録と次工程引き継ぎ情報の記録機能", () => {
  test("SCEN-395: 実績データが基準を満たさない場合、差し戻しまたは要注意フラグ付き引き継ぎが正常に実行される", () => {
    // 差し戻し対象データ（数量不足）
    const rejectedData = validateProductionResults(
      80, // 基準を下回る実績数量
      100, // 計画数量
      [
        { checkItem: "寸法", actualValue: 100.5, standardValue: 100, result: "pass" },
        { checkItem: "強度", actualValue: 50, standardValue: 48, result: "pass" }
      ], // 品質は基準内
      new Date("2024-01-15T16:00:00Z"), // 作業完了時刻
      new Date("2024-01-15T14:00:00Z")  // 計画完了時刻（2時間遅延）
    );

    // 差し戻し判定の確認
    expect(rejectedData.approvalStatus).toBe("rejected");
    expect(rejectedData.nextProcessFlag).toBe(false);
    expect(rejectedData.alertLevel).toBe("warning");
    expect(rejectedData.comments).toBe("基準未達のため差し戻し");

    // 要注意フラグ付き引き継ぎ対象データ（品質軽微問題）
    const conditionalData = validateProductionResults(
      98, // 計画数量の98%（許容範囲内）
      100, // 計画数量
      [
        { checkItem: "寸法", actualValue: 100.8, standardValue: 100, result: "fail" }, // 軽微な品質問題
        { checkItem: "強度", actualValue: 49, standardValue: 48, result: "pass" }
      ],
      new Date("2024-01-15T15:30:00Z"), // 作業完了時刻
      new Date("2024-01-15T14:00:00Z")  // 計画完了時刻（1.5時間遅延）
    );

    // 条件付き承認判定の確認
    expect(conditionalData.approvalStatus).toBe("conditional");
    expect(conditionalData.nextProcessFlag).toBe(true);
    expect(conditionalData.alertLevel).toBe("caution");
    expect(conditionalData.comments).toBe("軽微な品質問題あり、要注意で次工程へ");

    // 正常承認データ（基準満足）
    const approvedData = validateProductionResults(
      102, // 計画数量の102%（許容範囲内）
      100, // 計画数量
      [
        { checkItem: "寸法", actualValue: 100.2, standardValue: 100, result: "pass" },
        { checkItem: "強度", actualValue: 49, standardValue: 48, result: "pass" }
      ],
      new Date("2024-01-15T15:00:00Z"), // 作業完了時刻
      new Date("2024-01-15T14:00:00Z")  // 計画完了時刻（1時間遅延）
    );

    // 承認判定の確認
    expect(approvedData.approvalStatus).toBe("approved");
    expect(approvedData.nextProcessFlag).toBe(true);
    expect(approvedData.alertLevel).toBe("none");
    expect(approvedData.comments).toBe("承認");
  });
});