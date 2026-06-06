import { validateProductionOrderRequiredFields } from "../../src/logic/it-1";

describe("製品仕様・納期・工程・資材・担当者情報を統合して標準化された生産指示書を自動生成する機能", () => {
  test("必須項目が不足している場合に具体的な不足項目を通知して停止する", () => {
    // SCEN-345
    
    const emptyProductSpecification = "";
    const futureDateValid = new Date();
    futureDateValid.setDate(futureDateValid.getDate() + 30);
    
    const emptyDeliveryDate = new Date("1999-01-01");
    const emptyProcessSteps: string[] = [];
    const emptyRequiredMaterials: string[] = [];
    const emptyAssignedWorker = "";
    
    const result = validateProductionOrderRequiredFields(
      emptyProductSpecification,
      emptyDeliveryDate,
      emptyProcessSteps,
      emptyRequiredMaterials,
      emptyAssignedWorker
    );
    
    expect(result.isValid).toBe(false);
    expect(result.missingFields).toEqual([
      "製品仕様",
      "納期",
      "工程手順",
      "必要資材",
      "担当作業員"
    ]);
    expect(result.validationMessage).toBe("次の項目が不足しています: 製品仕様, 納期, 工程手順, 必要資材, 担当作業員");
  });
});