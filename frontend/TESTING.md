# Testing

The frontend is extensively tested during development, only selected parts are
subject to additional automated or manual testing.

While automated tests focus on unit tests, the manual test plan consists of
end-to-end system tests.

## Automated

Based on [vitest](https://vitest.dev/).

```bash
yarn test:unit
```

Bun is currently not supported. Use node instead.

The tests are co-located with the components and have the same name as the
component with the `.vitest.test.ts` extension.

## Manual

### Cultivars > Analyze

The primary goal is to test the correctness of the `analyse` module. We test it
on `cultivars`, so we can also verify that the plants and groups attributions
are included.

The tests must be executed in order, as the preconditions depend on each other.

#### Pre-conditions

- New crossing with name `test`
- New lot: `test.00A`
- New cultivar: `test.00A.001`
- New group:
  - `test.00A.001.A`
  - `test.00A.001.B`
- New plant:
  - `99999999` with cultivar `test.00A.001.A`
  - `99999998` with cultivar `test.00A.001.A`
- New attribute:
  - `test boolean`
  - `test date`
  - `test decimal`
  - `test integer`
  - `test photo`
  - `test rating`
  - `test text`
- New form: `test` with the attributes created above
- `Cultivars` > `Add attribute` > Form: `test` > Cultivar: `test.00A.001`
  - `test boolean`: `false`
  - `test date`: `2025-01-01`
  - `test decimal`: `0.1`
  - `test integer`: `1`
  - `test photo`: `test.jpg`
  - `test rating`: `9`
  - `test text`: `a unique text: d63ec1988de6b170f41ed3d5869a7d2e`

#### Filter cultivars by name: contains only entities with matching name

**Row filter**

| column            | operator | value          |
| ----------------- | -------- | -------------- |
| `cultivar > name` | `euqals` | `test.00A.001` |

**Column filter**

| column | operator | value |
| ------ | -------- | ----- |

**Expected results**

ONLY the cultivar `test.00A.001` is displayed

#### Filter cultivars by attribution (excluding): contains only entities with matching attribution

**Row filter**

| column                  | operator   | value                              | without attributinos |
| ----------------------- | ---------- | ---------------------------------- | -------------------- |
| `Attribute > test text` | `contains` | `d63ec1988de6b170f41ed3d5869a7d2e` | `false`              |

**Column filter**

| column | operator | value |
| ------ | -------- | ----- |

**Expected results**

ONLY the cultivar `test.00A.001` is displayed

#### Filter cultivars by attribution (non-excluding): contains all entities

**Row filter**

| column                  | operator   | value                              | without attributinos |
| ----------------------- | ---------- | ---------------------------------- | -------------------- |
| `Attribute > test text` | `contains` | `d63ec1988de6b170f41ed3d5869a7d2e` | `true`               |

**Column filter**

| column | operator | value |
| ------ | -------- | ----- |

**Expected results**

all cultivars are displayed

#### Attributions: present and correct

**Row filter**

| column            | operator | value          |
| ----------------- | -------- | -------------- |
| `cultivar > name` | `euqals` | `test.00A.001` |

**Column filter**

| column | operator | value |
| ------ | -------- | ----- |

**Expected results**

- `test boolean`: `false`
- `test date`: `2025-01-01`
- `test decimal`: `0.1`
- `test integer`: `1`
- `test photo`: `test.jpg`
- `test rating`: `9`
- `test text`: `a unique text: d63ec1988de6b170f41ed3d5869a7d2e`

#### Attributions: are filtered correctly (present)

**Row filter**

| column            | operator | value          |
| ----------------- | -------- | -------------- |
| `cultivar > name` | `euqals` | `test.00A.001` |

**Column filter**

| column               | operator | value                          |
| -------------------- | -------- | ------------------------------ |
| `Attribution > Date` | `equals` | creation date of preconditions |

**Expected results**

- `test boolean`: `false`
- `test date`: `2025-01-01`
- `test decimal`: `0.1`
- `test integer`: `1`
- `test photo`: `test.jpg`
- `test rating`: `9`
- `test text`: `a unique text: d63ec1988de6b170f41ed3d5869a7d2e`

#### Attributions: are filtered correctly (absent)

**Row filter**

| column            | operator | value          |
| ----------------- | -------- | -------------- |
| `cultivar > name` | `euqals` | `test.00A.001` |

**Column filter**

| column               | operator     | value                          |
| -------------------- | ------------ | ------------------------------ |
| `Attribution > Date` | `not equals` | creation date of preconditions |

**Expected results**

no attributions are displayed

#### Pre-conditions 2

- `Cultivars` > `Add attribute` > Form: `test` > Cultivar: `test.00A.001`
  - `test boolean`: `true`
  - `test date`: `2025-01-31`
  - `test decimal`: `0.9`
  - `test integer`: `9`
  - `test photo`: `test2.jpg`
  - `test rating`: `1`
  - `test text`: `a second note`

#### Attributions: aggregations are correct

**Row filter**

| column            | operator | value          |
| ----------------- | -------- | -------------- |
| `cultivar > name` | `euqals` | `test.00A.001` |

**Column filter**

| column | operator | value |
| ------ | -------- | ----- |

**Expected results**

- `test date count`: `2`
- `test date max`: `2025-01-31`
- `test date min`: `2025-01-01`
- `test date mean`: `2025-01-16`
- `test date median`: `2025-01-16`
- `test date SD`: `15 days`

- `test decimal count`: `2`
- `test decimal max`: `0.9`
- `test decimal min`: `0.1`
- `test decimal mean`: `0.5`
- `test decimal median`: `0.5`
- `test decimal SD`: `0.4`

- `test integer count`: `2`
- `test integer max`: `9`
- `test integer min`: `1`
- `test integer mean`: `5`
- `test integer median`: `5`
- `test integer SD`: `4`

- `test rating count`: `9`
- `test rating max`: `9`
- `test rating min`: `5`
- `test rating mean`: `7`
- `test rating median`: `7`
- `test rating SD`: `2`

#### Pre-conditions 3

- `Groups` > `Add attribute` > Form: `test` > Group: `test.00A.001.A`

  - `test boolean`: `true`
  - `test date`: `2025-01-02`
  - `test decimal`: `0.2`
  - `test integer`: `2`
  - `test photo`: `test3.jpg`
  - `test rating`: `2`
  - `test text`: `a third note`

- `Plants` > `Add attribute` > Form: `test` > Plant: `99999999`

  - `test boolean`: `true`
  - `test date`: `2025-01-05`
  - `test decimal`: `0.5`
  - `test integer`: `5`
  - `test photo`: `test5.jpg`
  - `test rating`: `5`
  - `test text`: `a plant note`

- `Plants` > `Add attribute` > Form: `test` > Plant: `99999998`
  - `test boolean`: `true`
  - `test date`: `2025-01-06`
  - `test decimal`: `0.6`
  - `test integer`: `6`
  - `test photo`: `test6.jpg`
  - `test rating`: `6`
  - `test text`: `an other plant note`

#### Group and plant attributions: present and correct

**Row filter**

| column            | operator | value          |
| ----------------- | -------- | -------------- |
| `cultivar > name` | `euqals` | `test.00A.001` |

**Column filter**

| column | operator | value |
| ------ | -------- | ----- |

**Expected results**

for every attribute, all 5 values are present and associated with the correct
entity.
