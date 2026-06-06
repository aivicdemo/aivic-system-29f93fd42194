import { validateHandoverRequiredItems } from '../../src/logic/it-1-br-1-2-1';

describe("作業完了実績の登録と次工程引き継ぎ情報の記録機能", () => {
  test("次工程引き継ぎ機能 - 実績データ承認済み状態で次工程引き継ぎ完了時、必要な引き継ぎ情報がすべて記録され次工程が作業開始可能状態になる", () => {
    // SCEN-401
    const completedQuantity = 100;
    const qualityStatus = "合格";
    const handoverNotes = "品質検査で軽微な調整箇所があります。次工程で確認をお願いします。";
    const usedMaterials = [
      { materialId: "MAT001", quantity: 50 },
      { materialId: "MAT002", quantity: 30 }
    ];
    const nextProcessId = "PROC002";

    const result = validateHandoverRequiredItems(
      completedQuantity,
      qualityStatus,
      handoverNotes,
      usedMaterials,
      nextProcessId
    );

    // 成功パターン: すべての必須項目が揃っている場合
    expect(result.isValid).toBe(true);
    expect(result.missingItems).toEqual([]);
    expect(result.handoverData.completedQuantity).toBe(100);
    expect(result.handoverData.qualityStatus).toBe("合格");
    expect(result.handoverData.handoverNotes).toBe("品質検査で軽微な調整箇所があります。次工程で確認をお願いします。");
    expect(result.handoverData.usedMaterials).toEqual([
      { materialId: "MAT001", quantity: 50 },
      { materialId: "MAT002", quantity: 30 }
    ]);
    expect(result.handoverData.nextProcessId).toBe("PROC002");

    // エラーパターン: 完了数量が不正
    expect(() => validateHandoverRequiredItems(
      0,
      qualityStatus,
      handoverNotes,
      usedMaterials,
      nextProcessId
    )).toThrow(/完了数量/);

    // エラーパターン: 品質状況が不正
    expect(() => validateHandoverRequiredItems(
      completedQuantity,
      "判定不明",
      handoverNotes,
      usedMaterials,
      nextProcessId
    )).toThrow(/品質状況/);

    // エラーパターン: 引き継ぎ事項が短すぎる
    expect(() => validateHandoverRequiredItems(
      completedQuantity,
      qualityStatus,
      "短い",
      usedMaterials,
      nextProcessId
    )).toThrow(/引き継ぎ事項/);

    // エラーパターン: 使用資材情報が空
    expect(() => validateHandoverRequiredItems(
      completedQuantity,
      qualityStatus,
      handoverNotes,
      [],
      nextProcessId
    )).toThrow(/使用資材/);
  });
});