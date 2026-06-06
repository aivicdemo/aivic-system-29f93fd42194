import { validateProductionOrderRequiredFields } from '../../src/logic/it-1';

describe('製品仕様・納期・工程・資材・担当者情報を統合して標準化された生産指示書を自動生成する機能', () => {
  test('生産指示書必須項目チェック機能 - 全ての必須項目が適切に入力されている場合にチェック通過する', () => {
    // SCEN-344
    const validProductSpecification = "高強度アルミニウム合金製建設資材、幅2000mm×高さ3000mm×厚さ50mm、表面処理：アルマイト加工、耐荷重5000N";
    const validDeliveryDate = new Date('2024-02-15T00:00:00Z');
    const validProcessSteps = ["材料切断", "表面処理", "品質検査", "梱包"];
    const validRequiredMaterials = ["アルミニウム合金板材", "アルマイト処理剤", "梱包資材"];
    const validAssignedWorker = "田中太郎";

    const result = validateProductionOrderRequiredFields(
      validProductSpecification,
      validDeliveryDate,
      validProcessSteps,
      validRequiredMaterials,
      validAssignedWorker
    );

    expect(result.isValid).toBe(true);
    expect(result.missingFields).toEqual([]);
    expect(result.validationMessage).toBe("生産指示書の作成が完了しました");
  });
});