import { validateNewStaffGraduationRequirements } from '../../src/logic/it-1781935279444-2-2-1';

describe('卒業要件達成状況判定機能', () => {
  // SCEN-1088
  test('代表の確認・検証完了後、新入スタッフの卒業要件充足状況が正確に可視化される', () => {
    // 新入スタッフのタスク完了状況を模擬
    const new_staff_id = 'staff_001';
    const graduation_requirements = [
      {
        requirement_id: 'req_001',
        requirement_name: '営業基礎研修',
        status: 'completed',
        completed_date: '2024-01-15T10:30:00Z',
        verified_by_admin: true,
        verified_date: '2024-01-15T14:00:00Z'
      },
      {
        requirement_id: 'req_002',
        requirement_name: '顧客管理システム習得',
        status: 'completed',
        completed_date: '2024-01-20T16:45:00Z',
        verified_by_admin: true,
        verified_date: '2024-01-20T17:30:00Z'
      },
      {
        requirement_id: 'req_003',
        requirement_name: '初回営業成約',
        status: 'completed',
        completed_date: '2024-01-25T13:20:00Z',
        verified_by_admin: true,
        verified_date: '2024-01-25T15:00:00Z'
      }
    ];

    const request_payload = {
      new_staff_id: new_staff_id,
      requirements: graduation_requirements,
      verification_completed_by_admin: true,
      verification_completed_timestamp: '2024-01-25T15:00:00Z'
    };

    // 卒業要件達成状況判定機能を実行
    const result = validateNewStaffGraduationRequirements(request_payload);

    // 期待結果の検証
    // 1. 全タスクの完了状況を確認
    expect(result.total_requirements).toBe(3);
    expect(result.completed_requirements).toBe(3);
    
    // 2. 進捗率が100%であることを確認
    expect(result.progress_percentage).toBe(100);
    
    // 3. 卒業判定ステータスが『卒業要件達成』であることを確認
    expect(result.graduation_status).toBe('卒業要件達成');
    
    // 4. 各タスクが✓マーク(completed)で表示されることを確認
    expect(result.requirements_visualization).toEqual([
      {
        requirement_id: 'req_001',
        requirement_name: '営業基礎研修',
        status_mark: '✓',
        status_display: 'completed'
      },
      {
        requirement_id: 'req_002',
        requirement_name: '顧客管理システム習得',
        status_mark: '✓',
        status_display: 'completed'
      },
      {
        requirement_id: 'req_003',
        requirement_name: '初回営業成約',
        status_mark: '✓',
        status_display: 'completed'
      }
    ]);
    
    // 5. 代表の確認・検証完了フラグが設定されていることを確認
    expect(result.admin_verification_completed).toBe(true);
    expect(result.admin_verification_timestamp).toBe('2024-01-25T15:00:00Z');
    
    // 6. 新入スタッフIDが正しく記録されていることを確認
    expect(result.new_staff_id).toBe('staff_001');
    
    // 7. 卒業判定が確定(finalized)していることを確認
    expect(result.graduation_decision_finalized).toBe(true);
    
    // 8. ステータス変更ログが記録されていることを確認
    expect(result.status_change_log).toBeDefined();
    expect(result.status_change_log.length).toBeGreaterThan(0);
    expect(result.status_change_log[result.status_change_log.length - 1]).toEqual({
      timestamp: '2024-01-25T15:00:00Z',
      status_before: '確認待ち',
      status_after: '卒業要件達成',
      changed_by: 'admin',
      changed_by_id: expect.any(String)
    });
  });
});