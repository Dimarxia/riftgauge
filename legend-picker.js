// legend-picker.js
// Legend selection flow: search/select a legend, then choose a Chosen
// Champion unit for that legend, then confirm both together.

import { LEGENDS, legendById } from './data/legends.js';
import { CHAMPIONS } from './data/champions.js';
import { DOMAINS } from './data/domains.js';
import { PickerModal } from './picker-modal.js';

function domainBadgeHtml(domainKey) {
  const d = DOMAINS[domainKey];
  return `<span class="domain-badge" style="background:${d.colorA}88;border-color:${d.colorB}99;color:${d.colorB}">${d.label}</span>`;
}

function renderLegendRow([id, name, title, d1id, d2id], isSelected) {
  const row = document.createElement('div');
  row.className = 'legend-row' + (isSelected ? ' selected' : '');
  row.innerHTML = `
    <span class="legend-name">${name}</span>
    <span class="legend-title">${title}</span>
    <span class="legend-domain-badges">${domainBadgeHtml(d1id)}${domainBadgeHtml(d2id)}</span>
  `;
  return row;
}

function matchesLegendQuery([, name, title, d1id, d2id], q) {
  return name.toLowerCase().includes(q)
    || title.toLowerCase().includes(q)
    || DOMAINS[d1id].label.toLowerCase().includes(q)
    || DOMAINS[d2id].label.toLowerCase().includes(q);
}

export class LegendPicker {
  /**
   * @param {Object} callbacks
   * @param {(playerIndex: number, legendId: string, champion: string) => void} callbacks.onConfirm
   * @param {(playerIndex: number) => void} callbacks.onClear
   */
  constructor({ onConfirm, onClear }) {
    this.onConfirm = onConfirm;
    this.onClearCallback = onClear;
    this.playerIndex = null;
    this.pendingLegendId = null;

    this.modal = new PickerModal({
      modalId: 'legend-modal',
      searchId: 'legend-search',
      listId: 'legend-list',
      clearId: 'modal-clear-btn',
      closeId: 'legend-modal-close',
      renderRow: (legend) => renderLegendRow(legend, legend[0] === this.pendingLegendId),
      filterFn: matchesLegendQuery,
      onSelect: (legend) => this._selectLegend(legend[0]),
      onClear: () => {
        this.pendingLegendId = null;
        this.onClearCallback(this.playerIndex);
        this._hideChampionStep();
      },
      emptyMessage: 'No legends found',
    });

    document.getElementById('modal-confirm-btn')
      .addEventListener('click', () => this._confirm());
  }

  open(playerIndex, currentLegendId) {
    this.playerIndex = playerIndex;
    this.pendingLegendId = currentLegendId;
    this._hideChampionStep();
    this.modal.open({ items: LEGENDS, selectedId: currentLegendId, context: playerIndex });
    if (currentLegendId) this._selectLegend(currentLegendId);
  }

  _selectLegend(legendId) {
    this.pendingLegendId = legendId;
    const [, name] = legendById[legendId];

    const select = document.getElementById('modal-champion-input');
    select.innerHTML = '';
    (CHAMPIONS[legendId] || []).forEach((c) => {
      const opt = document.createElement('option');
      opt.value = `${name} — ${c}`;
      opt.textContent = opt.value;
      select.appendChild(opt);
    });

    document.getElementById('modal-champion-row').classList.add('visible');
    this.modal.setSelectedId(legendId);
  }

  _confirm() {
    if (!this.pendingLegendId) return; // no legend selected yet — nothing to confirm
    const champion = document.getElementById('modal-champion-input').value || '';
    this.onConfirm(this.playerIndex, this.pendingLegendId, champion);
    this.modal.close();
  }

  _hideChampionStep() {
    document.getElementById('modal-champion-row').classList.remove('visible');
  }
}
