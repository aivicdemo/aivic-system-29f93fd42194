import { assignWorkersToProcesses } from '../../src/logic/it-1';

describe("製品仕様・納期・工程・資材・担当者情報を統合して標準化された生産指示書を自動生成する機能", () => {
  test("要求スキルレベルを満たす作業員が存在しない場合にエラーが発生する", () => {
    // SCEN-356
    
    const productSpecification = {
      processRequirements: [
        {
          process_id: "PROC_001",
          required_skill_level: 3,
          estimated_hours: 8
        }
      ]
    };

    const processRequirements = [
      {
        process_id: "PROC_001",
        required_skill_level: 3,
        estimated_hours: 8
      }
    ];

    const workerSkills = [
      {
        worker_id: "WORKER_001",
        skill_level: 1
      },
      {
        worker_id: "WORKER_002", 
        skill_level: 2
      },
      {
        worker_id: "WORKER_003",
        skill_level: 1
      }
    ];

    const workerSchedule = [
      {
        worker_id: "WORKER_001",
        available_hours: 10
      },
      {
        worker_id: "WORKER_002",
        available_hours: 12
      },
      {
        worker_id: "WORKER_003",
        available_hours: 8
      }
    ];

    const productionDeadline = "2024-02-01";

    expect(() => assignWorkersToProcesses(
      productSpecification,
      processRequirements,
      workerSkills,
      workerSchedule,
      productionDeadline
    )).toThrow(/作業員/);
  });
});