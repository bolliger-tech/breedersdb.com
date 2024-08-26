import { describe, expect, it } from 'vitest';
import { FilterRuleTerm } from './filterRuleTerm';
import { ColumnTypes } from 'src/utils/columnTypes';

describe('FilterTerm', () => {
  it('should return undefined if no schema is provided', () => {
    const value = 'value';

    const filterTerm = new FilterRuleTerm({ value });

    expect(filterTerm.isValid).toBeUndefined();
  });

  describe('allowEmpty', () => {
    it('should not be empty', () => {
      const value = '';
      const schema = {
        type: ColumnTypes.String as const,
        allowEmpty: false,
        validation: {
          maxLen: 3,
          pattern: null,
        },
      };

      const filterTerm = new FilterRuleTerm({ value });
      filterTerm.schema = schema;

      expect(filterTerm.isValid).toBe(false);
    });

    it('should allow empty', () => {
      const value = '';
      const schema = {
        type: ColumnTypes.String as const,
        allowEmpty: true,
        validation: {
          maxLen: 3,
          pattern: null,
        },
      };

      const filterTerm = new FilterRuleTerm({ value });
      filterTerm.schema = schema;

      expect(filterTerm.isValid).toBe(true);
    });
  });

  describe('String', () => {
    it('should be too long', () => {
      const value = '1234';
      const schema = {
        type: ColumnTypes.String as const,
        allowEmpty: false,
        validation: {
          maxLen: 3,
          pattern: null,
        },
      };

      const filterTerm = new FilterRuleTerm({ value });
      filterTerm.schema = schema;

      expect(filterTerm.isValid).toBe(false);
    });

    it('should fit', () => {
      const value = '123';
      const schema = {
        type: ColumnTypes.String as const,
        allowEmpty: false,
        validation: {
          maxLen: 3,
          pattern: null,
        },
      };

      const filterTerm = new FilterRuleTerm({ value });
      filterTerm.schema = schema;

      expect(filterTerm.isValid).toBe(true);
    });

    it('should match pattern', () => {
      const value = '123';
      const schema = {
        type: ColumnTypes.String as const,
        allowEmpty: false,
        validation: {
          maxLen: 3,
          pattern: '^[0-9]+$',
        },
      };

      const filterTerm = new FilterRuleTerm({ value });
      filterTerm.schema = schema;

      expect(filterTerm.isValid).toBe(true);
    });

    it('should not match pattern', () => {
      const value = '123';
      const schema = {
        type: ColumnTypes.String as const,
        allowEmpty: false,
        validation: {
          maxLen: 3,
          pattern: '^[a-z]+$',
        },
      };

      const filterTerm = new FilterRuleTerm({ value });
      filterTerm.schema = schema;

      expect(filterTerm.isValid).toBe(false);
    });
  });

  describe('Citext', () => {
    it('should be too long', () => {
      const value = '1234';
      const schema = {
        type: ColumnTypes.Citext as const,
        allowEmpty: false,
        validation: {
          maxLen: 3,
          pattern: null,
        },
      };

      const filterTerm = new FilterRuleTerm({ value });
      filterTerm.schema = schema;

      expect(filterTerm.isValid).toBe(false);
    });

    it('should fit', () => {
      const value = '123';
      const schema = {
        type: ColumnTypes.Citext as const,
        allowEmpty: false,
        validation: {
          maxLen: 3,
          pattern: null,
        },
      };

      const filterTerm = new FilterRuleTerm({ value });
      filterTerm.schema = schema;

      expect(filterTerm.isValid).toBe(true);
    });

    it('should match pattern', () => {
      const value = '123';
      const schema = {
        type: ColumnTypes.Citext as const,
        allowEmpty: false,
        validation: {
          maxLen: 3,
          pattern: '^[0-9]+$',
        },
      };

      const filterTerm = new FilterRuleTerm({ value });
      filterTerm.schema = schema;

      expect(filterTerm.isValid).toBe(true);
    });

    it('should not match pattern', () => {
      const value = '123';
      const schema = {
        type: ColumnTypes.Citext as const,
        allowEmpty: false,
        validation: {
          maxLen: 3,
          pattern: '^[a-z]+$',
        },
      };

      const filterTerm = new FilterRuleTerm({ value });
      filterTerm.schema = schema;

      expect(filterTerm.isValid).toBe(false);
    });
  });

  describe('Integer', () => {
    it('should not be a float', () => {
      const value = '1.1';
      const schema = {
        type: ColumnTypes.Integer as const,
        allowEmpty: false,
        validation: {
          min: 1,
          max: 3,
          step: 1,
        },
      };

      const filterTerm = new FilterRuleTerm({ value });
      filterTerm.schema = schema;

      expect(filterTerm.isValid).toBe(false);
    });

    it('should not be too small', () => {
      const value = '0';
      const schema = {
        type: ColumnTypes.Integer as const,
        allowEmpty: false,
        validation: {
          min: 1,
          max: 3,
          step: 1,
        },
      };

      const filterTerm = new FilterRuleTerm({ value });
      filterTerm.schema = schema;

      expect(filterTerm.isValid).toBe(false);
    });

    it('should not be too big', () => {
      const value = '4';
      const schema = {
        type: ColumnTypes.Integer as const,
        allowEmpty: false,
        validation: {
          min: 1,
          max: 3,
          step: 1,
        },
      };

      const filterTerm = new FilterRuleTerm({ value });
      filterTerm.schema = schema;

      expect(filterTerm.isValid).toBe(false);
    });

    it('should not be between the steps', () => {
      const value = '2';
      const schema = {
        type: ColumnTypes.Integer as const,
        allowEmpty: false,
        validation: {
          min: 1,
          max: 3,
          step: 2,
        },
      };

      const filterTerm = new FilterRuleTerm({ value });
      filterTerm.schema = schema;

      expect(filterTerm.isValid).toBe(false);
    });

    it('is a valid number', () => {
      const value = 'NaN';
      const schema = {
        type: ColumnTypes.Integer as const,
        allowEmpty: false,
        validation: {
          min: 1,
          max: 3,
          step: 2,
        },
      };

      const filterTerm = new FilterRuleTerm({ value });
      filterTerm.schema = schema;

      expect(filterTerm.isValid).toBe(false);
    });

    it('should fit', () => {
      const value = '3';
      const schema = {
        type: ColumnTypes.Integer as const,
        allowEmpty: false,
        validation: {
          min: 1,
          max: 3,
          step: 2,
        },
      };

      const filterTerm = new FilterRuleTerm({ value });
      filterTerm.schema = schema;

      expect(filterTerm.isValid).toBe(true);
    });
  });

  describe('Rating', () => {
    it('should not be a float', () => {
      const value = '1.1';
      const schema = {
        type: ColumnTypes.Rating as const,
        allowEmpty: false,
        validation: {
          min: 1,
          max: 3,
          step: 1 as const,
        },
      };

      const filterTerm = new FilterRuleTerm({ value });
      filterTerm.schema = schema;

      expect(filterTerm.isValid).toBe(false);
    });

    it('should not be too small', () => {
      const value = '0';
      const schema = {
        type: ColumnTypes.Rating as const,
        allowEmpty: false,
        validation: {
          min: 1,
          max: 3,
          step: 1 as const,
        },
      };

      const filterTerm = new FilterRuleTerm({ value });
      filterTerm.schema = schema;

      expect(filterTerm.isValid).toBe(false);
    });

    it('should not be too big', () => {
      const value = '4';
      const schema = {
        type: ColumnTypes.Rating as const,
        allowEmpty: false,
        validation: {
          min: 1,
          max: 3,
          step: 1 as const,
        },
      };

      const filterTerm = new FilterRuleTerm({ value });
      filterTerm.schema = schema;

      expect(filterTerm.isValid).toBe(false);
    });

    it('is a valid number', () => {
      const value = 'NaN';
      const schema = {
        type: ColumnTypes.Rating as const,
        allowEmpty: false,
        validation: {
          min: 1,
          max: 3,
          step: 1 as const,
        },
      };

      const filterTerm = new FilterRuleTerm({ value });
      filterTerm.schema = schema;

      expect(filterTerm.isValid).toBe(false);
    });

    it('should fit', () => {
      const value = '3';
      const schema = {
        type: ColumnTypes.Rating as const,
        allowEmpty: false,
        validation: {
          min: 1,
          max: 3,
          step: 1 as const,
        },
      };

      const filterTerm = new FilterRuleTerm({ value });
      filterTerm.schema = schema;

      expect(filterTerm.isValid).toBe(true);
    });
  });

  describe('Float', () => {
    it('should not be too small', () => {
      const value = '0.9';
      const schema = {
        type: ColumnTypes.Float as const,
        allowEmpty: false,
        validation: {
          min: 1,
          max: 3,
          step: 1,
        },
      };

      const filterTerm = new FilterRuleTerm({ value });
      filterTerm.schema = schema;

      expect(filterTerm.isValid).toBe(false);
    });

    it('should not be too big', () => {
      const value = '3.1';
      const schema = {
        type: ColumnTypes.Float as const,
        allowEmpty: false,
        validation: {
          min: 1,
          max: 3,
          step: 1,
        },
      };

      const filterTerm = new FilterRuleTerm({ value });
      filterTerm.schema = schema;

      expect(filterTerm.isValid).toBe(false);
    });

    it('should not be between the steps', () => {
      const value = '2.1';
      const schema = {
        type: ColumnTypes.Float as const,
        allowEmpty: false,
        validation: {
          min: 1,
          max: 3,
          step: 0.2,
        },
      };

      const filterTerm = new FilterRuleTerm({ value });
      filterTerm.schema = schema;

      expect(filterTerm.isValid).toBe(false);
    });

    it('is a valid number', () => {
      const value = 'NaN';
      const schema = {
        type: ColumnTypes.Float as const,
        allowEmpty: false,
        validation: {
          min: 1,
          max: 3,
          step: 0.1,
        },
      };

      const filterTerm = new FilterRuleTerm({ value });
      filterTerm.schema = schema;

      expect(filterTerm.isValid).toBe(false);
    });

    it('should fit', () => {
      const value = '2.1';
      const schema = {
        type: ColumnTypes.Float as const,
        allowEmpty: false,
        validation: {
          min: 1,
          max: 3,
          step: 0.1,
        },
      };

      const filterTerm = new FilterRuleTerm({ value });
      filterTerm.schema = schema;

      expect(filterTerm.isValid).toBe(true);
    });

    it('should fit 0 > x < 1', () => {
      const value = '0.5';
      const schema = {
        type: ColumnTypes.Float as const,
        allowEmpty: false,
        validation: {
          min: 0,
          max: 1,
          step: 0.1,
        },
      };

      const filterTerm = new FilterRuleTerm({ value });
      filterTerm.schema = schema;

      expect(filterTerm.isValid).toBe(true);
    });
  });

  describe('Boolean', () => {
    it('can be any string', () => {
      const value = 'true';
      const schema = {
        type: ColumnTypes.Boolean as const,
        allowEmpty: false,
      };

      const filterTerm = new FilterRuleTerm({ value });
      filterTerm.schema = schema;

      expect(filterTerm.isValid).toBe(true);
    });

    it('should not be empty', () => {
      const value = '';
      const schema = {
        type: ColumnTypes.Boolean as const,
        allowEmpty: false,
      };

      const filterTerm = new FilterRuleTerm({ value });
      filterTerm.schema = schema;

      expect(filterTerm.isValid).toBe(false);
    });
  });

  describe('Enum', () => {
    it('should be in options', () => {
      const value = 'option';
      const schema = {
        type: ColumnTypes.Enum as const,
        allowEmpty: false,
        validation: {
          options: ['option'],
        },
      };

      const filterTerm = new FilterRuleTerm({ value });
      filterTerm.schema = schema;

      expect(filterTerm.isValid).toBe(true);
    });

    it('should not be in options but still be valid', () => {
      const value = 'option';
      const schema = {
        type: ColumnTypes.Enum as const,
        allowEmpty: false,
        validation: {
          options: ['other'],
        },
      };

      const filterTerm = new FilterRuleTerm({ value });
      filterTerm.schema = schema;

      expect(filterTerm.isValid).toBe(true);
    });
  });

  describe('Date', () => {
    it('should be a valid date', () => {
      const value = '2021-01-01';
      const schema = {
        type: ColumnTypes.Date as const,
        allowEmpty: false,
      };

      const filterTerm = new FilterRuleTerm({ value });
      filterTerm.schema = schema;

      expect(filterTerm.isValid).toBe(true);
    });

    it('should not be a valid date', () => {
      const value = '2021-01-32';
      const schema = {
        type: ColumnTypes.Date as const,
        allowEmpty: false,
      };

      const filterTerm = new FilterRuleTerm({ value });
      filterTerm.schema = schema;

      expect(filterTerm.isValid).toBe(false);
    });

    it('should not contain a time', () => {
      const value = '2021-01-31T00:00:00.000Z';
      const schema = {
        type: ColumnTypes.Date as const,
        allowEmpty: false,
      };

      const filterTerm = new FilterRuleTerm({ value });
      filterTerm.schema = schema;

      expect(filterTerm.isValid).toBe(false);
    });
  });

  describe('DateTime', () => {
    it('should be a valid date time', () => {
      const value = '2021-01-01T00:00:00';
      const schema = {
        type: ColumnTypes.DateTime as const,
        allowEmpty: false,
      };

      const filterTerm = new FilterRuleTerm({ value });
      filterTerm.schema = schema;

      expect(filterTerm.isValid).toBe(true);
    });

    it('should not be a valid date time', () => {
      const value = '2021-01-01T00:00:60';
      const schema = {
        type: ColumnTypes.DateTime as const,
        allowEmpty: false,
      };

      const filterTerm = new FilterRuleTerm({ value });
      filterTerm.schema = schema;

      expect(filterTerm.isValid).toBe(false);
    });

    it('should contain at least hours and minutes', () => {
      const value = '2021-01-01T00';
      const schema = {
        type: ColumnTypes.DateTime as const,
        allowEmpty: false,
      };

      const filterTerm = new FilterRuleTerm({ value });
      filterTerm.schema = schema;

      expect(filterTerm.isValid).toBe(false);
    });
  });

  describe('Time', () => {
    it('should be a valid time', () => {
      const value = '00:00:00';
      const schema = {
        type: ColumnTypes.Time as const,
        allowEmpty: false,
      };

      const filterTerm = new FilterRuleTerm({ value });
      filterTerm.schema = schema;

      expect(filterTerm.isValid).toBe(true);
    });

    it('should not be a valid time', () => {
      const value = '00:00:60';
      const schema = {
        type: ColumnTypes.Time as const,
        allowEmpty: false,
      };

      const filterTerm = new FilterRuleTerm({ value });
      filterTerm.schema = schema;

      expect(filterTerm.isValid).toBe(false);
    });

    it('should contain at least hours and minutes', () => {
      const value = '00';
      const schema = {
        type: ColumnTypes.Time as const,
        allowEmpty: false,
      };

      const filterTerm = new FilterRuleTerm({ value });
      filterTerm.schema = schema;

      expect(filterTerm.isValid).toBe(false);
    });

    it('should not contain a date', () => {
      const value = '2021-01-01T00:00:00.000Z';
      const schema = {
        type: ColumnTypes.Time as const,
        allowEmpty: false,
      };

      const filterTerm = new FilterRuleTerm({ value });
      filterTerm.schema = schema;

      expect(filterTerm.isValid).toBe(false);
    });
  });

  describe('Photo', () => {
    it('should be a valid photo', () => {
      const value = 'some string';
      const schema = {
        type: ColumnTypes.Photo as const,
        allowEmpty: false,
      };

      const filterTerm = new FilterRuleTerm({ value });
      filterTerm.schema = schema;

      expect(filterTerm.isValid).toBe(true);
    });

    it('should not be a valid photo', () => {
      const value = '';
      const schema = {
        type: ColumnTypes.Photo as const,
        allowEmpty: false,
      };

      const filterTerm = new FilterRuleTerm({ value });
      filterTerm.schema = schema;

      expect(filterTerm.isValid).toBe(false);
    });
  });

  describe('toJSON', () => {
    it('should return the value only', () => {
      const value = 'value';
      const schema = {
        type: ColumnTypes.String as const,
        allowEmpty: true,
        validation: {
          maxLen: 3,
          pattern: null,
        },
      };

      const term = new FilterRuleTerm({ value });
      term.schema = schema;
      const json = JSON.stringify(term);

      expect(JSON.parse(json)).toEqual({ value });
    });
  });
});
