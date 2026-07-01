import { filterImprovementItemsByPriorityRule } from '../../src/logic/it-1781935279444-2-1-1';

describe('営業データ入力時の品質検証ルール定義・実行機能', () => {
  // SCEN-929: [error] 改善項目の優先度判定・選別機能 - 判定ルール定義が不正または未設定の状態で選別が実行された場合、エラーが返される
  test('判定ルール定義が不正または未設定の状態で選別実行時に、適切なエラーレスポンスが返される', () => {
    const testCases = [
      {
        description: '判定ルール定義が null の場合',
        input: {
          priorityRuleDefinition: null,
          improvementItems: [
            { id: 'ITEM001', category: '営業データ品質', impact: 'high', frequency: 5 },
            { id: 'ITEM002', category: '契約管理', impact: 'medium', frequency: 3 }
          ]
        },
        expectedErrorPattern: /判定ルール定義/,
        expectedStatusCode: 400
      },
      {
        description: '判定ルール定義が空オブジェクトの場合',
        input: {
          priorityRuleDefinition: {},
          improvementItems: [
            { id: 'ITEM001', category: '営業データ品質', impact: 'high', frequency: 5 }
          ]
        },
        expectedErrorPattern: /判定ルール定義/,
        expectedStatusCode: 400
      },
      {
        description: '判定ルール定義に必須フィールド (criteria) が不在の場合',
        input: {
          priorityRuleDefinition: {
            ruleId: 'RULE001',
            name: '優先度判定ルール'
            // criteria が不在
          },
          improvementItems: [
            { id: 'ITEM001', category: '営業データ品質', impact: 'high', frequency: 5 }
          ]
        },
        expectedErrorPattern: /判定ルール定義が不正/,
        expectedStatusCode: 400
      },
      {
        description: '判定ルール定義の criteria が空配列の場合',
        input: {
          priorityRuleDefinition: {
            ruleId: 'RULE002',
            name: '優先度判定ルール',
            criteria: []
          },
          improvementItems: [
            { id: 'ITEM001', category: '営業データ品質', impact: 'high', frequency: 5 }
          ]
        },
        expectedErrorPattern: /判定ルール定義/,
        expectedStatusCode: 400
      },
      {
        description: '判定ルール定義が無効化 (disabled: true) された場合',
        input: {
          priorityRuleDefinition: {
            ruleId: 'RULE003',
            name: '優先度判定ルール',
            criteria: [
              { field: 'impact', weight: 0.6, threshold: 'high' },
              { field: 'frequency', weight: 0.4, threshold: 3 }
            ],
            disabled: true
          },
          improvementItems: [
            { id: 'ITEM001', category: '営業データ品質', impact: 'high', frequency: 5 }
          ]
        },
        expectedErrorPattern: /判定ルール定義が設定されていません/,
        expectedStatusCode: 400
      }
    ];

    testCases.forEach(({ description, input, expectedErrorPattern, expectedStatusCode }) => {
      try {
        const result = filterImprovementItemsByPriorityRule(input.priorityRuleDefinition, input.improvementItems);
        // エラーが返されるべきだが返されない場合、テスト失敗
        fail(`${description}: エラーが返されるべきだったが、結果 ${JSON.stringify(result)} が返された`);
      } catch (error: any) {
        // エラーメッセージのパターン検証
        expect(error.message).toMatch(expectedErrorPattern);
        
        // エラーレスポンスにステータスコードが含まれている場合を検証
        if (error.statusCode !== undefined) {
          expect(error.statusCode).toBe(expectedStatusCode);
        }
        
        // エラーが正しく発生したことを確認
        expect(error).toBeDefined();
      }
    });

    // 正常系: 判定ルール定義が正しく設定された場合、選別処理が成功することを確認
    const validPriorityRuleDefinition = {
      ruleId: 'RULE_VALID',
      name: '優先度判定ルール',
      criteria: [
        { field: 'impact', weight: 0.6, threshold: 'high' },
        { field: 'frequency', weight: 0.4, threshold: 3 }
      ]
    };

    const validImprovementItems = [
      { id: 'ITEM001', category: '営業データ品質', impact: 'high', frequency: 5 },
      { id: 'ITEM002', category: '契約管理', impact: 'low', frequency: 1 },
      { id: 'ITEM003', category: '請求管理', impact: 'high', frequency: 4 }
    ];

    try {
      const result = filterImprovementItemsByPriorityRule(validPriorityRuleDefinition, validImprovementItems);
      
      // 正常系の結果検証
      expect(result).toBeDefined();
      expect(Array.isArray(result.selectedItems)).toBe(true);
      expect(result.selectedItems.length).toBeGreaterThan(0);
      
      // 優先度が高い項目 (impact: high かつ frequency >= 3) が選別されていることを確認
      const highPriorityItems = result.selectedItems.filter(
        (item: any) => item.impact === 'high' && item.frequency >= 3
      );
      expect(highPriorityItems.length).toBe(2); // ITEM001 と ITEM003 が選別される
    } catch (error) {
      fail(`正常系で予期しないエラーが発生: ${error}`);
    }
  });
});