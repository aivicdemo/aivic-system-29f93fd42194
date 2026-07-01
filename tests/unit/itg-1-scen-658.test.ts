import { filterReportsByUserAssignedContracts } from '../../src/logic/it-1-2-1';

describe('営業成果レポートのポータル配信アクセス制御', () => {
  // SCEN-658
  test('割り当てられた契約IDに紐付くレポートのみがポータルに表示される', () => {
    // ===== 前提: ユーザーアカウント・契約・レポートが存在する状態 =====
    const user_1_id = 'user_001';
    const user_1_assigned_contract_ids = ['contract_A', 'contract_B'];
    
    const user_2_id = 'user_002';
    const user_2_assigned_contract_ids = ['contract_C', 'contract_D'];

    const all_reports = [
      {
        report_id: 'report_001',
        contract_id: 'contract_A',
        title: 'Monthly Sales Report Jan 2024',
        generated_date: '2024-01-31T09:00:00Z',
      },
      {
        report_id: 'report_002',
        contract_id: 'contract_B',
        title: 'Monthly Sales Report Jan 2024',
        generated_date: '2024-01-31T09:00:00Z',
      },
      {
        report_id: 'report_003',
        contract_id: 'contract_C',
        title: 'Monthly Sales Report Jan 2024',
        generated_date: '2024-01-31T09:00:00Z',
      },
      {
        report_id: 'report_004',
        contract_id: 'contract_D',
        title: 'Monthly Sales Report Jan 2024',
        generated_date: '2024-01-31T09:00:00Z',
      },
      {
        report_id: 'report_005',
        contract_id: 'contract_A',
        title: 'Monthly Sales Report Feb 2024',
        generated_date: '2024-02-29T09:00:00Z',
      },
    ];

    // ===== 処理実行 =====
    // ユーザー1がログイン後、ポータルのレポート一覧を取得
    const user_1_filtered_reports = filterReportsByUserAssignedContracts(
      all_reports,
      user_1_assigned_contract_ids
    );

    // ユーザー2がログイン後、ポータルのレポート一覧を取得
    const user_2_filtered_reports = filterReportsByUserAssignedContracts(
      all_reports,
      user_2_assigned_contract_ids
    );

    // ===== 期待値計算 =====
    // ユーザー1は contract_A, contract_B に割り当てられているため、
    // report_001, report_002, report_005 が表示される (3件)
    const expected_user_1_report_count = 3;
    const expected_user_1_report_ids = ['report_001', 'report_002', 'report_005'];
    const expected_user_1_contract_ids = ['contract_A', 'contract_B'];

    // ユーザー2は contract_C, contract_D に割り当てられているため、
    // report_003, report_004 が表示される (2件)
    const expected_user_2_report_count = 2;
    const expected_user_2_report_ids = ['report_003', 'report_004'];
    const expected_user_2_contract_ids = ['contract_C', 'contract_D'];

    // ===== 検証 =====
    // ユーザー1: 割り当てられた契約IDのレポートのみが表示されることを検証
    expect(user_1_filtered_reports.length).toBe(expected_user_1_report_count);
    expect(user_1_filtered_reports.map((r) => r.report_id)).toEqual(
      expect.arrayContaining(expected_user_1_report_ids)
    );
    expect(user_1_filtered_reports.every((r) =>
      expected_user_1_contract_ids.includes(r.contract_id)
    )).toBe(true);

    // ユーザー1: 割り当てられていない契約IDのレポートが表示されていないことを検証
    expect(
      user_1_filtered_reports.some((r) =>
        user_2_assigned_contract_ids.includes(r.contract_id)
      )
    ).toBe(false);

    // ユーザー2: 割り当てられた契約IDのレポートのみが表示されることを検証
    expect(user_2_filtered_reports.length).toBe(expected_user_2_report_count);
    expect(user_2_filtered_reports.map((r) => r.report_id)).toEqual(
      expect.arrayContaining(expected_user_2_report_ids)
    );
    expect(user_2_filtered_reports.every((r) =>
      expected_user_2_contract_ids.includes(r.contract_id)
    )).toBe(true);

    // ユーザー2: 割り当てられていない契約IDのレポートが表示されていないことを検証
    expect(
      user_2_filtered_reports.some((r) =>
        user_1_assigned_contract_ids.includes(r.contract_id)
      )
    ).toBe(false);

    // ===== 複数ユーザー間でのアクセス制御が正しく機能していることを検証 =====
    // ユーザー1とユーザー2が異なるレポートセットを取得していることを検証
    expect(user_1_filtered_reports).not.toEqual(user_2_filtered_reports);

    // ユーザー1のレポートとユーザー2のレポートに重複がないことを検証
    const user_1_report_ids_set = new Set(
      user_1_filtered_reports.map((r) => r.report_id)
    );
    const user_2_report_ids_in_user_1 = user_2_filtered_reports.filter((r) =>
      user_1_report_ids_set.has(r.report_id)
    );
    expect(user_2_report_ids_in_user_1.length).toBe(0);
  });
});