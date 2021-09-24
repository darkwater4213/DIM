import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import {
  DestinyInventoryItemDefinition,
  DestinyItemComponent,
  DestinyItemObjectivesComponent,
  DestinyObjectiveDefinition,
  DestinyObjectiveProgress,
  DestinyUnlockValueUIStyle,
} from 'bungie-api-ts/destiny2';

/**
 * These are the utilities that deal with figuring out Objectives for items.
 *
 * This is called from within d2-item-factory.service.ts
 */

/**
 * Build regular item-level objectives.
 */
export function buildObjectives(
  item: DestinyItemComponent,
  itemDef: DestinyInventoryItemDefinition,
  objectivesMap: { [key: string]: DestinyItemObjectivesComponent } | undefined,
  defs: D2ManifestDefinitions,
  uninstancedItemObjectives?: {
    [key: number]: DestinyObjectiveProgress[];
  }
): DestinyObjectiveProgress[] | null {
  const objectives =
    item.itemInstanceId && objectivesMap?.[item.itemInstanceId]
      ? objectivesMap[item.itemInstanceId].objectives
      : uninstancedItemObjectives
      ? uninstancedItemObjectives[item.itemHash]
      : [];

  if (!objectives || !objectives.length) {
    // Hmm, it should have objectives
    if (itemDef.objectives) {
      return itemDef.objectives.objectiveHashes.map((o) => ({
        objectiveHash: o,
        complete: false,
        visible: true,
        completionValue: defs.Objective.get(o).completionValue,
      }));
    }

    return null;
  }

  // TODO: we could make a tooltip with the location + activities for each objective (and maybe offer a ghost?)
  return objectives.filter((o) => o.visible && defs.Objective.get(o.objectiveHash));
}

export function isBooleanObjective(
  objectiveDef: DestinyObjectiveDefinition,
  completionValue: number
) {
  return (
    objectiveDef.valueStyle === DestinyUnlockValueUIStyle.Checkbox ||
    (completionValue === 1 &&
      (!objectiveDef.allowOvercompletion || !objectiveDef.showValueOnComplete))
  );
}
