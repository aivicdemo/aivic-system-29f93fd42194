import { determineDistributionDepartments } from '../../src/logic/it-1';

describe("製品仕様・納期・工程・資材・担当者情報を統合して標準化された生産指示書を自動生成する機能", () => {
  test("配信先部署情報が不正な場合にエラーが発生する", () => {
    // SCEN-365
    const productType = "標準製品";
    const requiredProcesses = ["切断", "組立"];
    const requiredMaterials = ["鋼材", "ボルト"];
    
    // 存在しない部署コードを含む部署マッピング
    const invalidDepartmentMapping = {
      "切断": ["INVALID_DEPT"],
      "組立": ["INVALID_DEPT"]
    };

    expect(() => determineDistributionDepartments(
      productType,
      requiredProcesses,
      requiredMaterials,
      invalidDepartmentMapping
    )).toThrow(/部署/);

    // NULL値を含む部署マッピング
    const nullDepartmentMapping = {
      "切断": null,
      "組立": ["ASSEMBLY_001"]
    };

    expect(() => determineDistributionDepartments(
      productType,
      requiredProcesses,
      requiredMaterials,
      nullDepartmentMapping
    )).toThrow(/部署/);

    // 空の部署コードを含む部署マッピング
    const emptyDepartmentMapping = {
      "切断": [""],
      "組立": ["ASSEMBLY_001"]
    };

    expect(() => determineDistributionDepartments(
      productType,
      requiredProcesses,
      requiredMaterials,
      emptyDepartmentMapping
    )).toThrow(/部署/);
  });
});