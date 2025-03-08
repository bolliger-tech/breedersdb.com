import type { PlantFragmentWithSegments } from 'src/components/Plant/plantFragment';
import type { PlantGroupFragment } from 'src/components/PlantGroup/plantGroupFragment';
import type { CultivarFragment } from 'src/components/Cultivar/cultivarFragment';
import type { LotFragment } from 'src/components/Lot/lotFragment';
import type { AttributableEntities } from 'src/components/Attribution/attributableEntities';

// WORAROUND:
// defining these types in a dedicated file avoids the following eslint error:
// > 'error' type that acts as 'any' and overrides all other types in this union
// > type  @typescript-eslint/no-redundant-type-constituents
// for EntityPreviewEntityMaybeNoData type. Look at the diff of commit, which
// first included this file of this to see the error.

interface EntityPlant {
  data: PlantFragmentWithSegments;
  type: AttributableEntities.Plant;
}

interface EntityPlantGroup {
  data: PlantGroupFragment;
  type: AttributableEntities.PlantGroup;
}

interface EntityCultivar {
  data: CultivarFragment;
  type: AttributableEntities.Cultivar;
}

interface EntityLot {
  data: LotFragment;
  type: AttributableEntities.Lot;
}

export type EntityPreviewEntity =
  | EntityPlant
  | EntityPlantGroup
  | EntityCultivar
  | EntityLot;

export type EntityPreviewEntityMaybeNoData =
  | EntityPreviewEntity
  | {
      data: null;
      type: AttributableEntities;
    };
