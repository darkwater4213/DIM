import { LoadoutParameters, UpgradeSpendTier } from '@destinyitemmanager/dim-api-types';
import { t } from 'app/i18next-t';
import { DimItem, PluggableInventoryItemDefinition } from 'app/inventory/item-types';
import { Loadout } from 'app/loadout-drawer/loadout-types';
import raidModPlugCategoryHashes from 'data/d2/raid-mod-plug-category-hashes.json';
import _ from 'lodash';
import React, { Dispatch, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { List, WindowScroller } from 'react-virtualized';
import { DimStore } from '../../inventory/store-types';
import { LoadoutBuilderAction } from '../loadout-builder-reducer';
import { ArmorSet, PinnedItems } from '../types';
import GeneratedSet from './GeneratedSet';
import styles from './GeneratedSets.m.scss';

/** Taller item groups have either the swap icon under the item, an exotic perk, or a raid mod socket. */
function hasExoticPerkRaidModOrSwapIcon(items: DimItem[]) {
  return (
    items.length > 1 ||
    items.some(
      (item) =>
        item.isExotic ||
        item.sockets?.allSockets.some(
          ({ plugged }) =>
            plugged && raidModPlugCategoryHashes.includes(plugged.plugDef.plug.plugCategoryHash)
        )
    )
  );
}

/**
 * Gets the set used to measure how high a row can be. It also returns a recalcTrigger that is
 * intended to trigger a recalculation when the value changes.
 *
 * It figures out the tallest row by looking at items with exotic perks and swap icons.
 * Exotic perks add another row to the mod icons and the swap icon sits below the item image.
 * The height they add is roughly equivalent so we treat both conditions equally.
 *
 * This algorithm is built from the portrait mobile layout but will work for any other layout
 * as well. Landscape ipad has two rows, desktop can be 1, 2, or 3 rows depending on browser
 * width.
 */
function getMeasureSet(sets: readonly ArmorSet[]): [ArmorSet | undefined, number] {
  // In phone portrait we have 2 columns and 3 rows of items.
  let recalcTrigger = 0;
  const measureSet = _.maxBy(sets, (set) => {
    let countWithExoticPerkOrSwapIcon = 0;
    // So we look on those rows for items with the swap icon or an exotic perk.
    for (const indexes of [[0, 1], [2, 3], [4]]) {
      if (indexes.some((index) => hasExoticPerkRaidModOrSwapIcon(set.armor[index]))) {
        countWithExoticPerkOrSwapIcon++;
      }
    }

    if (countWithExoticPerkOrSwapIcon > recalcTrigger) {
      recalcTrigger = countWithExoticPerkOrSwapIcon;
    }

    return countWithExoticPerkOrSwapIcon;
  });

  return [measureSet, recalcTrigger];
}

interface Props {
  selectedStore: DimStore;
  sets: readonly ArmorSet[];
  lockedMods: PluggableInventoryItemDefinition[];
  pinnedItems: PinnedItems;
  statOrder: number[];
  enabledStats: Set<number>;
  loadouts: Loadout[];
  lbDispatch: Dispatch<LoadoutBuilderAction>;
  params: LoadoutParameters;
  halfTierMods: PluggableInventoryItemDefinition[];
  upgradeSpendTier: UpgradeSpendTier;
  lockItemEnergyType: boolean;
}

/**
 * Renders the entire list of generated stat mixes, one per mix.
 */
export default function GeneratedSets({
  lockedMods,
  pinnedItems,
  selectedStore,
  sets,
  statOrder,
  enabledStats,
  loadouts,
  lbDispatch,
  params,
  halfTierMods,
  upgradeSpendTier,
  lockItemEnergyType,
}: Props) {
  const windowScroller = useRef<WindowScroller>(null);
  const [{ rowHeight, rowWidth }, setRowSize] = useState<{
    rowHeight: number;
    rowWidth: number;
  }>({ rowHeight: 0, rowWidth: 0 });

  // eslint-disable-next-line prefer-const
  let [measureSet, recalcTrigger] = useMemo(() => getMeasureSet(sets), [sets]);

  useEffect(() => {
    setRowSize({ rowHeight: 0, rowWidth: 0 });
  }, [recalcTrigger]);

  useEffect(() => {
    const handleWindowResize = _.throttle(() => setRowSize({ rowHeight: 0, rowWidth: 0 }), 300, {
      leading: false,
      trailing: true,
    });

    window.addEventListener('resize', handleWindowResize);
    return () => window.removeEventListener('resize', handleWindowResize);
  }, [setRowSize]);

  useEffect(() => {
    windowScroller.current?.updatePosition();
  });

  const setRowHeight = useCallback(
    (element: HTMLDivElement | null) => {
      if (element && !rowHeight) {
        setTimeout(
          () =>
            setRowSize({
              rowHeight: element.clientHeight,
              rowWidth: element.clientWidth,
            }),
          0
        );
      }
    },
    [rowHeight]
  );

  // If we already have row height we dont want to render the measure set.
  if (rowHeight !== 0) {
    measureSet = undefined;
  }

  return (
    <div className={styles.sets}>
      {measureSet ? (
        <GeneratedSet
          ref={setRowHeight}
          style={{}}
          set={measureSet}
          selectedStore={selectedStore}
          lockedMods={lockedMods}
          pinnedItems={pinnedItems}
          lbDispatch={lbDispatch}
          statOrder={statOrder}
          enabledStats={enabledStats}
          loadouts={loadouts}
          params={params}
          halfTierMods={halfTierMods}
          upgradeSpendTier={upgradeSpendTier}
          lockItemEnergyType={lockItemEnergyType}
        />
      ) : sets.length > 0 ? (
        <WindowScroller ref={windowScroller}>
          {({ height, isScrolling, onChildScroll, scrollTop }) => (
            <List
              autoHeight={true}
              height={height}
              width={rowWidth}
              isScrolling={isScrolling}
              onScroll={onChildScroll}
              overscanRowCount={2}
              rowCount={sets.length}
              rowHeight={rowHeight || 160}
              rowRenderer={({ index, key, style }) => (
                <GeneratedSet
                  key={key}
                  style={style}
                  set={sets[index]}
                  selectedStore={selectedStore}
                  lockedMods={lockedMods}
                  pinnedItems={pinnedItems}
                  lbDispatch={lbDispatch}
                  statOrder={statOrder}
                  enabledStats={enabledStats}
                  loadouts={loadouts}
                  params={params}
                  halfTierMods={halfTierMods}
                  upgradeSpendTier={upgradeSpendTier}
                  lockItemEnergyType={lockItemEnergyType}
                />
              )}
              scrollTop={scrollTop}
            />
          )}
        </WindowScroller>
      ) : (
        <h3>{t('LoadoutBuilder.NoBuildsFoundWithReasons')}</h3>
      )}
    </div>
  );
}
