import { describe, test, expect } from '@jest/globals';
import { validateMonthlySummaryTemplateVersion } from '../../src/logic/it-1-br-1781935279444-1-2-1';

describe('Monthly Summary Template Version Management - Validation', () => {
  test('SCEN-918: Version number format validation rejects non-compliant formats', () => {
    // Valid format: X.Y.Z (three numeric segments separated by dots)
    const validVersion = '1.2.3';
    expect(validateMonthlySummaryTemplateVersion(validVersion)).toEqual({
      isValid: true,
      errorMessage: null,
    });

    // Invalid: four segments
    const fourSegments = '1.2.3.4';
    expect(validateMonthlySummaryTemplateVersion(fourSegments)).toEqual({
      isValid: false,
      errorMessage: 'バージョン番号',
    });

    // Invalid: v prefix
    const vPrefix = 'v1.2';
    expect(validateMonthlySummaryTemplateVersion(vPrefix)).toEqual({
      isValid: false,
      errorMessage: 'バージョン番号',
    });

    // Invalid: non-numeric string
    const nonNumeric = 'abc';
    expect(validateMonthlySummaryTemplateVersion(nonNumeric)).toEqual({
      isValid: false,
      errorMessage: 'バージョン番号',
    });

    // Invalid: special characters
    const specialChars = '1.2!3';
    expect(validateMonthlySummaryTemplateVersion(specialChars)).toEqual({
      isValid: false,
      errorMessage: 'バージョン番号',
    });

    // Invalid: empty string
    const emptyString = '';
    expect(validateMonthlySummaryTemplateVersion(emptyString)).toEqual({
      isValid: false,
      errorMessage: 'バージョン番号',
    });

    // Invalid: two segments only
    const twoSegments = '1.2';
    expect(validateMonthlySummaryTemplateVersion(twoSegments)).toEqual({
      isValid: false,
      errorMessage: 'バージョン番号',
    });

    // Invalid: leading zeros with non-standard format
    const leadingZeros = '01.02.03';
    expect(validateMonthlySummaryTemplateVersion(leadingZeros)).toEqual({
      isValid: true,
      errorMessage: null,
    });

    // Valid: zero as component
    const zeroComponent = '0.0.1';
    expect(validateMonthlySummaryTemplateVersion(zeroComponent)).toEqual({
      isValid: true,
      errorMessage: null,
    });

    // Invalid: negative number
    const negativeNumber = '-1.2.3';
    expect(validateMonthlySummaryTemplateVersion(negativeNumber)).toEqual({
      isValid: false,
      errorMessage: 'バージョン番号',
    });

    // Valid: large numbers
    const largeNumbers = '999.999.999';
    expect(validateMonthlySummaryTemplateVersion(largeNumbers)).toEqual({
      isValid: true,
      errorMessage: null,
    });

    // Invalid: trailing dot
    const trailingDot = '1.2.3.';
    expect(validateMonthlySummaryTemplateVersion(trailingDot)).toEqual({
      isValid: false,
      errorMessage: 'バージョン番号',
    });

    // Invalid: leading dot
    const leadingDot = '.1.2.3';
    expect(validateMonthlySummaryTemplateVersion(leadingDot)).toEqual({
      isValid: false,
      errorMessage: 'バージョン番号',
    });

    // Invalid: space in version
    const spaceInVersion = '1. 2.3';
    expect(validateMonthlySummaryTemplateVersion(spaceInVersion)).toEqual({
      isValid: false,
      errorMessage: 'バージョン番号',
    });
  });
});