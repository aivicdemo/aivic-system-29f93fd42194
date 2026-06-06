import { assignWorkersToProcesses } from '../../src/logic/it-1';

describe("製品仕様・納期・工程・資材・担当者情報を統合して標準化された生産指示書を自動生成する機能", () => {
  test("全作業員が稼働中の場合にエラーが発生する", () => {
    // SCEN-357
    const productSpecification = {
      productId: "P001",
      requiredProcesses: ["cutting", "assembly", "inspection"]
    };

    const processRequirements = [
      {
        process_id: "cutting",
        required_skill_level: 3,
        estimated_hours: 4
      },
      {
        process_id: "assembly", 
        required_skill_level: 2,
        estimated_hours: 6
      },
      {
        process_id: "inspection",
        required_skill_level: 4,
        estimated_hours: 2
      }
    ];

    const workerSkills = [
      {
        worker_id: "W001",
        skill_level: 3
      },
      {
        worker_id: "W002", 
        skill_level: 4
      },
      {
        worker_id: "W003",
        skill_level: 2
      }
    ];

    const workerSchedule = [
      {
        worker_id: "W001",
        available_hours: 0
      },
      {
        worker_id: "W002",
        available_hours: 0
      },
      {
        worker_id: "W003", 
        available_hours: 0
      }
    ];

    const productionDeadline = "2024-01-20";

    expect(() => assignWorkersToProcesses(
      productSpecification,
      processRequirements,
      workerSkills,
      workerSchedule,
      productionDeadline
    )).toThrow(/作業員/);
  });
});