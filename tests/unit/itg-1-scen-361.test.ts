import { determineDistributionDepartments } from '../../src/logic/it-1';

describe("製品仕様・納期・工程・資材・担当者情報を統合して標準化された生産指示書を自動生成する機能", () => {
  test("工程情報が空の場合にエラーが発生する", () => {
    // SCEN-361
    const productType = "標準品";
    const requiredMaterials = ["材料A", "材料B"];
    const departmentProcessMapping = {
      "工程A": ["部署1", "部署2"],
      "工程B": ["部署3"]
    };

    // null の場合
    expect(() => determineDistributionDepartments(
      productType,
      null,
      requiredMaterials,
      departmentProcessMapping
    )).toThrow(/工程/);

    // undefined の場合
    expect(() => determineDistributionDepartments(
      productType,
      undefined,
      requiredMaterials,
      departmentProcessMapping
    )).toThrow(/工程/);

    // 空配列の場合
    expect(() => determineDistributionDepartments(
      productType,
      [],
      requiredMaterials,
      departmentProcessMapping
    )).toThrow(/工程/);
  });
});