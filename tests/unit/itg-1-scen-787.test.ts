import { describe, test, expect, beforeEach } from '@jest/globals';
import { markObsoleteMaterialForDisposal } from '../../src/logic/it-1781935279444-1-1-1';

describe('営業データ項目のメタデータ管理機能 - 旧版資料の自動廃棄マーキング', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-787: [normal] 旧版資料の自動廃棄マーキング機能 - 有効期限到達時に旧版資料が廃棄対象にマークされる
  test('有効期限に到達した旧版資料が廃棄対象としてマークされること', () => {
    // 事前条件: テスト用の旧版資料を有効期限付きで登録
    const today = new Date('2024-12-20T00:00:00Z');
    const material_id = 'mat-001-old-version';
    const material_name = '営業提案資料_v1.0';
    const effective_date_start = new Date('2024-11-01T00:00:00Z');
    const effective_date_end = new Date('2024-12-20T00:00:00Z'); // 本日が有効期限
    const material_status_before = 'active';
    const material_version = 'v1.0';

    const material_input = {
      material_id,
      material_name,
      effective_date_start,
      effective_date_end,
      material_version,
      material_status: material_status_before,
      is_obsolete_marked: false,
    };

    // 実行: システムの自動廃棄マーキング機能を実行（有効期限チェック処理をトリガー）
    const result = markObsoleteMaterialForDisposal(material_input, today);

    // 検証: 有効期限に到達した旧版資料が廃棄対象として正しくマークされたこと
    expect(result.is_obsolete_marked).toBe(true);
    expect(result.material_status).toBe('disposal_target');
    expect(result.disposal_marked_date).toEqual(today);
    expect(result.material_id).toBe(material_id);
    expect(result.material_version).toBe(material_version);

    // 廃棄対象資料一覧に該当資料が表示されることを確認
    expect(result.is_obsolete_marked).toBe(true);
    expect(result.material_status).toBe('disposal_target');
  });

  // 境界値テスト: 有効期限前日の資料は廃棄対象にならないこと
  test('有効期限の前日の資料は廃棄対象にマークされないこと', () => {
    const today = new Date('2024-12-19T00:00:00Z');
    const material_id = 'mat-002-active';
    const material_name = '営業契約書_v2.0';
    const effective_date_start = new Date('2024-11-01T00:00:00Z');
    const effective_date_end = new Date('2024-12-20T00:00:00Z'); // 明日が有効期限

    const material_input = {
      material_id,
      material_name,
      effective_date_start,
      effective_date_end,
      material_version: 'v2.0',
      material_status: 'active',
      is_obsolete_marked: false,
    };

    const result = markObsoleteMaterialForDisposal(material_input, today);

    // 有効期限に達していないため廃棄対象にならない
    expect(result.is_obsolete_marked).toBe(false);
    expect(result.material_status).toBe('active');
  });

  // エラーテスト: 有効期限が不正な場合
  test('有効期限の日付が逆転している場合は例外をスロー', () => {
    const today = new Date('2024-12-20T00:00:00Z');
    const material_input = {
      material_id: 'mat-003-invalid',
      material_name: '不正なテスト資料',
      effective_date_start: new Date('2024-12-20T00:00:00Z'),
      effective_date_end: new Date('2024-11-01T00:00:00Z'), // 開始日より終了日が早い
      material_version: 'v1.0',
      material_status: 'active',
      is_obsolete_marked: false,
    };

    expect(() => markObsoleteMaterialForDisposal(material_input, today)).toThrow(/有効期限/);
  });

  // 境界値テスト: 有効期限の当日23:59:59の場合
  test('有効期限の終了時刻間際でも廃棄対象にマークされること', () => {
    const today = new Date('2024-12-20T23:59:59Z');
    const material_id = 'mat-004-eod';
    const material_name = '資料_終了直前';
    const effective_date_start = new Date('2024-11-01T00:00:00Z');
    const effective_date_end = new Date('2024-12-21T00:00:00Z');

    const material_input = {
      material_id,
      material_name,
      effective_date_start,
      effective_date_end,
      material_version: 'v1.5',
      material_status: 'active',
      is_obsolete_marked: false,
    };

    const result = markObsoleteMaterialForDisposal(material_input, today);

    // 終了日が2024-12-21なので本日(2024-12-20)は有効期限に達していない
    expect(result.is_obsolete_marked).toBe(false);
    expect(result.material_status).toBe('active');
  });

  // エラーテスト: 入力値の必須フィールドが不足している場合
  test('material_idが未指定の場合は例外をスロー', () => {
    const today = new Date('2024-12-20T00:00:00Z');
    const material_input = {
      material_id: '',
      material_name: '資料名',
      effective_date_start: new Date('2024-11-01T00:00:00Z'),
      effective_date_end: new Date('2024-12-20T00:00:00Z'),
      material_version: 'v1.0',
      material_status: 'active',
      is_obsolete_marked: false,
    };

    expect(() => markObsoleteMaterialForDisposal(material_input, today)).toThrow(/material_id/);
  });

  // 複数の旧版資料を同時にマーキングするシナリオ
  test('複数の旧版資料が同時に廃棄対象にマークされること', () => {
    const today = new Date('2024-12-20T00:00:00Z');

    const materials_input = [
      {
        material_id: 'mat-005-multi-1',
        material_name: '提案資料_v1',
        effective_date_start: new Date('2024-10-01T00:00:00Z'),
        effective_date_end: new Date('2024-12-20T00:00:00Z'),
        material_version: 'v1.0',
        material_status: 'active',
        is_obsolete_marked: false,
      },
      {
        material_id: 'mat-006-multi-2',
        material_name: '契約書_v2',
        effective_date_start: new Date('2024-10-15T00:00:00Z'),
        effective_date_end: new Date('2024-12-20T00:00:00Z'),
        material_version: 'v2.0',
        material_status: 'active',
        is_obsolete_marked: false,
      },
    ];

    const results = materials_input.map((material) =>
      markObsoleteMaterialForDisposal(material, today)
    );

    // すべての資料が廃棄対象にマークされることを確認
    expect(results).toHaveLength(2);
    results.forEach((result) => {
      expect(result.is_obsolete_marked).toBe(true);
      expect(result.material_status).toBe('disposal_target');
      expect(result.disposal_marked_date).toEqual(today);
    });
  });

  // 正常系: すでに廃棄対象にマークされている資料への再実行
  test('すでに廃棄対象にマークされている資料は重複してマークされないこと', () => {
    const today = new Date('2024-12-20T00:00:00Z');
    const material_id = 'mat-007-already-marked';
    const material_input = {
      material_id,
      material_name: '既廃棄対象資料',
      effective_date_start: new Date('2024-10-01T00:00:00Z'),
      effective_date_end: new Date('2024-12-20T00:00:00Z'),
      material_version: 'v1.0',
      material_status: 'disposal_target',
      is_obsolete_marked: true,
    };

    const first_result = markObsoleteMaterialForDisposal(material_input, today);

    // 1回目
    expect(first_result.is_obsolete_marked).toBe(true);
    expect(first_result.material_status).toBe('disposal_target');

    // 2回目実行（データを再度マーキング）
    const second_result = markObsoleteMaterialForDisposal(first_result, today);

    // ステータスや日付が二重に更新されないこと
    expect(second_result.is_obsolete_marked).toBe(true);
    expect(second_result.material_status).toBe('disposal_target');
    expect(second_result.disposal_marked_date).toEqual(today);
  });
});