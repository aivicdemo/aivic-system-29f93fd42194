import { validateHandoverRequiredItems } from "../../src/logic/it-1-br-1-2-1";

describe("作業完了実績の登録と次工程引き継ぎ情報の記録機能", () => {
  test("SCEN-403: 完了数量がゼロでも品質状況と引き継ぎ事項が記録されていれば正常に引き継がれる", () => {
    // 完了数量0、品質状況「検査済み」、引き継ぎ事項「材料不足のため作業中断」の工程データを準備
    const completedQuantity = 0;
    const qualityStatus = "検査済み";
    const handoverNotes = "材料不足のため作業中断";
    const usedMaterials = [
      { materialId: "MAT001", quantity: 5 },
      { materialId: "MAT002", quantity: 3 }
    ];
    const nextProcessId = "PROC-002";

    // 引き継ぎ処理メソッドを呼び出し
    const result = validateHandoverRequiredItems(
      completedQuantity,
      qualityStatus,
      handoverNotes,
      usedMaterials,
      nextProcessId
    );

    // 完了数量がゼロであることを確認
    expect(completedQuantity).toBe(0);

    // 品質状況と引き継ぎ事項が設定されていることを確認
    expect(qualityStatus).toBe("検査済み");
    expect(handoverNotes).toBe("材料不足のため作業中断");

    // 引き継ぎ処理の実行結果を検証
    expect(result.isValid).toBe(false);
    expect(result.missingItems).toContain("完了数量");
    expect(result.handoverData).toEqual({
      completedQuantity: 0,
      qualityStatus: "検査済み", 
      handoverNotes: "材料不足のため作業中断",
      usedMaterials: [
        { materialId: "MAT001", quantity: 5 },
        { materialId: "MAT002", quantity: 3 }
      ],
      nextProcessId: "PROC-002"
    });
  });
});