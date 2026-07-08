import { recordPresentationToContractor } from '../../src/logic/it-6-3-1';

describe('査定判定ロジックの適用履歴と根拠の記録・検索機能', () => {
  // SCEN-1026: [normal] 説明資料のゼネコン提示記録機能 - 説明資料をゼネコンに提示した時点で提示内容・日時・受領者情報がシステムに正確に記録される
  test('should record contractor presentation with accurate timestamp, recipient info, and material details', () => {
    const presentation_timestamp = new Date('2024-01-15T14:30:00Z');
    const contractor_company_name = 'ABC建設株式会社';
    const contractor_representative_name = '山田太郎';
    const contractor_email = 'yamada@abc-construction.co.jp';
    const material_title = '相場乖離分析レポート_案件ID-2024-001';
    const material_filename = 'deviation_analysis_20240115.pdf';
    const material_hash = 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6';
    const material_summary = '見積金額が相場平均値から15%乖離していることが判明';

    const result = recordPresentationToContractor({
      presentation_timestamp,
      contractor_company_name,
      contractor_representative_name,
      contractor_email,
      material_title,
      material_filename,
      material_hash,
      material_summary,
    });

    // (4) システムにより自動採番されたレコードID確認
    expect(result.record_id).toBeDefined();
    expect(typeof result.record_id).toBe('string');
    expect(result.record_id.length).toBeGreaterThan(0);

    // (1) 提示日時が入力値と一致していることを確認
    expect(result.presentation_timestamp).toEqual(presentation_timestamp);

    // (2) 受領ゼネコン名と担当者情報が入力値と正確に一致していることを確認
    expect(result.contractor_company_name).toBe(contractor_company_name);
    expect(result.contractor_representative_name).toBe(contractor_representative_name);
    expect(result.contractor_email).toBe(contractor_email);

    // (3) 提示資料の内容・ファイル名が提示時の資料と一致していることを確認
    expect(result.material_title).toBe(material_title);
    expect(result.material_filename).toBe(material_filename);
    expect(result.material_hash).toBe(material_hash);
    expect(result.material_summary).toBe(material_summary);

    // (5) 提示ステータスが「提示済」と表示されていることを確認
    expect(result.presentation_status).toBe('提示済');

    // レコード構造の完全性確認
    expect(result).toHaveProperty('record_id');
    expect(result).toHaveProperty('presentation_timestamp');
    expect(result).toHaveProperty('contractor_company_name');
    expect(result).toHaveProperty('contractor_representative_name');
    expect(result).toHaveProperty('contractor_email');
    expect(result).toHaveProperty('material_title');
    expect(result).toHaveProperty('material_filename');
    expect(result).toHaveProperty('material_hash');
    expect(result).toHaveProperty('material_summary');
    expect(result).toHaveProperty('presentation_status');
  });
});