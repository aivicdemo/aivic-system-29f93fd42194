import { determineDistributionDepartments } from '../../src/logic/it-1';

describe("指示書配信先判定機能", () => {
  test("複数工程にまたがる製品で全関連部署が配信先として判定される", () => {
    // SCEN-359
    const productType = "複合製品";
    const requiredProcesses = ["成形", "組立", "検査", "梱包"];
    const requiredMaterials = ["樹脂材料", "金属部品", "包装材"];
    const departmentProcessMapping = {
      "成形": ["成形部"],
      "組立": ["組立部"],
      "検査": ["品質管理部"],
      "梱包": ["出荷部"]
    };

    const result = determineDistributionDepartments(
      productType,
      requiredProcesses,
      requiredMaterials,
      departmentProcessMapping
    );

    expect(result.manufacturingDepartments).toEqual(["成形部", "組立部", "品質管理部", "出荷部"]);
    expect(result.materialDepartments).toEqual(["資材管理部", "資材管理部", "出荷部"]);
    expect(result.processSequence).toEqual([
      { department: "成形部", process: "成形" },
      { department: "組立部", process: "組立" },
      { department: "品質管理部", process: "検査" },
      { department: "出荷部", process: "梱包" }
    ]);
  });
});