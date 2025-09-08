import generateRandomFields from './utils/generateRandomFields.js';
import generateTestableFields from './utils/generateTestableFields.js';
import { getFavs, toggleFav, isFav } from './utils/favsStorage.js';

const defaultConfig = {
  DEFAULT_PIP_LENGTH: 20,
  DEFAULT_FORM_LENGTH: 10,
  DEFAULT_FAV_FIELDS_COOKIE: 'favFieldsList',
  DEFAULT_PIPS_PER_PAGE: 24,
  DEFAULT_PIP_COLS_PER_PAGE: 3,
};

function getCookie(cname, create) {
  // Deprecated cookie handling; now uses localStorage via favsStorage
  const list = getFavs();
  if (!list.length && !create) {
    console.error(`Cookie not found -- ${cname}`);
  }
  return list;
}

function setCookie(cname, cvalue, exdays) {
  // Deprecated: managed by favsStorage now
  return;
}

function cookieState(fieldId, cookie) {
  let cvalue = getFavs();
  let fieldInCookie = fieldId && cvalue ? cvalue.includes(fieldId) : false;
  return [cvalue, !!fieldInCookie];
}

function findAvailableList(lists, maxItems) {
  // Choose the list with the fewest children that still has capacity
  let candidate = null;
  let minLen = Infinity;
  for (let i = 0; i < lists.length; i++) {
    const len = lists[i].children.length;
    if (len < maxItems && len < minLen) {
      candidate = lists[i];
      minLen = len;
    }
  }
  // If none have capacity, signal by returning null so caller can create a new list
  return candidate || null;
}

// For fields, fill the first column to capacity before moving to the next
function findSequentialList(lists, maxItems) {
  for (let i = 0; i < lists.length; i++) {
    if (lists[i].children.length < maxItems) return lists[i];
  }
  return null;
}

class Pip {
  constructor(field) {
    this.field = field;
    this.fieldEl = new Field(
      field,
      cookieState(this.field.id, defaultConfig.DEFAULT_FAV_FIELDS_COOKIE)[1]
    );
    this.pipEl = this.pipHtml();
    this.add();
  }

  pipHtml() {
    const li = document.createElement('li');
    const [_, isInCookie] = cookieState(this.field.id, defaultConfig.DEFAULT_FAV_FIELDS_COOKIE);

    li.className = `${this.field.id}-pip ${isInCookie ? 'active favourite' : ''}`;
    li.setAttribute('role', 'button');
    li.setAttribute('tabindex', '0');
    li.setAttribute('aria-pressed', isInCookie ? 'true' : 'false');

    const plusIcon = document.createElement('i');
    plusIcon.className = 'fa-solid fa-plus';

    const nameSpan = document.createElement('span');
    nameSpan.textContent = this.field.name;

    const starIcon = document.createElement('i');
    starIcon.className = `fa-${isInCookie ? 'solid' : 'regular'} fa-star`;
    starIcon.setAttribute('role', 'button');
    starIcon.setAttribute('tabindex', '0');
    starIcon.setAttribute('aria-label', 'Toggle favourite');
    starIcon.setAttribute('aria-pressed', isInCookie ? 'true' : 'false');

    li.appendChild(plusIcon);
    li.appendChild(nameSpan);
    li.appendChild(starIcon);

    const handleStarToggle = (e) => {
      e.stopPropagation();
      if (starIcon.classList.contains('fa-solid')) {
        this.pipEl.classList.remove('favourite');
        starIcon.classList.replace('fa-solid', 'fa-regular');
        starIcon.setAttribute('aria-pressed', 'false');
      } else {
        if (this.pipEl.classList.contains('active')) {
          this.pipEl.classList.add('favourite');
        }
        starIcon.classList.replace('fa-regular', 'fa-solid');
        starIcon.setAttribute('aria-pressed', 'true');
      }
      toggleFav(this.field.id);
    };

    starIcon.addEventListener('click', handleStarToggle);
    starIcon.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        handleStarToggle(e);
        e.preventDefault();
      }
    });

    return li;
  }

  add() {
    const list = document.querySelector('.pips .pips-list');
    if (list) list.append(this.pipEl);

    this.pipEl.addEventListener('click', (e) => {
      const [_, isInCookie] = cookieState(this.field.id, defaultConfig.DEFAULT_FAV_FIELDS_COOKIE);
      const target = e.target;
      const starIsClicked = target.classList.contains('fa-star');

      if (starIsClicked) {
        return; // handled by star handler
      } else {
        if (this.pipEl.classList.contains('active')) {
          this.pipEl.classList.remove('active', 'favourite');
          this.pipEl.setAttribute('aria-pressed', 'false');
        } else if (isInCookie) {
          this.pipEl.classList.add('active', 'favourite');
          this.pipEl.setAttribute('aria-pressed', 'true');
        } else {
          this.pipEl.classList.add('active');
          this.pipEl.setAttribute('aria-pressed', 'true');
        }

        this.fieldEl[this.fieldEl.isActive ? 'remove' : 'add']();
      }
    });

    this.pipEl.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        this.pipEl.click();
        e.preventDefault();
      }
    });
  }
}

class Field {
  constructor(field, isInCookie) {
    this.isActive = false;
    this.field = field;
    this.fieldEl = this.fieldHtml();
    if (isInCookie) {
      this.add();
    }
  }

  fieldHtml() {
    const newFieldEl = document.createElement('div');
    newFieldEl.classList.add('mb-1');
    const isDateRange =
      this.field.type === 'date' || this.field.type === 'date_range' || this.field.range === true;
    const isDateSingle =
      this.field.type === 'date_single' ||
      (this.field.type === 'date' && this.field.range === false);

    const inputId = isDateRange ? `${this.field.id}_from_fld` : `${this.field.id}_fld`;

    const label = document.createElement('label');
    label.className = 'fld-label';
    label.htmlFor = inputId;
    label.textContent = this.field.name;
    newFieldEl.appendChild(label);

    if (isDateRange) {
      const group = document.createElement('div');
      group.className = 'input-group date-range';

      const from = document.createElement('input');
      from.type = 'date';
      from.name = `${this.field.id}_from`;
      from.id = inputId;
      from.className = 'form-control';
      from.placeholder = 'Start Date';
      from.setAttribute('aria-label', `${this.field.name} from`);
      from.autocomplete = 'off';
      from.setAttribute('data-lpignore', 'true');
      from.setAttribute('data-1p-ignore', 'true');

      const sep = document.createElement('span');
      sep.className = 'input-group-text date-to';
      sep.textContent = 'to';

      const to = document.createElement('input');
      to.type = 'date';
      to.name = `${this.field.id}_to`;
      to.id = `${this.field.id}_to_fld`;
      to.className = 'form-control';
      to.placeholder = 'End Date';
      to.setAttribute('aria-label', `${this.field.name} to`);
      to.autocomplete = 'off';
      to.setAttribute('data-lpignore', 'true');
      to.setAttribute('data-1p-ignore', 'true');

      group.appendChild(from);
      group.appendChild(sep);
      group.appendChild(to);
      newFieldEl.appendChild(group);

      // Progressive enhancement: attach paired (non-range) date pickers with constrained bounds
      try {
        if (window.flatpickr) {
          const opts = { dateFormat: 'Y-m-d', allowInput: true };
          let fromPicker, toPicker;
          fromPicker = window.flatpickr(from, {
            ...opts,
            onChange: (selectedDates) => {
              const d = selectedDates && selectedDates[0] ? selectedDates[0] : null;
              if (toPicker) toPicker.set('minDate', d);
            },
          });
          toPicker = window.flatpickr(to, {
            ...opts,
            onChange: (selectedDates) => {
              const d = selectedDates && selectedDates[0] ? selectedDates[0] : null;
              if (fromPicker) fromPicker.set('maxDate', d);
            },
          });
        }
      } catch (_) {}
    } else if (isDateSingle) {
      const input = document.createElement('input');
      input.type = 'date';
      input.name = this.field.id;
      input.id = inputId;
      input.className = 'form-control';
      input.placeholder = 'YYYY-MM-DD';
      if (/\b(dob|birth|birthday|bday)\b/i.test(this.field.id)) {
        input.autocomplete = 'bday';
      } else {
        input.autocomplete = 'off';
      }
      input.setAttribute('data-lpignore', 'true');
      input.setAttribute('data-1p-ignore', 'true');
      newFieldEl.appendChild(input);

      try {
        if (window.flatpickr) {
          window.flatpickr(input, { dateFormat: 'Y-m-d', allowInput: true });
        }
      } catch (_) {}
    } else {
      const input = document.createElement('input');
      input.type = this.field.type;
      input.name = this.field.id;
      input.id = inputId;
      input.className = 'form-control';
      newFieldEl.appendChild(input);
    }

    return newFieldEl;
  }

  add() {
    let fldLists = document.querySelectorAll('.flds');
    let currentFldList = findSequentialList(fldLists, defaultConfig.DEFAULT_FORM_LENGTH);

    if (!currentFldList) {
      // All existing columns are full; create a new column to the right
      const fieldsContainer = document.querySelector('.flds-container');
      const newCol = document.createElement('div');
      newCol.classList = 'flds d-flex flex-column h-100 ms-5 align-items-center';
      fieldsContainer.append(newCol);
      currentFldList = newCol;
    }

    this.isActive = true;
    currentFldList.append(this.fieldEl);

    // Notify layout change so manager can adjust alignment
    document.dispatchEvent(new Event('addFieldEvent'));
  }

  remove() {
    this.isActive = false;
    this.fieldEl.remove();
    document.dispatchEvent(new Event('removeFieldEvent'));
  }
}

class ManyFieldsFormManager {
  constructor(fieldsList) {
    this.FIELDS_LIST = fieldsList;
    this.pipObjArray = [];
    this.sortMode = 'faves'; // "faves" | "alpha"
    this.pipPage = 1;
    // Compute per-page capacity as columns * items per column
    this.pipsPerPage = defaultConfig.DEFAULT_PIP_COLS_PER_PAGE * defaultConfig.DEFAULT_PIP_LENGTH;
    this.init();
  }

  init() {
    const pipDiv = document.querySelector('.pips');

    // Do not pre-create pip columns; start with the single UL in HTML.

    // Do not pre-create field columns; start with the single default column in HTML

    this.FIELDS_LIST.forEach((field) => {
      this.pipObjArray.push(new Pip(field, defaultConfig.DEFAULT_PIP_LENGTH));
    });

    // Initial sort/layout
    this.renderSortedPips();

    document.addEventListener('removeFieldEvent', (e) => {
      this.redistributeColumns();
    });
    document.addEventListener('addFieldEvent', () => {
      this.syncColumnAlignment();
    });

    // Optional controls
    const refreshBtn = document.getElementById('refresh-pips');
    const sortAzBtn = document.getElementById('sort-az');
    const sortFavBtn = document.getElementById('sort-faves');
    refreshBtn?.addEventListener('click', () => this.renderSortedPips());
    sortAzBtn?.addEventListener('click', () => {
      this.sortMode = 'alpha';
      this.pipPage = 1;
      this.renderSortedPips();
    });
    sortFavBtn?.addEventListener('click', () => {
      this.sortMode = 'faves';
      this.pipPage = 1;
      this.renderSortedPips();
    });

    // Pagination controls
    const prevBtn = document.getElementById('pip-prev');
    const nextBtn = document.getElementById('pip-next');
    prevBtn?.addEventListener('click', () => {
      if (this.pipPage > 1) {
        this.pipPage--;
        this.renderSortedPips();
      }
    });
    nextBtn?.addEventListener('click', () => {
      this.pipPage++;
      this.renderSortedPips();
    });

    // Library panel toggle (slide-out)
    const toggleBtn = document.getElementById('toggle-library');
    const closeBtn = document.getElementById('close-panel');
    const backdrop = document.getElementById('fields-backdrop');
    const libraryPanel = document.getElementById('fields-panel');

    // Simple focus trap for the panel
    let restoreFocusEl = null;
    const focusSelector =
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
    const onKeyDownTrap = (e) => {
      if (e.key !== 'Tab' || !libraryPanel.classList.contains('open')) return;
      const focusables = Array.from(libraryPanel.querySelectorAll(focusSelector)).filter(
        (el) =>
          !el.hasAttribute('disabled') &&
          el.getAttribute('aria-hidden') !== 'true' &&
          el.offsetParent !== null
      );
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const isShift = e.shiftKey;
      if (isShift && document.activeElement === first) {
        last.focus();
        e.preventDefault();
      } else if (!isShift && document.activeElement === last) {
        first.focus();
        e.preventDefault();
      }
    };

    const setOpen = (open) => {
      if (!toggleBtn || !libraryPanel) return;
      libraryPanel.classList.toggle('open', !!open);
      libraryPanel.setAttribute('aria-hidden', open ? 'false' : 'true');
      toggleBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
      libraryPanel.setAttribute('aria-modal', open ? 'true' : 'false');
      if (open) {
        restoreFocusEl = document.activeElement;
        const firstFocusable = libraryPanel.querySelector(focusSelector);
        (firstFocusable || libraryPanel).focus?.();
        document.addEventListener('keydown', onKeyDownTrap);
      } else {
        document.removeEventListener('keydown', onKeyDownTrap);
        restoreFocusEl?.focus?.();
      }
    };
    const savedOpen = window.localStorage?.getItem('libraryOpen') === '1';
    setOpen(savedOpen);
    toggleBtn?.addEventListener('click', () => {
      const nowOpen = !libraryPanel.classList.contains('open');
      setOpen(nowOpen);
      try {
        window.localStorage?.setItem('libraryOpen', nowOpen ? '1' : '0');
      } catch (_) {}
    });
    closeBtn?.addEventListener('click', () => setOpen(false));
    backdrop?.addEventListener('click', () => setOpen(false));
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && libraryPanel.classList.contains('open')) {
        setOpen(false);
      }
    });
  }

  redistributeColumns() {
    let fieldsContainer = document.querySelectorAll('.flds');
    for (let i = 0; i < fieldsContainer.length - 1; i++) {
      if (fieldsContainer[i].children.length < defaultConfig.DEFAULT_FORM_LENGTH) {
        let nextSiblingCount = fieldsContainer[i + 1].children.length;
        if (nextSiblingCount > 0) {
          let childToMove = fieldsContainer[i + 1].firstElementChild;
          fieldsContainer[i].appendChild(childToMove);
        }
      }
    }

    // Remove trailing empty columns to keep layout tidy and allow centering
    let cols = document.querySelectorAll('.flds-container .flds');
    for (let i = cols.length - 1; i > 0; i--) {
      if (cols[i].children.length === 0) {
        cols[i].remove();
      } else {
        // Stop at the first non-empty from the end
        break;
      }
    }

    this.syncColumnAlignment();
  }

  syncColumnAlignment() {
    const cols = document.querySelectorAll('.flds-container .flds');
    const single = cols.length === 1;
    cols.forEach((col) => {
      if (single) {
        col.classList.add('justify-content-center');
      } else {
        col.classList.remove('justify-content-center');
      }
    });
  }

  renderSortedPips() {
    const pipsContainer = document.querySelector('.pips');
    if (!pipsContainer) return;
    // Clear any existing columns
    pipsContainer.querySelectorAll('.pips-list').forEach((ul) => ul.remove());

    const sorted = [...this.pipObjArray].sort((a, b) => {
      if (this.sortMode === 'alpha') {
        return a.field.name.localeCompare(b.field.name);
      }
      const aFav = isFav(a.field.id) ? 1 : 0;
      const bFav = isFav(b.field.id) ? 1 : 0;
      if (bFav !== aFav) return bFav - aFav; // favourites first
      return a.field.name.localeCompare(b.field.name);
    });

    const totalPages = Math.max(1, Math.ceil(sorted.length / this.pipsPerPage));
    if (this.pipPage > totalPages) this.pipPage = totalPages;
    const start = (this.pipPage - 1) * this.pipsPerPage;
    const pageItems = sorted.slice(start, start + this.pipsPerPage);

    // Create columns for this page
    const colsPerPage = defaultConfig.DEFAULT_PIP_COLS_PER_PAGE;
    const itemsPerCol = defaultConfig.DEFAULT_PIP_LENGTH;
    const neededCols = Math.max(
      1,
      Math.min(colsPerPage, Math.ceil(pageItems.length / itemsPerCol))
    );
    const columns = [];
    for (let c = 0; c < neededCols; c++) {
      const ul = document.createElement('ul');
      ul.className = 'pips-list p-0';
      pipsContainer.appendChild(ul);
      columns.push(ul);
    }
    // Distribute items into columns sequentially
    pageItems.forEach((pip, i) => {
      const colIndex = Math.min(columns.length - 1, Math.floor(i / itemsPerCol));
      columns[colIndex].appendChild(pip.pipEl);
    });

    // Update pager UI
    const pageLabel = document.getElementById('pip-page');
    const prevBtn = document.getElementById('pip-prev');
    const nextBtn = document.getElementById('pip-next');
    const pagerGroup = pageLabel?.parentElement;
    if (pageLabel) pageLabel.textContent = `${this.pipPage}/${totalPages}`;
    if (prevBtn) prevBtn.disabled = this.pipPage <= 1;
    if (nextBtn) nextBtn.disabled = this.pipPage >= totalPages;
    if (pagerGroup) {
      pagerGroup.style.display = totalPages > 1 ? 'inline-flex' : 'none';
    }
  }
}

// Demo fields including date range and single-date examples
const demoDateFields = [
  { name: 'Effective Date', id: 'effective_date', type: 'date', range: true },
  { name: 'Expiry Date', id: 'expiry_date', type: 'date_range' },
  { name: 'Coverage Period', id: 'coverage_period', type: 'date_range' },
  { name: 'Hire Date', id: 'hire_date', type: 'date_single' },
  { name: 'Date of Birth', id: 'dob', type: 'date_single' },
];

const tempFormManager = new ManyFieldsFormManager([
  ...demoDateFields,
  ...generateTestableFields(37),
]);
