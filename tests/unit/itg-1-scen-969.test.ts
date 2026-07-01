import { describe, test, expect } from '@jest/globals';
import { validateSalesDataCompleteness } from '../../src/logic/it-1781935279444-2-2-1';

describe('営業データの完全性・正確性を自動検証し、不足データ・誤りを検出・通知する機能', () => {
  // SCEN-969: [error] 請求額自動計算・検証機能 - 営業データの完全性が基準を満たさない場合、不足項目の詳細と修正要件を通知する
  test('必須項目が未入力のとき、不足項目の詳細リストと修正要件を含むエラー通知を返す', () => {
    // 手順: 営業データ品質管理・請求自動化システムにログインする → 請求額自動計算・検証機能の画面を開く → 営業データ入力フォームで必須項目の一部（例：顧客名、取引金額など）を意図的に未入力のまま保存を試みる
    const incompleteData = {
      customer_name: '', // 未入力
      transaction_date: '2024-01-15',
      transaction_amount: 50000,
      service_type: '', // 未入力
      contact_person: 'Tanaka Taro',
      contact_email: 'tanaka@example.com',
      appointment_status: 'confirmed',
    };

    // データ検証処理が実行される → システムが完全性チェックを行い、基準（必須項目充足度）を評価する
    const result = validateSalesDataCompleteness(incompleteData);

    // チェック結果として不足項目の詳細情報を確認する
    expect(result.is_valid).toBe(false);
    expect(result.missing_fields).toBeDefined();
    expect(Array.isArray(result.missing_fields)).toBe(true);
    expect(result.missing_fields.length).toBe(2);

    // 修正要件（必須項目、データ形式、入力形式など）の通知内容を確認する
    expect(result.missing_fields).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          field_name: 'customer_name',
          field_description: '顧客名',
          requirement: '必須',
          data_type: '文字列',
          character_limit: '1-100文字',
          priority: 'high',
          correction_deadline: '2024-01-16T09:00:00Z',
        }),
        expect.objectContaining({
          field_name: 'service_type',
          field_description: 'サービス種別',
          requirement: '必須',
          data_type: '文字列',
          allowed_values: ['sales_consultation', 'recruitment', 'marketing', 'management'],
          priority: 'high',
          correction_deadline: '2024-01-16T09:00:00Z',
        }),
      ])
    );

    // 通知メッセージにエラーコードと具体的な修正手順が含まれていることを検証する
    expect(result.error_code).toBe('INCOMPLETE_DATA');
    expect(result.error_message).toMatch(/不足項目/);
    expect(result.detailed_message).toBeDefined();
    expect(result.detailed_message).toContain('customer_name');
    expect(result.detailed_message).toContain('service_type');
    expect(result.correction_instructions).toBeDefined();
    expect(Array.isArray(result.correction_instructions)).toBe(true);
    expect(result.correction_instructions.length).toBeGreaterThan(0);
    expect(result.correction_instructions[0]).toMatch(/顧客名/);

    // ユーザーが不足項目を明確に特定し、必要な修正を実施できる状態となることを検証
    expect(result.completeness_score).toBe(75); // 8 必須項目中 6 項目が入力 → 75%
    expect(result.completeness_threshold).toBe(100); // 完全性チェックの基準は100%
    expect(result.status).toBe('correction_required');
  });
});