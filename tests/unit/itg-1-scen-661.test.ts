import { describe, test, expect, beforeEach } from '@jest/globals';
import { filterReportsByContractIds, validatePortalAccessControl } from '../../src/logic/it-1-2-1';

describe('ポータル配信アクセス制御機能 - 複数契約ID保有顧客', () => {
  // SCEN-661
  test('複数契約ID保有顧客の全契約に紐付くレポートが正確に表示・フィルタリングされる', () => {
    // ===== 前提条件 =====
    // 複数契約ID（契約A、契約B、契約C）を保有する顧客アカウント
    const customer_id = 'CUST-001';
    const authorized_contract_ids = ['CONTRACT-A', 'CONTRACT-B', 'CONTRACT-C'];
    const unauthorized_contract_id = 'CONTRACT-D';

    // ポータルで利用可能なレポート（複数契約に紐付く）
    const available_reports = [
      { report_id: 'RPT-001', contract_id: 'CONTRACT-A', month: '2024-01', title: '営業成果レポート1月A' },
      { report_id: 'RPT-002', contract_id: 'CONTRACT-A', month: '2024-02', title: '営業成果レポート2月A' },
      { report_id: 'RPT-003', contract_id: 'CONTRACT-B', month: '2024-01', title: '営業成果レポート1月B' },
      { report_id: 'RPT-004', contract_id: 'CONTRACT-B', month: '2024-02', title: '営業成果レポート2月B' },
      { report_id: 'RPT-005', contract_id: 'CONTRACT-C', month: '2024-01', title: '営業成果レポート1月C' },
      { report_id: 'RPT-006', contract_id: 'CONTRACT-D', month: '2024-01', title: '営業成果レポート1月D' },
    ];

    // ===== 検証1: ポータルアクセス制御の検証 =====
    const access_control_result = validatePortalAccessControl({
      customer_id: customer_id,
      authorized_contracts: authorized_contract_ids,
      accessed_contract_id: 'CONTRACT-A',
    });

    expect(access_control_result.is_authorized).toBe(true);
    expect(access_control_result.access_granted_contracts).toEqual(['CONTRACT-A', 'CONTRACT-B', 'CONTRACT-C']);

    // ===== 検証2: 権限のない契約へのアクセス拒否 =====
    const unauthorized_access_result = validatePortalAccessControl({
      customer_id: customer_id,
      authorized_contracts: authorized_contract_ids,
      accessed_contract_id: unauthorized_contract_id,
    });

    expect(unauthorized_access_result.is_authorized).toBe(false);

    // ===== 検証3: 全契約に紐付くレポートが表示される =====
    const all_reports_result = filterReportsByContractIds({
      reports: available_reports,
      authorized_contracts: authorized_contract_ids,
      selected_contracts: [],
      customer_id: customer_id,
    });

    expect(all_reports_result.total_count).toBe(5);
    expect(all_reports_result.filtered_reports).toHaveLength(5);
    expect(all_reports_result.filtered_reports.map((r) => r.report_id)).toEqual([
      'RPT-001',
      'RPT-002',
      'RPT-003',
      'RPT-004',
      'RPT-005',
    ]);

    // ===== 検証4: 契約Aのみでフィルタリング =====
    const contract_a_filtered = filterReportsByContractIds({
      reports: available_reports,
      authorized_contracts: authorized_contract_ids,
      selected_contracts: ['CONTRACT-A'],
      customer_id: customer_id,
    });

    expect(contract_a_filtered.total_count).toBe(2);
    expect(contract_a_filtered.filtered_reports).toHaveLength(2);
    expect(contract_a_filtered.filtered_reports.map((r) => r.contract_id)).toEqual(['CONTRACT-A', 'CONTRACT-A']);
    expect(contract_a_filtered.filtered_reports.map((r) => r.month)).toEqual(['2024-01', '2024-02']);

    // ===== 検証5: 契約Bのみでフィルタリング =====
    const contract_b_filtered = filterReportsByContractIds({
      reports: available_reports,
      authorized_contracts: authorized_contract_ids,
      selected_contracts: ['CONTRACT-B'],
      customer_id: customer_id,
    });

    expect(contract_b_filtered.total_count).toBe(2);
    expect(contract_b_filtered.filtered_reports).toHaveLength(2);
    expect(contract_b_filtered.filtered_reports.map((r) => r.contract_id)).toEqual(['CONTRACT-B', 'CONTRACT-B']);

    // ===== 検証6: 契約Cのみでフィルタリング =====
    const contract_c_filtered = filterReportsByContractIds({
      reports: available_reports,
      authorized_contracts: authorized_contract_ids,
      selected_contracts: ['CONTRACT-C'],
      customer_id: customer_id,
    });

    expect(contract_c_filtered.total_count).toBe(1);
    expect(contract_c_filtered.filtered_reports).toHaveLength(1);
    expect(contract_c_filtered.filtered_reports[0].contract_id).toBe('CONTRACT-C');

    // ===== 検証7: 複数契約を同時選択（契約A + 契約B） =====
    const contract_a_b_filtered = filterReportsByContractIds({
      reports: available_reports,
      authorized_contracts: authorized_contract_ids,
      selected_contracts: ['CONTRACT-A', 'CONTRACT-B'],
      customer_id: customer_id,
    });

    expect(contract_a_b_filtered.total_count).toBe(4);
    expect(contract_a_b_filtered.filtered_reports).toHaveLength(4);
    const returned_contract_ids_ab = contract_a_b_filtered.filtered_reports.map((r) => r.contract_id);
    expect(returned_contract_ids_ab.filter((c) => c === 'CONTRACT-A')).toHaveLength(2);
    expect(returned_contract_ids_ab.filter((c) => c === 'CONTRACT-B')).toHaveLength(2);

    // ===== 検証8: 複数契約を同時選択（契約A + 契約C） =====
    const contract_a_c_filtered = filterReportsByContractIds({
      reports: available_reports,
      authorized_contracts: authorized_contract_ids,
      selected_contracts: ['CONTRACT-A', 'CONTRACT-C'],
      customer_id: customer_id,
    });

    expect(contract_a_c_filtered.total_count).toBe(3);
    expect(contract_a_c_filtered.filtered_reports).toHaveLength(3);

    // ===== 検証9: 権限のない契約Dでフィルタリング試行 =====
    const unauthorized_filter_result = filterReportsByContractIds({
      reports: available_reports,
      authorized_contracts: authorized_contract_ids,
      selected_contracts: ['CONTRACT-D'],
      customer_id: customer_id,
    });

    expect(unauthorized_filter_result.total_count).toBe(0);
    expect(unauthorized_filter_result.filtered_reports).toHaveLength(0);
    expect(unauthorized_filter_result.is_access_denied).toBe(true);

    // ===== 検証10: ページネーション動作確認 =====
    const paginated_result = filterReportsByContractIds({
      reports: available_reports,
      authorized_contracts: authorized_contract_ids,
      selected_contracts: [],
      customer_id: customer_id,
      page_number: 1,
      page_size: 2,
    });

    expect(paginated_result.total_count).toBe(5);
    expect(paginated_result.filtered_reports).toHaveLength(2);
    expect(paginated_result.current_page).toBe(1);
    expect(paginated_result.total_pages).toBe(3);

    // ===== 検証11: ページネーション2ページ目 =====
    const paginated_result_page2 = filterReportsByContractIds({
      reports: available_reports,
      authorized_contracts: authorized_contract_ids,
      selected_contracts: [],
      customer_id: customer_id,
      page_number: 2,
      page_size: 2,
    });

    expect(paginated_result_page2.filtered_reports).toHaveLength(2);
    expect(paginated_result_page2.current_page).toBe(2);

    // ===== 検証12: ページネーション3ページ目（最終ページ） =====
    const paginated_result_page3 = filterReportsByContractIds({
      reports: available_reports,
      authorized_contracts: authorized_contract_ids,
      selected_contracts: [],
      customer_id: customer_id,
      page_number: 3,
      page_size: 2,
    });

    expect(paginated_result_page3.filtered_reports).toHaveLength(1);
    expect(paginated_result_page3.current_page).toBe(3);
    expect(paginated_result_page3.has_next_page).toBe(false);

    // ===== 検証13: 契約Aでフィルタリング後ページネーション =====
    const contract_a_paginated = filterReportsByContractIds({
      reports: available_reports,
      authorized_contracts: authorized_contract_ids,
      selected_contracts: ['CONTRACT-A'],
      customer_id: customer_id,
      page_number: 1,
      page_size: 1,
    });

    expect(contract_a_paginated.total_count).toBe(2);
    expect(contract_a_paginated.filtered_reports).toHaveLength(1);
    expect(contract_a_paginated.total_pages).toBe(2);
    expect(contract_a_paginated.has_next_page).toBe(true);

    // ===== 検証14: エラーケース - アクセス権限なし =====
    expect(() =>
      validatePortalAccessControl({
        customer_id: 'CUST-002',
        authorized_contracts: [],
        accessed_contract_id: 'CONTRACT-A',
      })
    ).toThrow(/権限/);

    // ===== 検証15: エラーケース - 無効なページ番号 =====
    expect(() =>
      filterReportsByContractIds({
        reports: available_reports,
        authorized_contracts: authorized_contract_ids,
        selected_contracts: [],
        customer_id: customer_id,
        page_number: 0,
        page_size: 2,
      })
    ).toThrow(/ページ/);
  });
});