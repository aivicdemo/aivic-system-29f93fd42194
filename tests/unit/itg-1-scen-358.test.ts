import { determineDistributionDepartments } from '../../src/logic/it-1';

describe("製品仕様・納期・工程・資材・担当者情報を統合して標準化された生産指示書を自動生成する機能", () => {
  test("製品種類と工程内容から適切な配信先部署が自動判定される", () => {
    // SCEN-358
    const productType = "電子部品";
    const requiredProcesses = ["組立工程"];
    const requiredMaterials = ["電子部品素材"];
    const departmentProcessMapping = {
      "組立工程": ["組立部"],
      "検査工程": ["品質管理部"],
      "梱包工程": ["出荷部"]
    };

    const result = determineDistributionDepartments(
      productType,
      requiredProcesses,
      requiredMaterials,
      departmentProcessMapping
    );

    expect(result.manufacturingDepartments).toEqual(["組立部"]);
    expect(result.processSequence).toEqual([
      { department: "組立部", process: "組立工程" }
    ]);
  });
});