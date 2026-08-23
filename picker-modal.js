// picker-modal.js
// Generic search / select / clear modal shared by LegendPicker and
// BattlefieldPicker. Callers supply the DOM ids to wire up plus row
// rendering, filtering, select, and clear behavior.

export class PickerModal {
  /**
   * @param {Object} opts
   * @param {string} opts.modalId
   * @param {string} opts.searchId
   * @param {string} opts.listId
   * @param {string} opts.clearId
   * @param {string} opts.closeId
   * @param {(item: any, isSelected: boolean) => HTMLElement} opts.renderRow
   * @param {(item: any, query: string) => boolean} opts.filterFn
   * @param {(item: any) => void} opts.onSelect
   * @param {() => void} opts.onClear
   * @param {string} opts.emptyMessage
   */
  constructor({ modalId, searchId, listId, clearId, closeId, renderRow, filterFn, onSelect, onClear, emptyMessage }) {
    this.modalEl = document.getElementById(modalId);
    this.searchEl = document.getElementById(searchId);
    this.listEl = document.getElementById(listId);
    this.renderRow = renderRow;
    this.filterFn = filterFn;
    this.onSelect = onSelect;
    this.onClear = onClear;
    this.emptyMessage = emptyMessage;

    this.items = [];
    this.selectedId = null;
    this.context = null;

    this.searchEl.addEventListener('input', () => this._render());
    document.getElementById(clearId).addEventListener('click', () => this.onClear());
    document.getElementById(closeId).addEventListener('click', () => this.close());

    this.modalEl.addEventListener('click', (e) => {
      if (e.target === e.currentTarget) this.close();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.modalEl.classList.contains('open')) this.close();
    });
  }

  open({ items, selectedId = null, context = null }) {
    this.items = items;
    this.selectedId = selectedId;
    this.context = context;
    this.searchEl.value = '';
    this._render();
    this.modalEl.classList.add('open');
    // Only auto-focus the search box on devices with a physical keyboard/mouse.
    // On touch screens focusing immediately pops the on-screen keyboard over
    // the list, hiding the options the user opened the modal to tap.
    if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
      setTimeout(() => this.searchEl.focus(), 50);
    }
  }

  close() {
    this.modalEl.classList.remove('open');
  }

  setSelectedId(id) {
    this.selectedId = id;
    this._render();
  }

  _render() {
    const q = this.searchEl.value.toLowerCase().trim();
    const filtered = q ? this.items.filter((item) => this.filterFn(item, q)) : this.items;

    this.listEl.textContent = '';

    // Batch rows into a fragment — one DOM insertion instead of one per row.
    const frag = document.createDocumentFragment();
    filtered.forEach((item) => {
      const row = this.renderRow(item, item[0] === this.selectedId);
      row.addEventListener('click', () => this.onSelect(item));
      frag.appendChild(row);
    });
    this.listEl.appendChild(frag);

    if (filtered.length === 0) {
      const empty = document.createElement('div');
      empty.style.cssText = 'font-family:"Crimson Pro",serif; font-style:italic; color:rgba(255,255,255,0.25); font-size:0.82rem; padding:12px; text-align:center;';
      empty.textContent = this.emptyMessage;
      this.listEl.appendChild(empty);
    }
  }
}
