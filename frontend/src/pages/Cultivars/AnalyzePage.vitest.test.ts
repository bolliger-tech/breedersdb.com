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
import {
  FilterNode,
  FilterConjunction,
  BaseTable,
} from 'src/components/Analyze/Filter/filterNode';
import QueryFilterRuleColumn from 'components/Analyze/Filter/AnalyzeFilterRuleColumn.vue';
import QueryFilterRuleOperator from 'components/Analyze/Filter/AnalyzeFilterRuleOperator.vue';
import QueryFilterRuleTerm from 'components/Analyze/Filter/AnalyzeFilterRuleTerm.vue';
import {
  FilterRuleOperator,
  FilterOperatorValue,
} from 'src/components/Analyze/Filter/filterRuleOperator';
import { FilterRuleTerm } from 'src/components/Analyze/Filter/filterRuleTerm';
import { useRoute } from 'vue-router';
import { reactive } from 'vue';
import type { FilterRuleColumn } from 'src/components/Analyze/Filter/filterRuleColumn';

vi.mock('vue-router');

addQuasarPlugins();

const queryMock: MockQuery = ({ query }) => {
  const queryName = (query.definitions[0] as OperationDefinitionNode).name
    ?.value;
  if ('AnalyzeFilters' === queryName) {
    return urqlResp({
      analyze_filters_by_pk: {
        id: 999,
        name: 'Query 1',
        note: 'Some description',
        base_table: 'CULTIVARS',
        base_filter: JSON.stringify(
          FilterNode.FilterRoot({
            childrensConjunction: FilterConjunction.And,
            baseTable: BaseTable.Cultivars,
          }),
        ),
        attribution_filter: null,
        visible_columns: [
          'cultivars.id',
          'cultivars.display_name',
          'cultivars.full_name',
          'cultivars.name_override',
          'cultivars.acronym',
        ],
        created: '2024-06-06T11:43:12Z',
        modified: '2024-06-06T11:43:12Z',
      },
    })();
  }
  if ('CultivarsFilterResults' === queryName) {
    return urqlResp({
      cultivars: [
        { id: 1, name: 'cultivar1' },
        { id: 2, name: 'cultivar2' },
      ],
      cultivars_aggregate: { aggregate: { count: 2 } },
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

const useRouteMock = reactive({
  query: {},
  matched: [],
  fullPath: '',
  hash: '',
  params: {},
  redirectedFrom: undefined,
  name: '',
  meta: {},
  path: '',
});

function prepareForRegex(str: string) {
  return (
    str
      // escape all special characters
      .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      // add whitespace flexibility
      .replace(/\s+/g, ' ')
      .replace(/ /g, '\\s+')
      .trim()
  );
}

describe('AnalyzePage', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.mocked(useRoute).mockReturnValue(useRouteMock);
  });

  describe('filter ui basics', () => {
    it('should mount without filter', async () => {
      const wrapper = await mountAsync(AnalyzePage, {
        urqlMock: {
          executeQuery: queryMock,
          executeMutation: mutationMock,
        },
        props: { analyzeId: 'new' },
      });

      expect(
        wrapper
          .find('[data-test="analyze-filter-root-node__filter-placeholder"]')
          .exists(),
      ).toBe(true);
      expect(wrapper.find('[data-test="analyze-filter-rule"]').exists()).toBe(
        false,
      );
    });

    it('should add filter rule', async () => {
      const wrapper = await mountAsync(AnalyzePage, {
        urqlMock: {
          executeQuery: queryMock,
          executeMutation: mutationMock,
        },
        props: { analyzeId: 'new' },
      });

      // click + button
      await wrapper
        .getComponent('[data-test="analyze-filter-node__action-btn"]')
        .get('a')
        .trigger('click');

      // click add rule
      await wrapper
        .getComponent('[data-test="analyze-filter-node__action-btn-and"]')
        .get('a')
        .trigger('click');

      await flushPromises();

      expect(
        wrapper
          .find('[data-test="analyze-filter-root-node__dummy-filter"]')
          .exists(),
      ).toBe(false);

      expect(wrapper.find('[data-test="analyze-filter-rule"]').exists()).toBe(
        true,
      );
    });
  });

  describe('query logic', () => {
    const addAndRule = async (wrapper: AsyncComponentWrapper) => {
      // click + button
      await wrapper
        .getComponent('[data-test="analyze-filter-node__action-btn"]')
        .get('a')
        .trigger('click');

      // click add rule
      await wrapper
        .getComponent('[data-test="analyze-filter-node__action-btn-and"]')
        .get('a')
        .trigger('click');
    };

    it('should create correct cultivar id query', async () => {
      const wrapper = await mountAsync(AnalyzePage, {
        urqlMock: {
          executeQuery: queryMock,
          executeMutation: mutationMock,
        },
        props: { analyzeId: 999 },
      });

      await addAndRule(wrapper);

      const column = await wrapper.findComponent(QueryFilterRuleColumn);
      const currentColumn = column.vm.$props.options.find(
        (col: FilterRuleColumn) => col.name === 'cultivars.id',
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

      const queryIs = wrapper.get('[data-test="query"]').text();
      const variablesAre = wrapper.get('[data-test="variables"]').text();

      const queryShouldBe = new RegExp(
        prepareForRegex(
          `query CultivarsFilterResults( $v000: Int! ) {
    cultivars(where: { _and: [ { id: { _gt: $v000 } } ] }, limit: 100, offset: 0, order_by: { id: asc }) {
      id
      display_name
      full_name
      name_override
      acronym
    }

    cultivars_aggregate(where: { _and: [ { id: { _gt: $v000 } } ] }) {
      aggregate {
        count
      }
    }
  }

  fragment AttributionFragment on attributions_view {
    id
    integer_value
    float_value
    text_value
    boolean_value
    date_value
    plant_id
    cultivar_id
    lot_id
    data_type
  }`,
        ).replaceAll('$v000', '$v\\d+'),
      );
      const variablesShouldBe = new RegExp(
        prepareForRegex('{ "v000": 1 }').replace('v000', 'v\\d+'),
      );

      expect(queryIs).toMatch(queryShouldBe);
      expect(variablesAre).toMatch(variablesShouldBe);
    });
  });
});
