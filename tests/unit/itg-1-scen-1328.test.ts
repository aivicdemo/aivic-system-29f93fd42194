import { generateValidationRuleFromDataItem } from '../../src/logic/it-1781935279444-2-1-1';

describe('営業データ品質基準・検証ルール定義 - 範囲チェック検証ルール自動生成', () => {
  test('SCEN-1328: 許容範囲が指定されたデータ項目に対して範囲チェック検証ルールが自動生成される', () => {
    const dataItem = {
      itemId: 'revenue_amount',
      itemName: '売上金額',
      dataType: 'numeric',
      isRangeCheckEnabled: true,
      minValue: 0,
      maxValue: 10000000,
      unit: '円',
      isRequired: true,
    };

    const generatedRule = generateValidationRuleFromDataItem(dataItem);

    expect(generatedRule).toBeDefined();
    expect(generatedRule.ruleId).toBeDefined();
    expect(generatedRule.ruleType).toBe('rangeCheck');
    expect(generatedRule.itemId).toBe('revenue_amount');
    expect(generatedRule.itemName).toBe('売上金額');
    
    expect(generatedRule.condition).toBe('value >= 0 AND value <= 10000000');
    expect(generatedRule.minValue).toBe(0);
    expect(generatedRule.maxValue).toBe(10000000);
    
    expect(generatedRule.errorMessage).toBeDefined();
    expect(generatedRule.errorMessage).toContain('売上金額');
    expect(generatedRule.errorMessage).toContain('0');
    expect(generatedRule.errorMessage).toContain('10000000');
    
    expect(generatedRule.severity).toBe('error');
    expect(generatedRule.isActive).toBe(true);

    const exportedJson = JSON.stringify(generatedRule);
    const parsedRule = JSON.parse(exportedJson);

    expect(parsedRule.ruleType).toBe('rangeCheck');
    expect(parsedRule.condition).toBe('value >= 0 AND value <= 10000000');
    expect(parsedRule.minValue).toBe(0);
    expect(parsedRule.maxValue).toBe(10000000);
    expect(parsedRule.itemName).toBe('売上金額');
    expect(parsedRule.errorMessage).toBeDefined();

    expect(() => {
      const testValue = 10000001;
      const isValid = testValue >= generatedRule.minValue && testValue <= generatedRule.maxValue;
      if (!isValid) {
        throw new Error(generatedRule.errorMessage);
      }
    }).toThrow(/売上金額/);

    const validValue = 5000000;
    const isValidInRange = validValue >= generatedRule.minValue && validValue <= generatedRule.maxValue;
    expect(isValidInRange).toBe(true);

    const boundaryLowerValue = 0;
    const isLowerBoundaryValid = boundaryLowerValue >= generatedRule.minValue && boundaryLowerValue <= generatedRule.maxValue;
    expect(isLowerBoundaryValid).toBe(true);

    const boundaryUpperValue = 10000000;
    const isUpperBoundaryValid = boundaryUpperValue >= generatedRule.minValue && boundaryUpperValue <= generatedRule.maxValue;
    expect(isUpperBoundaryValid).toBe(true);
  });
});