import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { searchSalesActivityData } from '../../src/logic/it-1781935279444-1-1-1';

describe('営業活動データ検索・抽出・検証 - 不正なパラメータハンドリング', () => {
  let consoleSpy: jest.SpyInstance;
  let loggedErrors: any[];

  beforeEach(() => {
    loggedErrors = [];
    consoleSpy = jest.spyOn(console, 'error').mockImplementation((err: any) => {
      loggedErrors.push(err);
    });
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  // SCEN-1186
  test('不正な検索条件パラメータが入力された場合、エラーが返される', () => {
    // ハッピーパス：正常な検索条件を試す
    const validParams = {
      startDate: '2024-01-01',
      endDate: '2024-01-31',
      customerId: 'CUST-001',
      activityType: 'APPOINTMENT',
      salesPersonId: 'SP-001',
    };

    const validResult = searchSalesActivityData(validParams);
    expect(validResult).toBeDefined();
    expect(validResult.success).toBe(true);
    expect(Array.isArray(validResult.data)).toBe(true);

    // 境界値テスト：null パラメータ
    expect(() => {
      searchSalesActivityData(null as any);
    }).toThrow(/パラメータ/);

    // 境界値テスト：undefined パラメータ
    expect(() => {
      searchSalesActivityData(undefined as any);
    }).toThrow(/パラメータ/);

    // 境界値テスト：空オブジェクト
    expect(() => {
      searchSalesActivityData({} as any);
    }).toThrow(/必須項目/);

    // 境界値テスト：startDate が null
    expect(() => {
      searchSalesActivityData({
        startDate: null as any,
        endDate: '2024-01-31',
        customerId: 'CUST-001',
        activityType: 'APPOINTMENT',
        salesPersonId: 'SP-001',
      });
    }).toThrow(/日付形式/);

    // 境界値テスト：startDate が空文字列
    expect(() => {
      searchSalesActivityData({
        startDate: '',
        endDate: '2024-01-31',
        customerId: 'CUST-001',
        activityType: 'APPOINTMENT',
        salesPersonId: 'SP-001',
      });
    }).toThrow(/日付形式/);

    // 境界値テスト：endDate が不正な形式
    expect(() => {
      searchSalesActivityData({
        startDate: '2024-01-01',
        endDate: '2024/13/45',
        customerId: 'CUST-001',
        activityType: 'APPOINTMENT',
        salesPersonId: 'SP-001',
      });
    }).toThrow(/日付形式/);

    // 境界値テスト：customerId が空文字列
    expect(() => {
      searchSalesActivityData({
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        customerId: '',
        activityType: 'APPOINTMENT',
        salesPersonId: 'SP-001',
      });
    }).toThrow(/顧客ID/);

    // 境界値テスト：activityType が不正な値
    expect(() => {
      searchSalesActivityData({
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        customerId: 'CUST-001',
        activityType: 'INVALID_TYPE',
        salesPersonId: 'SP-001',
      });
    }).toThrow(/活動区分/);

    // 境界値テスト：salesPersonId が null
    expect(() => {
      searchSalesActivityData({
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        customerId: 'CUST-001',
        activityType: 'APPOINTMENT',
        salesPersonId: null as any,
      });
    }).toThrow(/営業担当者ID/);

    // 境界値テスト：特殊文字のみの customerId
    expect(() => {
      searchSalesActivityData({
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        customerId: '@#$%',
        activityType: 'APPOINTMENT',
        salesPersonId: 'SP-001',
      });
    }).toThrow(/顧客ID/);

    // 境界値テスト：負の数値をページ番号として指定
    expect(() => {
      searchSalesActivityData({
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        customerId: 'CUST-001',
        activityType: 'APPOINTMENT',
        salesPersonId: 'SP-001',
        pageNumber: -1,
      });
    }).toThrow(/ページ番号/);

    // 境界値テスト：型が不正（文字列をページサイズに指定）
    expect(() => {
      searchSalesActivityData({
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        customerId: 'CUST-001',
        activityType: 'APPOINTMENT',
        salesPersonId: 'SP-001',
        pageSize: 'invalid' as any,
      });
    }).toThrow(/ページサイズ/);

    // 境界値テスト：startDate が endDate より後の日付
    expect(() => {
      searchSalesActivityData({
        startDate: '2024-01-31',
        endDate: '2024-01-01',
        customerId: 'CUST-001',
        activityType: 'APPOINTMENT',
        salesPersonId: 'SP-001',
      });
    }).toThrow(/日付範囲/);

    // エラーログが記録されたか確認
    expect(loggedErrors.length).toBeGreaterThan(0);
    expect(loggedErrors[0]).toBeDefined();
  });
});