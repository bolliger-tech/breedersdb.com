import { graphql, type FragmentOf } from 'src/graphql';

export type AnalyzeFiltersFragment = FragmentOf<typeof analyzeFiltersFragment>;

export const analyzeFiltersFragment = graphql(`
  fragment analyzeFiltersFragment on analyze_filters @_unmask {
    id
    name
    note
    base_table
    base_filter
    attribution_filter
    created
    modified
  }
`);
