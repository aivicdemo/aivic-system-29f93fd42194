import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';

describe('顧客ポータル合意内容統合表示機能 - メール履歴が存在しない場合のレンダリング検証', () => {
  // SCEN-831
  test('メール履歴が存在しない場合でも、契約書・提案資料・納期情報は正常に表示される', async () => {
    const customer_id = 'CUST-001';
    const contract_id = 'CTR-2024-001';
    const proposal_id = 'PROP-2024-001';
    const delivery_schedule_id = 'SCHED-2024-001';

    // テスト対象の関数をインポート
    const { fetchAgreementPageData } = await import(
      '../../src/logic/it-1-1-1'
    );

    // モックレスポンス: 契約書データ
    const contract_response = {
      contract_id: contract_id,
      customer_id: customer_id,
      contract_name: '営業代行基本契約書',
      version: '2.0',
      effective_date: '2024-01-01',
      document_url: 'https://storage.example.com/contracts/CTR-2024-001_v2.pdf',
      updated_at: '2024-02-15T10:30:00Z',
      created_at: '2024-01-01T09:00:00Z'
    };

    // モックレスポンス: 提案資料データ
    const proposal_response = {
      proposal_id: proposal_id,
      customer_id: customer_id,
      proposal_name: '2024年度営業成果報告システム提案書',
      version: '1.5',
      document_url: 'https://storage.example.com/proposals/PROP-2024-001_v1.5.pdf',
      updated_at: '2024-02-10T14:20:00Z',
      created_at: '2024-01-15T11:00:00Z'
    };

    // モックレスポンス: 納期情報データ
    const delivery_schedule_response = {
      delivery_schedule_id: delivery_schedule_id,
      customer_id: customer_id,
      contract_id: contract_id,
      milestone_name: 'システム運用開始',
      scheduled_date: '2024-03-31',
      actual_date: null,
      status: 'In Progress',
      created_at: '2024-01-01T09:00:00Z'
    };

    // モックレスポンス: メール履歴データ（空）
    const email_history_response = {
      email_histories: [],
      total_count: 0
    };

    // fetch モックの設定
    global.fetch = jest.fn((url: string) => {
      if (url.includes('/api/contracts') && url.includes(customer_id)) {
        return Promise.resolve(
          new Response(JSON.stringify([contract_response]), { status: 200 })
        );
      }
      if (url.includes('/api/proposals') && url.includes(customer_id)) {
        return Promise.resolve(
          new Response(JSON.stringify([proposal_response]), { status: 200 })
        );
      }
      if (url.includes('/api/delivery-schedules') && url.includes(customer_id)) {
        return Promise.resolve(
          new Response(JSON.stringify([delivery_schedule_response]), {
            status: 200
          })
        );
      }
      if (url.includes('/api/email-histories') && url.includes(customer_id)) {
        return Promise.resolve(
          new Response(JSON.stringify(email_history_response), { status: 200 })
        );
      }
      return Promise.reject(new Error('Unknown endpoint'));
    });

    // 関数を実行して統合ページデータを取得
    const result = await fetchAgreementPageData(customer_id);

    // 検証: 結果が正常に取得されている
    expect(result).toBeDefined();
    expect(result).not.toBeNull();

    // 検証: 契約書セクションが存在し、データが正常に含まれている
    expect(result.contracts).toBeDefined();
    expect(Array.isArray(result.contracts)).toBe(true);
    expect(result.contracts.length).toBe(1);
    expect(result.contracts[0].contract_id).toBe(contract_id);
    expect(result.contracts[0].customer_id).toBe(customer_id);
    expect(result.contracts[0].contract_name).toBe('営業代行基本契約書');
    expect(result.contracts[0].version).toBe('2.0');
    expect(result.contracts[0].document_url).toContain('CTR-2024-001_v2.pdf');
    expect(result.contracts[0].effective_date).toBe('2024-01-01');

    // 検証: 提案資料セクションが存在し、データが正常に含まれている
    expect(result.proposals).toBeDefined();
    expect(Array.isArray(result.proposals)).toBe(true);
    expect(result.proposals.length).toBe(1);
    expect(result.proposals[0].proposal_id).toBe(proposal_id);
    expect(result.proposals[0].customer_id).toBe(customer_id);
    expect(result.proposals[0].proposal_name).toBe(
      '2024年度営業成果報告システム提案書'
    );
    expect(result.proposals[0].version).toBe('1.5');
    expect(result.proposals[0].document_url).toContain('PROP-2024-001_v1.5.pdf');

    // 検証: 納期情報セクションが存在し、データが正常に含まれている
    expect(result.delivery_schedules).toBeDefined();
    expect(Array.isArray(result.delivery_schedules)).toBe(true);
    expect(result.delivery_schedules.length).toBe(1);
    expect(result.delivery_schedules[0].delivery_schedule_id).toBe(
      delivery_schedule_id
    );
    expect(result.delivery_schedules[0].customer_id).toBe(customer_id);
    expect(result.delivery_schedules[0].milestone_name).toBe(
      'システム運用開始'
    );
    expect(result.delivery_schedules[0].scheduled_date).toBe('2024-03-31');
    expect(result.delivery_schedules[0].status).toBe('In Progress');

    // 検証: メール履歴が空の状態で返される
    expect(result.email_histories).toBeDefined();
    expect(Array.isArray(result.email_histories)).toBe(true);
    expect(result.email_histories.length).toBe(0);

    // 検証: ページレンダリング情報が正常に構成されている
    expect(result.page_status).toBe('success');
    expect(result.page_has_errors).toBe(false);
    expect(result.sections_rendered).toEqual({
      contracts: true,
      proposals: true,
      delivery_schedules: true,
      email_histories: false
    });

    // 検証: 各セクションのデータが完全性要件を満たしている
    expect(result.data_completeness).toEqual({
      contracts_complete: true,
      proposals_complete: true,
      delivery_schedules_complete: true,
      email_histories_complete: true
    });

    // 検証: エラーログが存在しない
    expect(result.error_log).toBeDefined();
    expect(Array.isArray(result.error_log)).toBe(true);
    expect(result.error_log.length).toBe(0);
  });
});