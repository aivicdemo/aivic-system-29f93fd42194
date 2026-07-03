import { describe, test, expect } from '@jest/globals';
import {
  createSalesDataItemMetadata,
  getSalesDataItemMetadataById,
  updateSalesDataItemMetadata,
  getSalesDataItemMetadataList,
} from '../../src/logic/it-1781935279444-1-1-1';

describe('営業データ項目メタデータ管理機能', () => {
  test('SCEN-675: 営業データ項目の定義が一元管理される', () => {
    // ステップ1: 新しい営業データ項目を作成
    const createInput = {
      itemName: '売上金額',
      unit: '円',
      dataType: '数値（整数）',
      calculationLogic: '単価 × 数量',
    };

    const createdMetadata = createSalesDataItemMetadata(createInput);

    // ステップ2-3: 作成されたメタデータが正確に返される
    expect(createdMetadata).toEqual({
      id: expect.any(String),
      itemName: '売上金額',
      unit: '円',
      dataType: '数値（整数）',
      calculationLogic: '単価 × 数量',
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
    });

    const metadataId = createdMetadata.id;

    // ステップ4: メタデータ一覧画面でアイテムが表示される
    const metadataList = getSalesDataItemMetadataList();

    expect(metadataList).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: metadataId,
          itemName: '売上金額',
          unit: '円',
          dataType: '数値（整数）',
          calculationLogic: '単価 × 数量',
        }),
      ]),
    );

    // ステップ5: 作成したメタデータの詳細を取得
    const detailMetadata = getSalesDataItemMetadataById(metadataId);

    expect(detailMetadata).toEqual({
      id: metadataId,
      itemName: '売上金額',
      unit: '円',
      dataType: '数値（整数）',
      calculationLogic: '単価 × 数量',
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
    });

    // ステップ6: 詳細情報が正確に表示される
    expect(detailMetadata.itemName).toBe('売上金額');
    expect(detailMetadata.unit).toBe('円');
    expect(detailMetadata.dataType).toBe('数値（整数）');
    expect(detailMetadata.calculationLogic).toBe('単価 × 数量');

    // ステップ7: 別の営業フォームでこのメタデータを参照して同じ定義が適用される
    const referencedMetadata = getSalesDataItemMetadataById(metadataId);

    expect(referencedMetadata.itemName).toBe('売上金額');
    expect(referencedMetadata.unit).toBe('円');
    expect(referencedMetadata.dataType).toBe('数値（整数）');
    expect(referencedMetadata.calculationLogic).toBe('単価 × 数量');

    // ステップ8-9: メタデータ項目を編集し、単位を「円」から「ドル」に変更
    const updateInput = {
      itemName: '売上金額',
      unit: 'ドル',
      dataType: '数値（整数）',
      calculationLogic: '単価 × 数量',
    };

    const updatedMetadata = updateSalesDataItemMetadata(metadataId, updateInput);

    expect(updatedMetadata).toEqual({
      id: metadataId,
      itemName: '売上金額',
      unit: 'ドル',
      dataType: '数値（整数）',
      calculationLogic: '単価 × 数量',
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
    });

    // ステップ10: システム全体の参照元で定義が更新されていることを確認
    const confirmedMetadata = getSalesDataItemMetadataById(metadataId);

    expect(confirmedMetadata.unit).toBe('ドル');
    expect(confirmedMetadata.itemName).toBe('売上金額');
    expect(confirmedMetadata.dataType).toBe('数値（整数）');
    expect(confirmedMetadata.calculationLogic).toBe('単価 × 数量');

    // 変更が一覧にも反映されている
    const updatedList = getSalesDataItemMetadataList();

    expect(updatedList).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: metadataId,
          itemName: '売上金額',
          unit: 'ドル',
          dataType: '数値（整数）',
          calculationLogic: '単価 × 数量',
        }),
      ]),
    );
  });
});