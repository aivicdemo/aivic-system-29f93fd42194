import { describe, test, expect } from '@jest/globals';
import { saveInquiryResponseRecord } from '../../src/logic/it-1-1-1';

describe('営業成果データの自動検証ルール定義と異常検出機能', () => {
  // SCEN-1210: [error] 問い合わせ対応記録の構造化保存機能 - 必須フィールド（問い合わせ内容、回答内容）が不足している場合、保存を拒否してエラーメッセージを返す
  test('問い合わせ内容が空の場合、保存を拒否してエラーを返す', () => {
    const input_inquiry_content = '';
    const input_response_content = 'こちらが回答内容です。';
    const input_inquiry_id = 'INQ-20240115-001';
    const input_created_by = 'user@example.com';

    expect(() =>
      saveInquiryResponseRecord({
        inquiry_id: input_inquiry_id,
        inquiry_content: input_inquiry_content,
        response_content: input_response_content,
        created_by: input_created_by,
      })
    ).toThrow(/問い合わせ内容/);
  });

  test('回答内容が空の場合、保存を拒否してエラーを返す', () => {
    const input_inquiry_content = 'こちらが問い合わせ内容です。';
    const input_response_content = '';
    const input_inquiry_id = 'INQ-20240115-002';
    const input_created_by = 'user@example.com';

    expect(() =>
      saveInquiryResponseRecord({
        inquiry_id: input_inquiry_id,
        inquiry_content: input_inquiry_content,
        response_content: input_response_content,
        created_by: input_created_by,
      })
    ).toThrow(/回答内容/);
  });

  test('問い合わせ内容と回答内容の両方が空の場合、保存を拒否してエラーを返す', () => {
    const input_inquiry_content = '';
    const input_response_content = '';
    const input_inquiry_id = 'INQ-20240115-003';
    const input_created_by = 'user@example.com';

    expect(() =>
      saveInquiryResponseRecord({
        inquiry_id: input_inquiry_id,
        inquiry_content: input_inquiry_content,
        response_content: input_response_content,
        created_by: input_created_by,
      })
    ).toThrow(/問い合わせ内容|回答内容/);
  });

  test('必須フィールドが揃っている場合、正常に保存される', () => {
    const input_inquiry_content = 'こちらが問い合わせ内容です。';
    const input_response_content = 'こちらが回答内容です。';
    const input_inquiry_id = 'INQ-20240115-004';
    const input_created_by = 'user@example.com';
    const expected_status = 'saved';
    const expected_inquiry_id = 'INQ-20240115-004';

    const result = saveInquiryResponseRecord({
      inquiry_id: input_inquiry_id,
      inquiry_content: input_inquiry_content,
      response_content: input_response_content,
      created_by: input_created_by,
    });

    expect(result.status).toBe(expected_status);
    expect(result.inquiry_id).toBe(expected_inquiry_id);
  });
});