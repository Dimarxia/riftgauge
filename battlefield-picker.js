// battlefield-picker.js
// Battlefield selection — cosmetic only. Has no effect on the VP win target.

import { BATTLEFIELDS } from './data/battlefields.js';
import { PickerModal } from './picker-modal.js';

const SET_LABELS = { ogn: 'Origins', sfd: 'Spiritforged', unl: 'Unleashed' };

function renderBattlefieldRow([, name, set], isSelected) {
  const row = document.createElement('div');
  row.className = 'bf-row' + (isSelected ? ' selected' : '');
  row.innerHTML = `
    <span class="bf-name">${name}</span>
    <span class="bf-set">${SET_LABELS[set]}</span>
  `;
  return row;
}

function matchesBattlefieldQuery([, name, set], q) {
  return name.toLowerCase().includes(q) || SET_LABELS[set].toLowerCase().includes(q);
}

export class BattlefieldPicker {
  /**
   * @param {Object} callbacks
   * @param {(playerIndex: number, battlefieldId: string) => void} callbacks.onSelect
   * @param {(playerIndex: number) => void} callbacks.onClear
   */
  constructor({ onSelect, onClear }) {
    this.playerIndex = null;

    this.modal = new PickerModal({
      modalId: 'battlefield-modal',
      searchId: 'bf-search',
      listId: 'bf-list',
      clearId: 'bf-modal-clear-btn',
      closeId: 'bf-modal-close-btn',
      renderRow: renderBattlefieldRow,
      filterFn: matchesBattlefieldQuery,
      onSelect: (bf) => {
        onSelect(this.playerIndex, bf[0]);
        this.modal.close();
      },
      onClear: () => onClear(this.playerIndex),
      emptyMessage: 'No battlefields found',
    });
  }
