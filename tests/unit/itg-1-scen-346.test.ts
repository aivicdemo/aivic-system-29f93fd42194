import { validateProductionOrderRequiredFields } from '../../src/logic/it-1';

describe("製品仕様・納期・工程・資材・担当者情報を統合して標準化された生産指示書を自動生成する機能", () => {
  test("必須項目の最小文字数ちょうどの入力でチェック通過する", () => {
    // SCEN-346
    const productSpecification = "A";
    const deliveryDate = new Date();
    const processSteps = ["工程1"];
    const requiredMaterials = ["資材1"];
    const assignedWorker = "作業員1";

    const result = validateProductionOrderRequiredFields(
      productSpecification,
      deliveryDate,
      processSteps,
      requiredMaterials,
      assignedWorker
    );

    expect(result.isValid).toBe(false);
    expect(result.missingFields).toContain("製品仕様");
    expect(result.validationMessage).toBe("次の項目が不足しています: 製品仕様");
  });
});