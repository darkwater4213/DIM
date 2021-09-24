import { currentAccountSelector } from 'app/accounts/selectors';
import { mergeCollectibles } from 'app/inventory/d2-stores';
import {
  bucketsSelector,
  profileResponseSelector,
  sortedStoresSelector,
} from 'app/inventory/selectors';
import { getCurrentStore } from 'app/inventory/stores-helpers';
import { d2ManifestSelector } from 'app/manifest/selectors';
import { RootState } from 'app/store/types';
import { emptyArray, emptyObject } from 'app/utils/empty';
import { createSelector } from 'reselect';
import { D2VendorGroup, toVendorGroups } from './d2-vendors';

export const vendorsByCharacterSelector = (state: RootState) => state.vendors.vendorsByCharacter;

export const mergedCollectiblesSelector = createSelector(
  profileResponseSelector,
  (profileResponse) =>
    profileResponse
      ? mergeCollectibles(
          profileResponse.profileCollectibles,
          profileResponse.characterCollectibles
        )
      : emptyObject<ReturnType<typeof mergeCollectibles>>()
);

/**
 * returns a character's vendors and their sale items
 */
export const vendorGroupsForCharacterSelector = createSelector(
  d2ManifestSelector,
  vendorsByCharacterSelector,
  mergedCollectiblesSelector,
  bucketsSelector,
  currentAccountSelector,
  // get character ID from props not state
  (state: any, characterId: string | undefined) =>
    characterId || getCurrentStore(sortedStoresSelector(state))?.id,
  (defs, vendors, mergedCollectibles, buckets, currentAccount, selectedStoreId) => {
    const vendorData = selectedStoreId ? vendors[selectedStoreId] : undefined;
    const vendorsResponse = vendorData?.vendorsResponse;

    return vendorsResponse && defs && buckets && currentAccount && selectedStoreId
      ? toVendorGroups(
          vendorsResponse,
          defs,
          buckets,
          currentAccount,
          selectedStoreId,
          mergedCollectibles
        )
      : emptyArray<D2VendorGroup>();
  }
);
