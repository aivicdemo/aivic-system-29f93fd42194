import { createSalesDataItemMetadata, getSalesDataItemMetadataList, getSalesDataItemMetadataByName, createValidationRuleWithMetadataReference, getValidationRuleReferences } from '../../src/logic/it-1781935279444-1-1-1';

describe('営業データ項目メタデータ管理機能', () => {
  // SCEN-1304: [normal] 営業データ項目メタデータ管理機能 - 営業データ項目のメタデータ（項目名・単位・データ型・計算ロジック）が一元管理され、検証ルールで参照できる
  test('営業データ項目メタデータが一元管理され、検証ルール設定時に正確に参照でき、複数の検証ルールから一貫性を保ったまま利用できること', () => {
    // ステップ 1: 新規営業データ項目メタデータを作成する
    const metadataInput1 = {
      itemName: '売上金額',
      unit: '円',
      dataType: '数値型',
      calculationLogic: '単価×数量'
    };
    const createdMetadata1 = createSalesDataItemMetadata(metadataInput1);
    
    expect(createdMetadata1).toEqual(expect.objectContaining({
      itemName: '売上金額',
      unit: '円',
      dataType: '数値型',
      calculationLogic: '単価×数量'
    }));
    expect(createdMetadata1.id).toBeDefined();
    expect(typeof createdMetadata1.id).toBe('string');

    // ステップ 2: 追加のメタデータを作成し、複数の営業データ項目が一元管理されることを確認する
    const metadataInput2 = {
      itemName: 'アポ数',
      unit: '件',
      dataType: '数値型',
      calculationLogic: 'SUM(日別アポ数)'
    };
    const createdMetadata2 = createSalesDataItemMetadata(metadataInput2);

    const metadataInput3 = {
      itemName: '成約数',
      unit: '件',
      dataType: '数値型',
      calculationLogic: 'SUM(日別成約数)'
    };
    const createdMetadata3 = createSalesDataItemMetadata(metadataInput3);

    // ステップ 3: メタデータ一覧を取得し、全てが登録されていることを確認する
    const metadataList = getSalesDataItemMetadataList();
    
    expect(metadataList.length).toBeGreaterThanOrEqual(3);
    expect(metadataList).toEqual(expect.arrayContaining([
      expect.objectContaining({
        itemName: '売上金額',
        unit: '円',
        dataType: '数値型',
        calculationLogic: '単価×数量'
      }),
      expect.objectContaining({
        itemName: 'アポ数',
        unit: '件',
        dataType: '数値型',
        calculationLogic: 'SUM(日別アポ数)'
      }),
      expect.objectContaining({
        itemName: '成約数',
        unit: '件',
        dataType: '数値型',
        calculationLogic: 'SUM(日別成約数)'
      })
    ]));

    // ステップ 4: 名前でメタデータを取得し、正確に参照できることを確認する
    const retrievedMetadata = getSalesDataItemMetadataByName('売上金額');
    
    expect(retrievedMetadata).toEqual(expect.objectContaining({
      itemName: '売上金額',
      unit: '円',
      dataType: '数値型',
      calculationLogic: '単価×数量'
    }));

    // ステップ 5: 検証ルール設定で「売上金額」項目メタデータを参照する
    const validationRuleInput1 = {
      ruleName: '売上金額範囲検証',
      referencedItemName: '売上金額',
      validationCondition: '値が0～10000000の範囲内'
    };
    const createdRule1 = createValidationRuleWithMetadataReference(validationRuleInput1);
    
    expect(createdRule1).toEqual(expect.objectContaining({
      ruleName: '売上金額範囲検証',
      referencedItemName: '売上金額'
    }));
    expect(createdRule1.id).toBeDefined();

    // ステップ 6: 別の検証ルールで「売上金額」を参照し、複数の検証ルールから参照可能であることを確認する
    const validationRuleInput2 = {
      ruleName: '売上金額データ型検証',
      referencedItemName: '売上金額',
      validationCondition: 'データ型が数値型'
    };
    const createdRule2 = createValidationRuleWithMetadataReference(validationRuleInput2);
    
    expect(createdRule2).toEqual(expect.objectContaining({
      ruleName: '売上金額データ型検証',
      referencedItemName: '売上金額'
    }));

    // ステップ 7: 「アポ数」と「成約数」を参照する検証ルールも作成する
    const validationRuleInput3 = {
      ruleName: 'アポ数範囲検証',
      referencedItemName: 'アポ数',
      validationCondition: '値が0～1000の範囲内'
    };
    const createdRule3 = createValidationRuleWithMetadataReference(validationRuleInput3);

    const validationRuleInput4 = {
      ruleName: '成約数範囲検証',
      referencedItemName: '成約数',
      validationCondition: '値が0～500の範囲内'
    };
    const createdRule4 = createValidationRuleWithMetadataReference(validationRuleInput4);

    // ステップ 8: 「売上金額」を参照する全ての検証ルールを取得し、一貫性が保たれていることを確認する
    const referencesForSalesAmount = getValidationRuleReferences('売上金額');
    
    expect(referencesForSalesAmount.length).toBeGreaterThanOrEqual(2);
    expect(referencesForSalesAmount).toEqual(expect.arrayContaining([
      expect.objectContaining({
        ruleName: '売上金額範囲検証',
        referencedItemName: '売上金額'
      }),
      expect.objectContaining({
        ruleName: '売上金額データ型検証',
        referencedItemName: '売上金額'
      })
    ]));

    // ステップ 9: 各検証ルールが参照しているメタデータの情報が一貫性を持っていることを確認する
    referencesForSalesAmount.forEach((rule) => {
      const referencedMetadata = getSalesDataItemMetadataByName(rule.referencedItemName);
      
      expect(referencedMetadata).toEqual(expect.objectContaining({
        itemName: '売上金額',
        unit: '円',
        dataType: '数値型',
        calculationLogic: '単価×数量'
      }));
    });

    // ステップ 10: 複数項目の検証ルール参照情報も一貫性を保っていることを確認する
    const referencesForApo = getValidationRuleReferences('アポ数');
    expect(referencesForApo.length).toBeGreaterThanOrEqual(1);
    
    referencesForApo.forEach((rule) => {
      const referencedMetadata = getSalesDataItemMetadataByName(rule.referencedItemName);
      
      expect(referencedMetadata).toEqual(expect.objectContaining({
        itemName: 'アポ数',
        unit: '件',
        dataType: '数値型',
        calculationLogic: 'SUM(日別アポ数)'
      }));
    });

    const referencesForAgreement = getValidationRuleReferences('成約数');
    expect(referencesForAgreement.length).toBeGreaterThanOrEqual(1);
    
    referencesForAgreement.forEach((rule) => {
      const referencedMetadata = getSalesDataItemMetadataByName(rule.referencedItemName);
      
      expect(referencedMetadata).toEqual(expect.objectContaining({
        itemName: '成約数',
        unit: '件',
        dataType: '数値型',
        calculationLogic: 'SUM(日別成約数)'
      }));
    });

    // ステップ 11: メタデータが複数の検証ルールから同じ定義で参照されていることを最終確認する
    const finalMetadataList = getSalesDataItemMetadataList();
    const finalRuleCountForSalesAmount = referencesForSalesAmount.length;
    const finalRuleCountForApo = referencesForApo.length;
    const finalRuleCountForAgreement = referencesForAgreement.length;
    
    expect(finalMetadataList.length).toBeGreaterThanOrEqual(3);
    expect(finalRuleCountForSalesAmount).toBeGreaterThanOrEqual(2);
    expect(finalRuleCountForApo).toBeGreaterThanOrEqual(1);
    expect(finalRuleCountForAgreement).toBeGreaterThanOrEqual(1);
  });
});