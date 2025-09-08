// import generateRandomFields from './utils/generateRandomFields.js';
import generateTestableFields from './utils/generateTestableFields.js';
import { getFavs, toggleFav, isFav } from './utils/favsStorage.js';

const defaultConfig = {
  DEFAULT_PIP_LENGTH: 20,
  DEFAULT_FORM_LENGTH: 10,
  DEFAULT_FAV_FIELDS_COOKIE: 'favFieldsList',
  DEFAULT_PIPS_PER_PAGE: 24,
  DEFAULT_PIP_COLS_PER_PAGE: 3,
  LAZY_LOAD_THRESHOLD: 50, // Load fields in batches
  DEBOUNCE_DELAY: 150, // Debounce search and sort operations
};

// Performance optimization: Debounce utility
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Performance optimization: Throttle utility for scroll/resize events
function throttle(func, limit) {
  let inThrottle;
  return function executedFunction(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

function cookieState(fieldId, cookie) {
  let cvalue = getFavs();
  let fieldInCookie = fieldId && cvalue ? cvalue.includes(fieldId) : false;
  return [cvalue, !!fieldInCookie];
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
    // Use document fragment for better performance
    const fragment = document.createDocumentFragment();
    const li = document.createElement('li');
    const [_, isInCookie] = cookieState(this.field.id, defaultConfig.DEFAULT_FAV_FIELDS_COOKIE);

    // Batch DOM operations
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

    // Use fragment to batch DOM operations
    fragment.appendChild(plusIcon);
    fragment.appendChild(nameSpan);
    fragment.appendChild(starIcon);
    li.appendChild(fragment);

    // Optimize event handlers with proper cleanup
    this.handleStarToggle = (e) => {
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

    this.handleStarKeydown = (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        this.handleStarToggle(e);
        e.preventDefault();
      }
    };

    starIcon.addEventListener('click', this.handleStarToggle);
    starIcon.addEventListener('keydown', this.handleStarKeydown);

    return li;
  }

  add() {
    const list = document.querySelector('.pips .pips-list');
    if (list) list.append(this.pipEl);

    // Optimize event handlers with proper cleanup
    this.handleClick = (e) => {
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
    };

    this.handleKeydown = (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        this.pipEl.click();
        e.preventDefault();
      }
    };

    this.pipEl.addEventListener('click', this.handleClick);
    this.pipEl.addEventListener('keydown', this.handleKeydown);
  }

  // Cleanup method to prevent memory leaks
  destroy() {
    if (this.pipEl) {
      this.pipEl.removeEventListener('click', this.handleClick);
      this.pipEl.removeEventListener('keydown', this.handleKeydown);
      const starIcon = this.pipEl.querySelector('.fa-star');
      if (starIcon) {
        starIcon.removeEventListener('click', this.handleStarToggle);
        starIcon.removeEventListener('keydown', this.handleStarKeydown);
      }
      this.pipEl.remove();
    }
    if (this.fieldEl) {
      this.fieldEl.destroy?.();
    }
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
    // Use document fragment for better performance
    const fragment = document.createDocumentFragment();
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
    fragment.appendChild(label);

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
      fragment.appendChild(group);

      // Store picker references for cleanup
      this.flatpickrInstances = [];

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
          this.flatpickrInstances = [fromPicker, toPicker];
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
      fragment.appendChild(input);

      // Store picker reference for cleanup
      this.flatpickrInstances = [];

      try {
        if (window.flatpickr) {
          const picker = window.flatpickr(input, { dateFormat: 'Y-m-d', allowInput: true });
          this.flatpickrInstances = [picker];
        }
      } catch (_) {}
    } else {
      const input = document.createElement('input');
      input.type = this.field.type;
      input.name = this.field.id;
      input.id = inputId;
      input.className = 'form-control';
      fragment.appendChild(input);
    }

    // Append all elements at once
    newFieldEl.appendChild(fragment);
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

  // Cleanup method to prevent memory leaks
  destroy() {
    if (this.flatpickrInstances) {
      this.flatpickrInstances.forEach(picker => {
        if (picker && typeof picker.destroy === 'function') {
          picker.destroy();
        }
      });
      this.flatpickrInstances = null;
    }
    if (this.fieldEl) {
      this.fieldEl.remove();
    }
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
    this.loadedFields = 0;
    this.isLoading = false;
    this.observer = null; // For intersection observer
    this.init();
  }

  init() {
    const pipDiv = document.querySelector('.pips');

    // Do not pre-create pip columns; start with the single UL in HTML.

    // Do not pre-create field columns; start with the single default column in HTML

    // Lazy load initial batch of fields
    this.loadInitialFields();

    // Initial sort/layout
    this.renderSortedPips();

    // Debounce expensive operations
    this.debouncedRedistribute = debounce(() => this.redistributeColumns(), defaultConfig.DEBOUNCE_DELAY);
    this.debouncedSyncAlignment = debounce(() => this.syncColumnAlignment(), defaultConfig.DEBOUNCE_DELAY);

    document.addEventListener('removeFieldEvent', () => {
      this.debouncedRedistribute();
    });
    document.addEventListener('addFieldEvent', () => {
      this.debouncedSyncAlignment();
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

  // Lazy loading methods
  loadInitialFields() {
    const initialBatch = Math.min(defaultConfig.LAZY_LOAD_THRESHOLD, this.FIELDS_LIST.length);
    this.loadFieldsBatch(0, initialBatch);
  }

  loadFieldsBatch(startIndex, endIndex) {
    if (this.isLoading) return;
    this.isLoading = true;

    // Use requestAnimationFrame to prevent blocking the main thread
    requestAnimationFrame(() => {
      for (let i = startIndex; i < endIndex && i < this.FIELDS_LIST.length; i++) {
        const field = this.FIELDS_LIST[i];
        this.pipObjArray.push(new Pip(field, defaultConfig.DEFAULT_PIP_LENGTH));
        this.loadedFields++;
      }
      this.isLoading = false;
      
      // Trigger re-render if we're on the current page
      if (this.loadedFields > 0) {
        this.renderSortedPips();
      }
    });
  }

  // Cleanup method to prevent memory leaks
  destroy() {
    // Clean up all pip objects
    this.pipObjArray.forEach(pip => pip.destroy?.());
    this.pipObjArray = [];
    
    // Clean up observers
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
    
    // Remove event listeners
    document.removeEventListener('removeFieldEvent', this.debouncedRedistribute);
    document.removeEventListener('addFieldEvent', this.debouncedSyncAlignment);
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
    performanceMonitor.markStart('fieldRendering');
    const pipsContainer = document.querySelector('.pips');
    if (!pipsContainer) return;
    
    // Use document fragment for better performance
    const fragment = document.createDocumentFragment();
    
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
      fragment.appendChild(ul);
      columns.push(ul);
    }
    
    // Distribute items into columns sequentially
    pageItems.forEach((pip, i) => {
      const colIndex = Math.min(columns.length - 1, Math.floor(i / itemsPerCol));
      columns[colIndex].appendChild(pip.pipEl);
    });

    // Append all columns at once
    pipsContainer.appendChild(fragment);

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
    
    performanceMonitor.markEnd('fieldRendering');
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

// Performance monitoring
const performanceMonitor = {
  startTime: performance.now(),
  metrics: {
    initialLoad: 0,
    fieldRendering: 0,
    domManipulation: 0
  },
  
  markStart(label) {
    this[`${label}Start`] = performance.now();
  },
  
  markEnd(label) {
    if (this[`${label}Start`]) {
      this.metrics[label] = performance.now() - this[`${label}Start`];
      delete this[`${label}Start`];
    }
  },
  
  logMetrics() {
    console.log('Performance Metrics:', {
      ...this.metrics,
      totalTime: performance.now() - this.startTime
    });
  }
};

// Initialize performance monitoring
performanceMonitor.markStart('initialLoad');

const tempFormManager = new ManyFieldsFormManager([
  ...demoDateFields,
  ...generateTestableFields(37),
]);

// Mark initial load complete
performanceMonitor.markEnd('initialLoad');

// Log performance metrics after a short delay to allow for async operations
setTimeout(() => {
  performanceMonitor.logMetrics();
}, 1000);
