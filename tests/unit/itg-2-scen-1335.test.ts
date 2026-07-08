import { determineApprovalRouteForROIReport } from '../../src/logic/it-6-2-2-1';

describe('ROI実績レポート承認ルート自動判定機能', () => {
  // SCEN-1335: [normal] ROI実績レポート承認ルート自動判定機能 - 承認権者が複数存在する場合、承認ルート順序と配信対象者が正常に決定される
  test('should determine approval route order by authority level and set distribution flags correctly when multiple approvers exist', () => {
    const approvers = [
      {
        approver_id: 'APP001',
        approver_name: '査定部署長',
        authority_level: 2,
        is_distribution_target: true,
        approval_order: 0,
      },
      {
        approver_id: 'APP002',
        approver_name: '経営企画・IT部門長',
        authority_level: 3,
        is_distribution_target: true,
        approval_order: 0,
      },
      {
        approver_id: 'APP003',
        approver_name: '原価管理システム運用者',
        authority_level: 1,
        is_distribution_target: true,
        approval_order: 0,
      },
    ];

    const roi_report_id = 'REPORT_2024_01_001';
    const report_generated_date = new Date('2024-01-31T15:30:00Z');

    const result = determineApprovalRouteForROIReport({
      roi_report_id,
      report_generated_date,
      approvers,
    });

    // アサーション1: 承認ルート順序が権限レベルの高い順（3 → 2 → 1）に並んでいることを確認
    expect(result.approval_route).toHaveLength(3);
    expect(result.approval_route[0].authority_level).toBe(3);
    expect(result.approval_route[0].approver_id).toBe('APP002');
    expect(result.approval_route[0].approval_order).toBe(1);

    expect(result.approval_route[1].authority_level).toBe(2);
    expect(result.approval_route[1].approver_id).toBe('APP001');
    expect(result.approval_route[1].approval_order).toBe(2);

    expect(result.approval_route[2].authority_level).toBe(1);
    expect(result.approval_route[2].approver_id).toBe('APP003');
    expect(result.approval_route[2].approval_order).toBe(3);

    // アサーション2: 各承認権者の配信対象フラグが正しく設定されていることを確認
    result.approval_route.forEach((approver) => {
      expect(approver.is_distribution_target).toBe(true);
    });

    // アサーション3: 各ステップの処理順序が正しく設定されていることを確認
    for (let i = 0; i < result.approval_route.length; i++) {
      expect(result.approval_route[i].approval_order).toBe(i + 1);
    }

    // アサーション4: 承認ルート内の各ステップが順序通りに処理されることをシミュレート
    const processed_approvers = [];
    for (const step of result.approval_route) {
      processed_approvers.push({
        approver_id: step.approver_id,
        approval_order: step.approval_order,
      });
    }
    expect(processed_approvers[0].approval_order).toBe(1);
    expect(processed_approvers[1].approval_order).toBe(2);
    expect(processed_approvers[2].approval_order).toBe(3);

    // アサーション5: 複数承認権者がいる場合のルート分岐が正常に機能していることを確認
    expect(result.approval_route_status).toBe('active');
    expect(result.requires_sequential_approval).toBe(true);
    expect(result.total_approvers).toBe(3);

    // アサーション6: 配信対象者が正確に特定されていることを確認
    const distribution_targets = result.approval_route.filter(
      (approver) => approver.is_distribution_target === true,
    );
    expect(distribution_targets).toHaveLength(3);
    expect(distribution_targets.map((t) => t.approver_id)).toEqual([
      'APP002',
      'APP001',
      'APP003',
    ]);

    // アサーション7: レポート配信情報が正しく設定されていることを確認
    expect(result.roi_report_id).toBe('REPORT_2024_01_001');
    expect(result.first_approver_id).toBe('APP002');
    expect(result.first_approver_name).toBe('経営企画・IT部門長');
  });
});