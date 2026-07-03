import { markDocumentsForDisposal } from '../../src/logic/it-1781935279444-1-1-1';

describe('営業データ項目のメタデータ管理機能 - 旧版資料の廃棄対象自動マーク', () => {
  test('SCEN-781: 複数の旧バージョンが存在する場合、すべてを廃棄対象にマーク', () => {
    const document_id = 'doc_12345';
    const latest_version = 'v2.0';
    const latest_version_id = 'docver_v2_0';
    const disposal_planned_date = '2026-02-28';

    const input_documents = [
      {
        document_version_id: 'docver_v1_0',
        document_id: document_id,
        version_number: 'v1.0',
        created_at: '2024-01-10T09:00:00Z',
        is_disposal_target: false,
        disposal_planned_date: null,
      },
      {
        document_version_id: 'docver_v1_1',
        document_id: document_id,
        version_number: 'v1.1',
        created_at: '2024-02-15T10:30:00Z',
        is_disposal_target: false,
        disposal_planned_date: null,
      },
      {
        document_version_id: 'docver_v1_2',
        document_id: document_id,
        version_number: 'v1.2',
        created_at: '2024-03-20T14:00:00Z',
        is_disposal_target: false,
        disposal_planned_date: null,
      },
      {
        document_version_id: latest_version_id,
        document_id: document_id,
        version_number: latest_version,
        created_at: '2025-01-25T11:00:00Z',
        is_disposal_target: false,
        disposal_planned_date: null,
      },
    ];

    const result = markDocumentsForDisposal({
      documents: input_documents,
      latest_version_id: latest_version_id,
      disposal_planned_date: disposal_planned_date,
    });

    expect(result.total_documents).toBe(4);
    expect(result.marked_for_disposal_count).toBe(3);
    expect(result.latest_version_preserved).toBe(true);

    expect(result.documents[0].is_disposal_target).toBe(true);
    expect(result.documents[0].disposal_planned_date).toBe(disposal_planned_date);

    expect(result.documents[1].is_disposal_target).toBe(true);
    expect(result.documents[1].disposal_planned_date).toBe(disposal_planned_date);

    expect(result.documents[2].is_disposal_target).toBe(true);
    expect(result.documents[2].disposal_planned_date).toBe(disposal_planned_date);

    expect(result.documents[3].is_disposal_target).toBe(false);
    expect(result.documents[3].disposal_planned_date).toBe(null);

    const marked_versions = result.documents
      .filter((doc) => doc.is_disposal_target === true)
      .map((doc) => doc.version_number);
    expect(marked_versions).toEqual(['v1.0', 'v1.1', 'v1.2']);
    expect(marked_versions.length).toBe(3);

    const all_disposal_dated = result.documents
      .filter((doc) => doc.is_disposal_target === true)
      .every((doc) => doc.disposal_planned_date === disposal_planned_date);
    expect(all_disposal_dated).toBe(true);
  });
});