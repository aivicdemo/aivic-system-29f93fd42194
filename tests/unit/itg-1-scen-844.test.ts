import { it, describe, expect, beforeEach } from '@jest/globals';
import { getTimelineIntegratedContractInfo } from '../../src/logic/it-1-1-1';

describe('営業成果データの自動検証ルール定義と異常検出機能', () => {
  // SCEN-844
  it('[normal] 契約・成果物情報の時系列統合表示機能 - 顧客企業営業責任者がポータルアクセス時、契約書・提案資料・メール履歴・納期情報が時系列順で正しく表示される', () => {
    const customer_id = 'CUST-001';
    const contract_id = 'CTR-2024-001';

    const mock_contract_data = {
      contract_id: 'CTR-2024-001',
      customer_id: 'CUST-001',
      contract_date: '2024-01-15T09:00:00Z',
      contract_name: '基本契約',
      document_type: 'contract'
    };

    const mock_proposal_data = {
      proposal_id: 'PROP-2024-001',
      customer_id: 'CUST-001',
      proposal_date: '2024-01-10T14:30:00Z',
      proposal_name: '提案資料A',
      document_type: 'proposal'
    };

    const mock_email_history = {
      email_id: 'EMAIL-2024-001',
      customer_id: 'CUST-001',
      email_sent_date: '2024-01-20T11:15:00Z',
      subject: '契約内容確認',
      document_type: 'email'
    };

    const mock_delivery_deadline = {
      delivery_id: 'DEL-2024-001',
      customer_id: 'CUST-001',
      deadline_date: '2024-02-28T23:59:59Z',
      item_name: '成果物1',
      document_type: 'delivery'
    };

    const input_params = {
      customer_id: customer_id,
      contract_id: contract_id,
      documents: [
        mock_proposal_data,
        mock_contract_data,
        mock_email_history,
        mock_delivery_deadline
      ]
    };

    const result = getTimelineIntegratedContractInfo(input_params);

    expect(result).toBeDefined();
    expect(result.customer_id).toBe('CUST-001');
    expect(result.timeline_items).toBeDefined();
    expect(Array.isArray(result.timeline_items)).toBe(true);
    expect(result.timeline_items.length).toBe(4);

    expect(result.timeline_items[0].document_type).toBe('proposal');
    expect(result.timeline_items[0].timestamp).toBe('2024-01-10T14:30:00Z');

    expect(result.timeline_items[1].document_type).toBe('contract');
    expect(result.timeline_items[1].timestamp).toBe('2024-01-15T09:00:00Z');

    expect(result.timeline_items[2].document_type).toBe('email');
    expect(result.timeline_items[2].timestamp).toBe('2024-01-20T11:15:00Z');

    expect(result.timeline_items[3].document_type).toBe('delivery');
    expect(result.timeline_items[3].timestamp).toBe('2024-02-28T23:59:59Z');

    expect(result.is_chronological_order).toBe(true);
    expect(result.total_items_displayed).toBe(4);

    const timestamps = result.timeline_items.map(item => new Date(item.timestamp).getTime());
    for (let i = 1; i < timestamps.length; i++) {
      expect(timestamps[i]).toBeGreaterThanOrEqual(timestamps[i - 1]);
    }
  });
});