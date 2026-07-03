import { recordContractApprovalLog } from '../../src/logic/it-1781935279444-1-1-1';

describe('営業データ項目のメタデータ管理機能 - 契約変更承認ログ記録', () => {
  test('SCEN-1216: 複数承認者が必要な契約の場合、全承認者のログが記録されるまで確定状態にならない', () => {
    // テストデータ: 複数承認者が必要な契約（承認者数: 3名）
    const contract_id = 'CTR-20240115-001';
    const change_description = '提供サービス内容の変更: 月額プラン アップグレード';
    const required_approvers_count = 3;
    const approver1_id = 'USR-001';
    const approver1_name = '山田太郎';
    const approver1_timestamp = '2024-01-15T10:30:00Z';

    const approver2_id = 'USR-002';
    const approver2_name = '鈴木花子';
    const approver2_timestamp = '2024-01-15T11:45:00Z';

    const approver3_id = 'USR-003';
    const approver3_name = '佐藤次郎';
    const approver3_timestamp = '2024-01-15T13:20:00Z';

    // 1番目の承認者による承認ログ記録
    const approval_log_1 = recordContractApprovalLog({
      contract_id: contract_id,
      approver_id: approver1_id,
      approver_name: approver1_name,
      approval_timestamp: approver1_timestamp,
      approval_action: '承認',
      change_description: change_description,
      required_approvers_count: required_approvers_count,
      current_approval_count: 1,
    });

    // 1番目の承認ログが記録されたことを確認
    expect(approval_log_1.approval_sequence).toBe(1);
    expect(approval_log_1.approver_name).toBe('山田太郎');
    expect(approval_log_1.approval_timestamp).toBe('2024-01-15T10:30:00Z');
    expect(approval_log_1.approval_action).toBe('承認');
    expect(approval_log_1.contract_status).toBe('承認待機中');
    expect(approval_log_1.is_confirmed).toBe(false);

    // 2番目の承認者による承認ログ記録
    const approval_log_2 = recordContractApprovalLog({
      contract_id: contract_id,
      approver_id: approver2_id,
      approver_name: approver2_name,
      approval_timestamp: approver2_timestamp,
      approval_action: '承認',
      change_description: change_description,
      required_approvers_count: required_approvers_count,
      current_approval_count: 2,
    });

    // 2番目の承認ログが記録されたことを確認
    expect(approval_log_2.approval_sequence).toBe(2);
    expect(approval_log_2.approver_name).toBe('鈴木花子');
    expect(approval_log_2.approval_timestamp).toBe('2024-01-15T11:45:00Z');
    expect(approval_log_2.contract_status).toBe('承認待機中');
    expect(approval_log_2.is_confirmed).toBe(false);

    // 3番目の承認者による承認ログ記録
    const approval_log_3 = recordContractApprovalLog({
      contract_id: contract_id,
      approver_id: approver3_id,
      approver_name: approver3_name,
      approval_timestamp: approver3_timestamp,
      approval_action: '承認',
      change_description: change_description,
      required_approvers_count: required_approvers_count,
      current_approval_count: 3,
    });

    // 3番目の承認ログが記録され、全承認が完了したことを確認
    expect(approval_log_3.approval_sequence).toBe(3);
    expect(approval_log_3.approver_name).toBe('佐藤次郎');
    expect(approval_log_3.approval_timestamp).toBe('2024-01-15T13:20:00Z');
    expect(approval_log_3.contract_status).toBe('確定');
    expect(approval_log_3.is_confirmed).toBe(true);

    // 承認ログ履歴の統合情報を確認
    const approval_log_history = [approval_log_1, approval_log_2, approval_log_3];

    // 全承認ログが記録されたことを確認（3名すべて）
    expect(approval_log_history.length).toBe(3);
    expect(approval_log_history[0].approver_name).toBe('山田太郎');
    expect(approval_log_history[1].approver_name).toBe('鈴木花子');
    expect(approval_log_history[2].approver_name).toBe('佐藤次郎');

    // 各承認者の名前、承認日時、操作内容が正確に記録されていることを検証
    expect(approval_log_history[0]).toEqual({
      approval_sequence: 1,
      contract_id: 'CTR-20240115-001',
      approver_id: 'USR-001',
      approver_name: '山田太郎',
      approval_timestamp: '2024-01-15T10:30:00Z',
      approval_action: '承認',
      change_description: '提供サービス内容の変更: 月額プラン アップグレード',
      contract_status: '承認待機中',
      is_confirmed: false,
    });

    expect(approval_log_history[1]).toEqual({
      approval_sequence: 2,
      contract_id: 'CTR-20240115-001',
      approver_id: 'USR-002',
      approver_name: '鈴木花子',
      approval_timestamp: '2024-01-15T11:45:00Z',
      approval_action: '承認',
      change_description: '提供サービス内容の変更: 月額プラン アップグレード',
      contract_status: '承認待機中',
      is_confirmed: false,
    });

    expect(approval_log_history[2]).toEqual({
      approval_sequence: 3,
      contract_id: 'CTR-20240115-001',
      approver_id: 'USR-003',
      approver_name: '佐藤次郎',
      approval_timestamp: '2024-01-15T13:20:00Z',
      approval_action: '承認',
      change_description: '提供サービス内容の変更: 月額プラン アップグレード',
      contract_status: '確定',
      is_confirmed: true,
    });

    // 最終的な契約状態が『確定』であることを確認
    expect(approval_log_3.is_confirmed).toBe(true);
    expect(approval_log_3.contract_status).toBe('確定');

    // 必須承認者数に達するまでは『確定』にならないことを確認
    expect(approval_log_1.is_confirmed).toBe(false);
    expect(approval_log_2.is_confirmed).toBe(false);
  });
});