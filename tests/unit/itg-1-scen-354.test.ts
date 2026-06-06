import { assignWorkersToProcesses } from '../../src/logic/it-1';

describe("工程担当者割り当て機能", () => {
  test("作業員のスキルレベルと稼働状況から最適な担当者が各工程に割り当てられる", () => {
    // SCEN-354
    
    // 製品仕様：複数の工程を含む製品
    const productSpecification = {
      productId: "PROD-001",
      processes: ["溶接", "組立", "検査"]
    };

    // 工程要件：各工程の必要スキルレベルと作業時間
    const processRequirements = [
      {
        process_id: "溶接",
        required_skill_level: 3, // 上級
        estimated_hours: 8
      },
      {
        process_id: "組立", 
        required_skill_level: 2, // 中級
        estimated_hours: 6
      },
      {
        process_id: "検査",
        required_skill_level: 3, // 上級
        estimated_hours: 4
      }
    ];

    // 作業員スキル：各作業員の保有スキルと熟練度
    const workerSkills = [
      {
        worker_id: "W001",
        skill_level: 3 // 上級
      },
      {
        worker_id: "W002", 
        skill_level: 2 // 中級
      },
      {
        worker_id: "W003",
        skill_level: 3 // 上級
      },
      {
        worker_id: "W004",
        skill_level: 1 // 初級
      }
    ];

    // 作業員稼働状況：空き時間の情報
    const workerSchedule = [
      {
        worker_id: "W001",
        available_hours: 8
      },
      {
        worker_id: "W002",
        available_hours: 6
      },
      {
        worker_id: "W003", 
        available_hours: 4
      },
      {
        worker_id: "W004",
        available_hours: 8
      }
    ];

    const productionDeadline = "2024-01-20";

    const result = assignWorkersToProcesses(
      productSpecification,
      processRequirements,
      workerSkills,
      workerSchedule,
      productionDeadline
    );

    // 各工程に担当者が割り当てられている
    expect(result.processAssignments).toEqual([
      { processId: "溶接", workerId: "W001" },    // 上級スキル必要 → W001(skill_level:3)
      { processId: "組立", workerId: "W002" },    // 中級スキル必要 → W002(skill_level:2)  
      { processId: "検査", workerId: "W003" }     // 上級スキル必要 → W003(skill_level:3)
    ]);

    // 合計予想作業時間：8 + 6 + 4 = 18時間
    expect(result.totalEstimatedHours).toBe(18);

    // 完成予定日が設定されている
    expect(result.completionDate).toBe("2024-01-19");
  });
});