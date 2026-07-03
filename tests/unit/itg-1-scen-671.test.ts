import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import fetchMock from 'jest-fetch-mock';
import { filterReportsByAssignedContracts } from '../../src/logic/it-1-1-1';

fetchMock.enableMocks();

describe('顧客別ポータル表示制御機能', () => {
  beforeEach(() => {
    fetchMock.resetMocks();
  });

  afterEach(() => {
    fetchMock.resetMocks();
  });

  // SCEN-671
  test('ログイン済み営業責任者に割り当てられた契約IDのレポートのみがポータルに表示される', async () => {
    // 営業責任者Aのユーザー情報
    const userA = {
      user_id: 'user_001',
      user_name: '営業責任者A',
      assigned_contract_ids: ['contract_101', 'contract_102', 'contract_103'],
    };

    // 営業責任者Bのユーザー情報
    const userB = {
      user_id: 'user_002',
      user_name: '営業責任者B',
      assigned_contract_ids: ['contract_201', 'contract_202'],
    };

    // ポータルに存在するすべてのレポート（複数の営業責任者に関連）
    const all_reports = [
      {
        report_id: 'report_001',
        report_name: '月次成果レポート 2024年1月',
        contract_id: 'contract_101',
        generated_date: '2024-01-31T23:59:59Z',
      },
      {
        report_id: 'report_002',
        report_name: '月次成果レポート 2024年1月',
        contract_id: 'contract_102',
        generated_date: '2024-01-31T23:59:59Z',
      },
      {
        report_id: 'report_003',
        report_name: '月次成果レポート 2024年1月',
        contract_id: 'contract_103',
        generated_date: '2024-01-31T23:59:59Z',
      },
      {
        report_id: 'report_004',
        report_name: '月次成果レポート 2024年1月',
        contract_id: 'contract_201',
        generated_date: '2024-01-31T23:59:59Z',
      },
      {
        report_id: 'report_005',
        report_name: '月次成果レポート 2024年1月',
        contract_id: 'contract_202',
        generated_date: '2024-01-31T23:59:59Z',
      },
      {
        report_id: 'report_006',
        report_name: '月次成果レポート 2024年1月',
        contract_id: 'contract_301',
        generated_date: '2024-01-31T23:59:59Z',
      },
    ];

    // 営業責任者A: ポータルから表示対象レポートを取得
    fetchMock.mockResponseOnce(JSON.stringify(all_reports), { status: 200 });

    const filtered_reports_a = await filterReportsByAssignedContracts(
      userA.user_id,
      userA.assigned_contract_ids,
      all_reports
    );

    // 営業責任者Aに表示されるべきレポートは3件（contract_101, 102, 103に紐づくもの）
    expect(filtered_reports_a.length).toBe(3);

    // 営業責任者Aに表示されるレポートの契約IDを抽出
    const displayed_contract_ids_a = filtered_reports_a.map((r: any) => r.contract_id);

    // 表示されている契約IDがすべてユーザーAに割り当てられたものであることを確認
    expect(displayed_contract_ids_a).toEqual(['contract_101', 'contract_102', 'contract_103']);

    // 割り当てられていない契約IDのレポートが表示されていないことを確認
    const unauthorized_contract_ids = ['contract_201', 'contract_202', 'contract_301'];
    const has_unauthorized = filtered_reports_a.some((r: any) =>
      unauthorized_contract_ids.includes(r.contract_id)
    );
    expect(has_unauthorized).toBe(false);

    // 営業責任者B: ポータルから表示対象レポートを取得
    fetchMock.mockResponseOnce(JSON.stringify(all_reports), { status: 200 });

    const filtered_reports_b = await filterReportsByAssignedContracts(
      userB.user_id,
      userB.assigned_contract_ids,
      all_reports
    );

    // 営業責任者Bに表示されるべきレポートは2件（contract_201, 202に紐づくもの）
    expect(filtered_reports_b.length).toBe(2);

    // 営業責任者Bに表示されるレポートの契約IDを抽出
    const displayed_contract_ids_b = filtered_reports_b.map((r: any) => r.contract_id);

    // 表示されている契約IDがすべてユーザーBに割り当てられたものであることを確認
    expect(displayed_contract_ids_b).toEqual(['contract_201', 'contract_202']);

    // ユーザーAに割り当てられたレポートがユーザーBに表示されていないことを確認
    const user_a_contract_ids = ['contract_101', 'contract_102', 'contract_103'];
    const has_user_a_reports = filtered_reports_b.some((r: any) =>
      user_a_contract_ids.includes(r.contract_id)
    );
    expect(has_user_a_reports).toBe(false);

    // 他のいかなる営業責任者にも割り当てられていないレポート（contract_301）がどちらにも表示されていないことを確認
    const other_contract_reports = all_reports.filter((r) => r.contract_id === 'contract_301');
    expect(other_contract_reports.length).toBe(1);
    expect(filtered_reports_a.find((r: any) => r.contract_id === 'contract_301')).toBeUndefined();
    expect(filtered_reports_b.find((r: any) => r.contract_id === 'contract_301')).toBeUndefined();
  });
});