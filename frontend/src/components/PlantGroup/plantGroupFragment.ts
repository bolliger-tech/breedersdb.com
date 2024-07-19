import { graphql } from 'src/graphql';

export const plantGroupSegmentsFragment = graphql(`
  fragment plantGroupSegmentsFragment on plant_groups @_unmask {
    id
    name_segment
    name_override
    display_name
    cultivar {
      id
      name_segment
      name_override
      display_name
      lot {
        id
        name_segment
        name_override
        display_name
        crossing {
          id
          name
        }
      }
    }
  }
`);
