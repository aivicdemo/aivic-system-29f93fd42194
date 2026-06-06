import { validateHandoverRequiredItems } from '../../src/logic/it-1-br-1-2-1';

describe("作業完了実績の登録と次工程引き継ぎ情報の記録機能", () => {
  test("実績データが未承認状態で引き継ぎ操作を実行した場合、引き継ぎ処理がエラーになる", () => {
    // SCEN-402
    
    const completedQuantity = 100;
    const qualityStatus = ""; // 未承認状態
    const handoverNotes = "通常の引き継ぎ事項";
    const usedMaterials = [
      { materialId: "MAT001", quantity: 50 }
    ];
    const nextProcessId = "PROC002";

    expect(() => validateHandoverRequiredItems(
      completedQuantity,
      qualityStatus,
      handoverNotes,
      usedMaterials,
      nextProcessId
    )).toThrow(/品質状況/);
  });
});