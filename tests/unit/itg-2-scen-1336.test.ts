import { determineApprovalRoute } from "../../src/logic/it-6-2-2-1";

describe("ROI実績レポート承認ルート自動判定", () => {
  // SCEN-1336: [error] ROI実績レポート承認ルート自動判定機能 - 承認権者の権限設定が存在しない場合、デフォルト承認ルートが適用される
  test("承認権者の権限設定が存在しない場合、デフォルト承認ルートが適用される", () => {
    const reportId = "RPT-20240115-001";
    const reportCreatedAt = "2024-01-15T10:30:00Z";
    const reportContent = {
      processingTimeReductionRate: 35.5,
      qualityUniformityIndex: 87.3,
      systemAvailabilityRate: 99.8,
    };

    // 承認権者の権限設定が空（存在しない場合を模擬）
    const approvalAuthoritySettings: Array<{
      authorityId: string;
      role: string;
      approvalLevel: number;
    }> = [];

    // デフォルト承認ルート定義
    const defaultApprovalRoute = {
      routeId: "ROUTE-DEFAULT-001",
      name: "デフォルト承認ルート",
      approvers: [
        {
          position: "原価管理部長",
          sequence: 1,
        },
        {
          position: "経営企画部長",
          sequence: 2,
        },
        {
          position: "CFO",
          sequence: 3,
        },
      ],
      escalationThreshold: {
        processingTimeReductionRate: 30.0,
        qualityUniformityIndex: 80.0,
        systemAvailabilityRate: 99.0,
      },
    };

    const result = determineApprovalRoute(
      reportId,
      reportCreatedAt,
      reportContent,
      approvalAuthoritySettings,
      defaultApprovalRoute
    );

    // 承認権者設定が存在しないことを確認
    expect(approvalAuthoritySettings.length).toBe(0);

    // デフォルト承認ルートが適用されたことを検証
    expect(result.routeId).toBe("ROUTE-DEFAULT-001");
    expect(result.name).toBe("デフォルト承認ルート");
    expect(result.isDefault).toBe(true);
    expect(result.approvers).toEqual([
      {
        position: "原価管理部長",
        sequence: 1,
      },
      {
        position: "経営企画部長",
        sequence: 2,
      },
      {
        position: "CFO",
        sequence: 3,
      },
    ]);

    // レポート内容がすべての閾値を満たしていることを検証
    expect(result.reportContent.processingTimeReductionRate).toBe(35.5);
    expect(result.reportContent.qualityUniformityIndex).toBe(87.3);
    expect(result.reportContent.systemAvailabilityRate).toBe(99.8);

    // 承認フロー開始を検証
    expect(result.approvalFlowStarted).toBe(true);
    expect(result.approvalFlowStartedAt).toBeDefined();
    expect(result.currentApproverPosition).toBe("原価管理部長");
    expect(result.currentApprovalSequence).toBe(1);

    // システムが正常に動作していることを確認
    expect(result.status).toBe("正常");
    expect(result.errorOccurred).toBe(false);
  });
});