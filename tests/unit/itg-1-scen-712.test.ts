import { describe, it, expect } from '@jest/globals';
import { generateCorrectionInstructions } from '../../src/logic/it-1781935279444-2-2-1';

describe('営業データ品質検証 - 修正指示生成・通知機能', () => {
  // SCEN-712: [error] 修正指示生成・通知機能 - 複数の不備が存在する場合、すべての修正指示が優先度順に生成される
  it('複数の不備を含む営業データから優先度順に修正指示が生成される', () => {
    // テストデータ: 複数の不備を含む営業データレコード
    const defectiveRecord = {
      record_id: 'sales_20240115_001',
      customer_name: '', // 必須項目欠落 (優先度: 高)
      contact_date: '', // 必須項目欠落 (優先度: 高)
      transaction_amount: 'ABC123', // フォーマット不正 (優先度: 中)
      billing_date: '', // 参照整合性エラー (優先度: 低)
      service_type: 'validType',
      appointment_status: 'confirmed',
    };

    // 修正指示生成機能を呼び出し
    const correctionInstructions = generateCorrectionInstructions(defectiveRecord);

    // 生成された修正指示が存在することを確認
    expect(correctionInstructions).toBeDefined();
    expect(Array.isArray(correctionInstructions)).toBe(true);

    // 修正指示の件数が不備の件数と一致（最低3件以上の不備を期待）
    expect(correctionInstructions.length).toBe(4);

    // 修正指示が優先度順に並べられているか確認
    expect(correctionInstructions[0].priority).toBe(1); // 優先度1（最高）
    expect(correctionInstructions[1].priority).toBe(1); // 優先度1（最高）
    expect(correctionInstructions[2].priority).toBe(2); // 優先度2（中）
    expect(correctionInstructions[3].priority).toBe(3); // 優先度3（低）

    // 第1の修正指示: 顧客情報欠落
    expect(correctionInstructions[0]).toEqual({
      instruction_id: expect.any(String),
      record_id: 'sales_20240115_001',
      defect_type: '必須項目欠落',
      target_field: 'customer_name',
      defect_detail: '顧客名が未入力です。',
      suggested_action: '顧客マスタから正しい顧客名を入力してください。',
      priority: 1,
      created_at: expect.any(String),
    });

    // 第2の修正指示: 接触日時欠落
    expect(correctionInstructions[1]).toEqual({
      instruction_id: expect.any(String),
      record_id: 'sales_20240115_001',
      defect_type: '必須項目欠落',
      target_field: 'contact_date',
      defect_detail: '接触日時が未入力です。',
      suggested_action: '営業活動が実施された日時を YYYY-MM-DD HH:mm 形式で入力してください。',
      priority: 1,
      created_at: expect.any(String),
    });

    // 第3の修正指示: 金額フォーマット不正
    expect(correctionInstructions[2]).toEqual({
      instruction_id: expect.any(String),
      record_id: 'sales_20240115_001',
      defect_type: 'フォーマット不正',
      target_field: 'transaction_amount',
      defect_detail: '取引金額が数値ではありません。入力値: ABC123',
      suggested_action: '取引金額を数値（整数または小数点以下2桁）で再入力してください。例: 100000.00',
      priority: 2,
      created_at: expect.any(String),
    });

    // 第4の修正指示: 請求日付未設定
    expect(correctionInstructions[3]).toEqual({
      instruction_id: expect.any(String),
      record_id: 'sales_20240115_001',
      defect_type: '参照整合性エラー',
      target_field: 'billing_date',
      defect_detail: '請求日付が未設定です。',
      suggested_action: '接触日時以降の請求対象日付を YYYY-MM-DD 形式で入力してください。',
      priority: 3,
      created_at: expect.any(String),
    });

    // 各修正指示が正確な内容を含んでいるか検証
    correctionInstructions.forEach((instruction) => {
      expect(instruction.instruction_id).toBeDefined();
      expect(instruction.instruction_id).not.toBe('');
      expect(instruction.record_id).toBe('sales_20240115_001');
      expect(instruction.defect_type).toMatch(/必須項目欠落|フォーマット不正|参照整合性エラー/);
      expect(instruction.target_field).toBeDefined();
      expect(instruction.defect_detail).toBeDefined();
      expect(instruction.defect_detail.length).toBeGreaterThan(0);
      expect(instruction.suggested_action).toBeDefined();
      expect(instruction.suggested_action.length).toBeGreaterThan(0);
      expect(instruction.priority).toBeGreaterThanOrEqual(1);
      expect(instruction.priority).toBeLessThanOrEqual(3);
      expect(instruction.created_at).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
    });

    // 優先度順にソートされているか確認（降順）
    for (let i = 0; i < correctionInstructions.length - 1; i++) {
      expect(correctionInstructions[i].priority).toBeLessThanOrEqual(
        correctionInstructions[i + 1].priority
      );
    }

    // 修正指示のメタデータが完全であることを確認
    expect(correctionInstructions.every((inst) => inst.instruction_id && inst.target_field))
      .toBe(true);
  });
});