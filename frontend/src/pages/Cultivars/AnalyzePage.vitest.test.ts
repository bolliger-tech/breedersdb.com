import { describe, it, beforeEach, expect, vi } from 'vitest';
import AnalyzePage from './AnalyzePage.vue';
import { setActivePinia, createPinia } from 'pinia';
import {
  mountAsync,
  urqlResp,
  addQuasarPlugins,
  type MockQuery,
  type AsyncComponentWrapper,
  type MockMutation,
} from 'src/utils/testHelpers';
import { flushPromises } from '@vue/test-utils';
import { OperationDefinitionNode } from 'graphql';
import { useQueryStore } from 'src/components/Query/useQueryStore';
import {
  FilterNode,
  FilterConjunction,
  BaseTable,
} from 'src/components/Query/Filter/filterNode';
import QueryFilterRuleColumn from 'src/components/Query/Filter/QueryFilterRuleColumn.vue';
import QueryFilterRuleOperator from 'src/components/Query/Filter/QueryFilterRuleOperator.vue';
import QueryFilterRuleTerm from 'src/components/Query/Filter/QueryFilterRuleTerm.vue';
import {
  FilterRuleOperator,
  FilterOperatorValue,
} from 'src/components/Query/Filter/filterRuleOperator';
import { FilterRuleTerm } from 'src/components/Query/Filter/filterRuleTerm';

addQuasarPlugins();

const queryMock: MockQuery = ({ query }) => {
  const queryName = (query.definitions[0] as OperationDefinitionNode).name
    ?.value;
  if ('CultivarsFilterResults' === queryName) {
    return urqlResp({
      cultivars: [
        { id: 1, name: 'cultivar1' },
        { id: 2, name: 'cultivar2' },
      ],
    })();
  }
  if ('Attributes' === queryName) {
    return urqlResp({
      attributes: [
        {
          id: 1,
          name: 'attribute1',
          validation_rule: null,
          data_type: 'TEXT',
        },
        {
          id: 2,
          name: 'attribute2',
          validation_rule: { min: 1, max: 2, step: 1 },
          data_type: 'INTEGER',
        },
      ],
    })();
  }
  throw new Error(`missing queryMock for: ${queryName}`);
};

const mutationMock: MockMutation = (params) => {
  const queryName = (params.query.definitions[0] as OperationDefinitionNode)
    .name?.value;
  if ('RefreshAttributionsView' === queryName) {
    return urqlResp({
      refresh_attributions_view: [
        {
          id: 1,
          view_name: 'AttributionsView',
          last_change: '2024-06-06T11:43:12Z',
          last_check: '2024-06-06T11:43:12Z',
        },
      ],
    })();
  }
  throw new Error(`missing mutationMock for: ${queryName}`);
};

function normalizeString(str: string) {
  return str
    .replace(/(\W)\s+/g, '$1')
    .replace(/\s+(\W)/g, '$1')
    .replace(/(\w)\s+/g, '$1 ')
    .trim();
}

describe('AnalyzePage', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  describe('filter ui basics', () => {
    it('should mount without filter', async () => {
      const wrapper = await mountAsync(AnalyzePage, {
        executeQuery: queryMock,
        executeMutation: mutationMock,
      });

      expect(
        wrapper
          .find('[data-test="query-filter-root-node__filter-placeholder"]')
          .exists(),
      ).toBe(true);
      expect(wrapper.find('[data-test="query-filter-rule"]').exists()).toBe(
        false,
      );
    });

    it('should add filter rule', async () => {
      const wrapper = await mountAsync(AnalyzePage, {
        executeQuery: queryMock,
        executeMutation: mutationMock,
      });

      // click + button
      await wrapper
        .getComponent('[data-test="query-filter-node__action-btn"]')
        .get('a')
        .trigger('click');

      // click add rule
      await wrapper
        .getComponent('[data-test="query-filter-node__action-btn-and"]')
        .get('a')
        .trigger('click');

      await flushPromises();

      expect(
        wrapper
          .find('[data-test="query-filter-root-node__dummy-filter"]')
          .exists(),
      ).toBe(false);

      expect(wrapper.find('[data-test="query-filter-rule"]').exists()).toBe(
        true,
      );
    });
  });

  describe('query logic', () => {
    const addAndRule = async (wrapper: AsyncComponentWrapper) => {
      // click + button
      await wrapper
        .getComponent('[data-test="query-filter-node__action-btn"]')
        .get('a')
        .trigger('click');

      // click add rule
      await wrapper
        .getComponent('[data-test="query-filter-node__action-btn-and"]')
        .get('a')
        .trigger('click');
    };

    it('should create correct cultivar id query', async () => {
      const store = useQueryStore();
      store.baseFilter = FilterNode.FilterRoot({
        childrensConjunction: FilterConjunction.And,
        baseTable: BaseTable.Cultivars,
      });
      const wrapper = await mountAsync(AnalyzePage, {
        executeQuery: queryMock,
        executeMutation: mutationMock,
      });

      await addAndRule(wrapper);

      const column = await wrapper.findComponent(QueryFilterRuleColumn);
      const currentColumn = column.vm.$props.options.find(
        (col) => col.name === 'cultivars.id',
      );
      await column.setValue(currentColumn);
      const operator = await wrapper.findComponent(QueryFilterRuleOperator);
      await operator.setValue(
        new FilterRuleOperator({
          value: FilterOperatorValue.Greater,
        }),
      );
      const term = await wrapper.findComponent(QueryFilterRuleTerm);
      await term.setValue(new FilterRuleTerm({ value: '1' }));

      await flushPromises();

      await vi.waitUntil(
        // because we set the value with watch in the component
        () => wrapper.get('[data-test="variables"]').text().length > 2,
      );

      const queryIs = normalizeString(
        wrapper.get('[data-test="query"]').text(),
      );
      const variablesAre = normalizeString(
        wrapper.get('[data-test="variables"]').text(),
      );

      const queryShouldBe = normalizeString(`
query CultivarsFilterResults( $v0: Int! ) {
  cultivars(where: { _and: [ { id: { _gt: $v0 } } ] }) {
    id
    name
    common_name
    acronym
    breeder
  }
}

fragment AttributeFragment on attributions_view {
  id
  integer_value
  float_value
  text_value
  boolean_value
  date_value
  tree_id
  cultivar_id
  lot_id
  data_type
}`);
      const variablesShouldBe = normalizeString('{"v0": 1 }');

      expect(queryIs).toBe(queryShouldBe);
      expect(variablesAre).toBe(variablesShouldBe);
    });
  });
});
