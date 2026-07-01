import { describe, test, expect } from '@jest/globals';
import { aggregateContractAndDeliverables } from '../../src/logic/it-1-1-1';

describe('契約・成果物情報の時系列統合表示機能', () => {
  // SCEN-845
  test('メール履歴が存在しない場合でも契約書・提案資料・納期情報は正常に表示される', () => {
    const contractId = 'CONTRACT-001';
    const customerId = 'CUST-001';
    const contractData = {
      contract_id: contractId,
      customer_id: customerId,
      contract_name: '営業代行契約',
      contract_status: '有効',
      created_at: '2024-01-01T10:00:00Z',
      updated_at: '2024-01-15T14:30:00Z',
    };
    const proposalData = {
      proposal_id: 'PROP-001',
      contract_id: contractId,
      proposal_name: '営業代行サービス提案',
      proposal_version: '1.0',
      created_at: '2023-12-20T09:00:00Z',
      document_url: 'https://example.com/proposal-001.pdf',
    };
    const deliverableData = {
      deliverable_id: 'DEL-001',
      contract_id: contractId,
      deliverable_name: '営業成果報告書',
      scheduled_date: '2024-02-01T00:00:00Z',
      status: '予定',
    };
    const mailHistoryData: any[] = [];

    const result = aggregateContractAndDeliverables({
      contract_id: contractId,
      customer_id: customerId,
      contract: contractData,
      proposal: proposalData,
      deliverable: deliverableData,
      mail_history: mailHistoryData,
    });

    expect(result.contract_id).toBe(contractId);
    expect(result.customer_id).toBe(customerId);
    expect(result.contract).toEqual(contractData);
    expect(result.proposal).toEqual(proposalData);
    expect(result.deliverable).toEqual(deliverableData);
    expect(result.mail_history).toEqual([]);
    expect(result.timeline).toBeDefined();
    expect(Array.isArray(result.timeline)).toBe(true);
    expect(result.timeline.length).toBeGreaterThanOrEqual(3);

    const contractInTimeline = result.timeline.find(
      (item: any) => item.type === 'contract'
    );
    expect(contractInTimeline).toBeDefined();
    expect(contractInTimeline.data.contract_id).toBe(contractId);

    const proposalInTimeline = result.timeline.find(
      (item: any) => item.type === 'proposal'
    );
    expect(proposalInTimeline).toBeDefined();
    expect(proposalInTimeline.data.proposal_id).toBe('PROP-001');

    const deliverableInTimeline = result.timeline.find(
      (item: any) => item.type === 'deliverable'
    );
    expect(deliverableInTimeline).toBeDefined();
    expect(deliverableInTimeline.data.deliverable_id).toBe('DEL-001');

    const sortedTimeline = result.timeline
      .slice()
      .sort(
        (a: any, b: any) =>
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );
    expect(result.timeline).toEqual(sortedTimeline);

    expect(result.error).toBeUndefined();
    expect(result.has_mail_history).toBe(false);
  });
});