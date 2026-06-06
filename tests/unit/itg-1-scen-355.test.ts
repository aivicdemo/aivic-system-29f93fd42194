import { assignWorkersToProcesses } from '../../src/logic/it-1';

describe("工程担当者割り当て機能", () => {
  test("要求スキルレベルを満たす作業員が複数存在する場合に稼働状況で優先度が決定される", () => {
    // SCEN-355
    const productSpecification = {
      productId: "P001",
      processRequirements: [
        {
          process_id: "PROC001",
          required_skill_level: 3,
          estimated_hours: 8
        }
      ]
    };

    const processRequirements = [
      {
        process_id: "PROC001",
        required_skill_level: 3,
        estimated_hours: 8
      }
    ];

    const workerSkills = [
      {
        worker_id: "W001",
        skill_level: 4
      },
      {
        worker_id: "W002", 
        skill_level: 3
      },
      {
        worker_id: "W003",
        skill_level: 5
      }
    ];

    const workerSchedule = [
      {
        worker_id: "W001",
        available_hours: 8
      },
      {
        worker_id: "W002",
        available_hours: 8
      },
      {
        worker_id: "W003",
        available_hours: 8
      }
    ];

    const productionDeadline = "2024-01-31T17:00:00Z";

    const result = assignWorkersToProcesses(
      productSpecification,
      processRequirements,
      workerSkills,
      workerSchedule,
      productionDeadline
    );

    expect(result.processAssignments).toEqual([
      { processId: "PROC001", workerId: "W003" }
    ]);
    expect(result.totalEstimatedHours).toBe(8);
    expect(result.completionDate).toBeDefined();
  });
});