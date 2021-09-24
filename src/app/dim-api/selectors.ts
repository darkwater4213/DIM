import { defaultLoadoutParameters, DestinyVersion } from '@destinyitemmanager/dim-api-types';
import { DestinyAccount } from 'app/accounts/destiny-account';
import { currentAccountSelector, destinyVersionSelector } from 'app/accounts/selectors';
import { RootState } from 'app/store/types';
import { createSelector } from 'reselect';

export function makeProfileKeyFromAccount(account: DestinyAccount) {
  return makeProfileKey(account.membershipId, account.destinyVersion);
}
export function makeProfileKey(platformMembershipId: string, destinyVersion: DestinyVersion) {
  return `${platformMembershipId}-d${destinyVersion}`;
}

export const settingsSelector = (state: RootState) => state.dimApi.settings;

/**
 * The last used Loadout Optimizer settings, with defaults filled in
 */
export const savedLoadoutParametersSelector = createSelector(
  (state: RootState) => settingsSelector(state).loParameters,
  (loParams) => ({ ...defaultLoadoutParameters, ...loParams })
);

export const languageSelector = (state: RootState) => settingsSelector(state).language;

export const collapsedSelector =
  (sectionId: string) =>
  (state: RootState): boolean | undefined =>
    settingsSelector(state).collapsedSections[sectionId];

export const apiPermissionGrantedSelector = (state: RootState) =>
  state.dimApi.apiPermissionGranted === true;

/**
 * Return saved API data for the currently active profile (account).
 */
export const currentProfileSelector = createSelector(
  currentAccountSelector,
  (state: RootState) => state.dimApi.profiles,
  (currentAccount, profiles) =>
    currentAccount ? profiles[makeProfileKeyFromAccount(currentAccount)] : undefined
);

/**
 * Returns all recent/saved searches.
 *
 * TODO: Sort/trim this list
 */
export const recentSearchesSelector = (state: RootState) =>
  state.dimApi.searches[destinyVersionSelector(state)];

export const trackedTriumphsSelector = createSelector(
  currentProfileSelector,
  (profile) => profile?.triumphs || []
);
