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
  ...generateTestableFields(40), // Realistic number of enterprise fields
]);

// Mark initial load complete
performanceMonitor.markEnd('initialLoad');

// Log performance metrics after a short delay to allow for async operations
setTimeout(() => {
  performanceMonitor.logMetrics();
}, 1000);

// ===== ENTERPRISE FEATURES =====

// Enterprise Preset Management System
class EnterprisePresetManager {
  constructor(formManager) {
    this.formManager = formManager;
    this.presets = new Map();
    this.activePreset = null;
    this.storageKey = 'enterprise_presets_v1';
    this.categories = ['Claims', 'Customer Service', 'Policy Search', 'Records', 'General'];
    this.init();
  }

  init() {
    this.loadPresets();
    this.createEnterpriseToolbar();
    this.setupKeyboardShortcuts();
    this.loadDefaultPresets();
    
    // Listen for field changes to update toolbar
    document.addEventListener('addFieldEvent', () => this.updateToolbarState());
    document.addEventListener('removeFieldEvent', () => this.updateToolbarState());
  }

  createEnterpriseToolbar() {
    const toolbar = document.createElement('div');
    toolbar.className = 'enterprise-toolbar';
    toolbar.innerHTML = `
      <div class="toolbar-left">
        <span class="toolbar-label">Quick Context:</span>
        <div class="preset-quick-buttons" id="preset-buttons"></div>
      </div>
      <div class="toolbar-center">
        <div class="current-context">
          <i class="fa-solid fa-layer-group"></i>
          <span id="current-preset-name">Manual Selection</span>
          <span class="field-count" id="field-count">0 fields</span>
        </div>
      </div>
      <div class="toolbar-right">
        <button class="btn btn-sm btn-success" id="save-current-preset" title="Save current field selection as preset (Ctrl+Shift+S)">
          <i class="fa-solid fa-save"></i> Save Preset
        </button>
        <button class="btn btn-sm btn-outline-secondary" id="clear-all-fields" title="Clear all selected fields (Ctrl+Shift+C)">
          <i class="fa-solid fa-trash"></i> Clear All
        </button>
        <button class="btn btn-sm btn-outline-info" id="keyboard-help" title="Show keyboard shortcuts (Ctrl+?)">
          <i class="fa-solid fa-keyboard"></i> Help
        </button>
      </div>
    `;

    document.body.insertBefore(toolbar, document.body.firstChild);
    document.querySelector('.form-container').style.paddingTop = '70px';
    
    this.attachToolbarEvents();
    this.renderQuickButtons();
    this.updateToolbarState();
  }

  attachToolbarEvents() {
    document.getElementById('save-current-preset')?.addEventListener('click', () => {
      this.showSavePresetDialog();
    });

    document.getElementById('clear-all-fields')?.addEventListener('click', () => {
      this.clearAllFields();
    });

    document.getElementById('keyboard-help')?.addEventListener('click', () => {
      this.displayKeyboardHelp();
    });
  }

  setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      // F1-F6 for quick preset switching
      if (e.key >= 'F1' && e.key <= 'F6') {
        e.preventDefault();
        const presetIndex = parseInt(e.key.replace('F', '')) - 1;
        this.applyQuickPreset(presetIndex);
        return;
      }

      // Ctrl+Shift+S to save preset
      if (e.ctrlKey && e.shiftKey && e.key === 'S') {
        e.preventDefault();
        this.showSavePresetDialog();
        return;
      }

      // Ctrl+Shift+C to clear all
      if (e.ctrlKey && e.shiftKey && e.key === 'C') {
        e.preventDefault();
        this.clearAllFields();
        return;
      }

      // Ctrl+Enter to execute search
      if (e.ctrlKey && e.key === 'Enter') {
        e.preventDefault();
        document.querySelector('button[type="submit"]')?.click();
        return;
      }

      // Ctrl+? for help
      if (e.ctrlKey && e.key === '?') {
        e.preventDefault();
        this.displayKeyboardHelp();
        return;
      }
    });
  }

  applyQuickPreset(index) {
    const quickPresets = Array.from(this.presets.values())
      .filter(p => !p.isArchived)
      .sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0))
      .slice(0, 6);

    if (quickPresets[index]) {
      this.applyPreset(quickPresets[index].id);
    }
  }

  applyPreset(presetId, skipAnimation = false) {
    const preset = this.presets.get(presetId);
    if (!preset) return;

    // Track usage
    preset.lastUsed = new Date().toISOString();
    preset.usageCount = (preset.usageCount || 0) + 1;
    this.savePresets();

    // Clear current selection
    this.clearAllFields();

    // Apply preset fields
    if (!skipAnimation) {
      this.applyFieldsWithAnimation(preset.fieldIds);
    } else {
      this.applyFieldsImmediate(preset.fieldIds);
    }

    this.activePreset = preset;
    this.updateToolbarState();
    this.renderQuickButtons();
    this.showNotification(`Applied preset: ${preset.name}`, 'success');

    // Focus first field for immediate input
    setTimeout(() => {
      const firstField = document.querySelector('.flds input');
      firstField?.focus();
    }, skipAnimation ? 50 : 400);
  }

  applyFieldsWithAnimation(fieldIds) {
    fieldIds.forEach((fieldId, index) => {
      setTimeout(() => {
        const pip = document.querySelector(`[class*="${fieldId}-pip"]`);
        if (pip && !pip.classList.contains('active')) {
          pip.click();
        }
      }, index * 100);
    });
  }

  applyFieldsImmediate(fieldIds) {
    fieldIds.forEach(fieldId => {
      const pip = document.querySelector(`[class*="${fieldId}-pip"]`);
      if (pip && !pip.classList.contains('active')) {
        pip.click();
      }
    });
  }

  renderQuickButtons() {
    const container = document.getElementById('preset-buttons');
    if (!container) return;

    const quickPresets = Array.from(this.presets.values())
      .filter(p => !p.isArchived)
      .sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0))
      .slice(0, 6);

    container.innerHTML = quickPresets.map((preset, index) => {
      const isActive = this.activePreset?.id === preset.id;
      const hotkey = `F${index + 1}`;
      
      return `
        <button 
          class="preset-quick-btn ${isActive ? 'active' : ''}" 
          data-preset-id="${preset.id}"
          title="${preset.name} - Press ${hotkey} (${preset.fieldIds.length} fields)"
        >
          <div class="preset-info">
            <span class="preset-name">${preset.name}</span>
            <span class="preset-hotkey">${hotkey}</span>
          </div>
          <div class="preset-meta">
            <span class="field-count">${preset.fieldIds.length} fields</span>
          </div>
        </button>
      `;
    }).join('');

    // Attach click handlers
    container.querySelectorAll('.preset-quick-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const presetId = btn.dataset.presetId;
        this.applyPreset(presetId);
      });
    });
  }

  showSavePresetDialog() {
    const activeFields = this.getCurrentActiveFields();
    if (activeFields.length === 0) {
      this.showNotification('Please select some fields before saving a preset.', 'warning');
      return;
    }

    const dialog = document.createElement('div');
    dialog.className = 'preset-dialog-overlay';
    dialog.innerHTML = `
      <div class="preset-dialog">
        <h3>Save Current Selection as Preset</h3>
        <form id="save-preset-form">
          <div class="form-group mb-3">
            <label for="preset-name">Preset Name *</label>
            <input type="text" id="preset-name" class="form-control" placeholder="e.g., Customer Lookup" required>
          </div>
          <div class="form-group mb-3">
            <label for="preset-category">Category</label>
            <select id="preset-category" class="form-control">
              ${this.categories.map(cat => `<option value="${cat}">${cat}</option>`).join('')}
            </select>
          </div>
          <div class="form-group mb-3">
            <label>Selected Fields (${activeFields.length}):</label>
            <div class="selected-fields-preview">
              ${activeFields.map(field => `<span class="field-tag">${field.name}</span>`).join('')}
            </div>
          </div>
          <div class="dialog-buttons">
            <button type="button" class="btn btn-secondary" id="cancel-save">Cancel</button>
            <button type="submit" class="btn btn-primary">Save Preset</button>
          </div>
        </form>
      </div>
    `;

    document.body.appendChild(dialog);

    document.getElementById('save-preset-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('preset-name').value.trim();
      const category = document.getElementById('preset-category').value;

      if (name) {
        this.createPreset(name, category, activeFields.map(f => f.id));
        dialog.remove();
        this.showNotification(`Preset "${name}" saved successfully!`, 'success');
      }
    });

    document.getElementById('cancel-save').addEventListener('click', () => {
      dialog.remove();
    });

    // Close on backdrop click
    dialog.addEventListener('click', (e) => {
      if (e.target === dialog) dialog.remove();
    });

    document.getElementById('preset-name').focus();
  }

  createPreset(name, category, fieldIds) {
    const preset = {
      id: this.generateId(),
      name,
      category,
      fieldIds,
      createdAt: new Date().toISOString(),
      lastUsed: new Date().toISOString(),
      usageCount: 0,
      isArchived: false
    };

    this.presets.set(preset.id, preset);
    this.savePresets();
    this.renderQuickButtons();
    
    return preset;
  }

  getCurrentActiveFields() {
    const activeFields = [];
    document.querySelectorAll('[class*="-pip"].active').forEach(pip => {
      const fieldId = pip.className.match(/([^-\s]+)-pip/)?.[1];
      const fieldName = pip.querySelector('span')?.textContent;
      if (fieldId && fieldName) {
        activeFields.push({ id: fieldId, name: fieldName });
      }
    });
    return activeFields;
  }

  clearAllFields() {
    document.querySelectorAll('[class*="-pip"].active').forEach(pip => {
      pip.click();
    });
    
    this.activePreset = null;
    this.updateToolbarState();
    this.showNotification('All fields cleared', 'info');
  }

  updateToolbarState() {
    const nameEl = document.getElementById('current-preset-name');
    const countEl = document.getElementById('field-count');
    
    if (nameEl) {
      nameEl.textContent = this.activePreset ? this.activePreset.name : 'Manual Selection';
    }
    
    if (countEl) {
      const activeCount = document.querySelectorAll('[class*="-pip"].active').length;
      countEl.textContent = `${activeCount} fields`;
    }
  }

  loadDefaultPresets() {
    if (this.presets.size > 0) return;

    const defaultPresets = [
      {
        name: 'Customer Lookup',
        category: 'Customer Service', 
        fieldIds: ['customer_id', 'first_name', 'last_name', 'phone', 'email']
      },
      {
        name: 'Claims Search',
        category: 'Claims',
        fieldIds: ['claim_id', 'policy_number', 'date_of_loss', 'customer_id']
      },
      {
        name: 'Policy Inquiry',
        category: 'Policy Search',
        fieldIds: ['policy_number', 'customer_id', 'effective_date', 'expiry_date']
      },
      {
        name: 'Employee Search',
        category: 'Records',
        fieldIds: ['employee_id', 'first_name', 'last_name', 'department']
      },
      {
        name: 'Quick Search',
        category: 'General',
        fieldIds: ['cert_fld', 'customer_id', 'reference_number']
      },
      {
        name: 'Contact Info',
        category: 'Customer Service',
        fieldIds: ['phone', 'email', 'address', 'city', 'state']
      }
    ];

    defaultPresets.forEach(preset => {
      this.createPreset(preset.name, preset.category, preset.fieldIds);
    });
  }

  displayKeyboardHelp() {
    const help = document.createElement('div');
    help.className = 'keyboard-help-overlay';
    help.innerHTML = `
      <div class="keyboard-help">
        <h3><i class="fa-solid fa-keyboard"></i> Keyboard Shortcuts</h3>
        <div class="shortcut-groups">
          <div class="shortcut-group">
            <h4>Presets</h4>
            <div class="shortcut-item"><kbd>F1</kbd>-<kbd>F6</kbd> Apply quick presets</div>
            <div class="shortcut-item"><kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>S</kbd> Save current preset</div>
          </div>
          <div class="shortcut-group">
            <h4>Actions</h4>
            <div class="shortcut-item"><kbd>Ctrl</kbd>+<kbd>Enter</kbd> Execute search</div>
            <div class="shortcut-item"><kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>C</kbd> Clear all fields</div>
            <div class="shortcut-item"><kbd>Ctrl</kbd>+<kbd>F</kbd> Focus search field</div>
            <div class="shortcut-item"><kbd>Escape</kbd> Close dialogs</div>
          </div>
          <div class="shortcut-group">
            <h4>Navigation</h4>
            <div class="shortcut-item"><kbd>Tab</kbd> Navigate between fields</div>
            <div class="shortcut-item"><kbd>Enter</kbd> Activate focused field</div>
            <div class="shortcut-item"><kbd>Space</kbd> Toggle field selection</div>
          </div>
        </div>
        <button class="btn btn-primary mt-3" onclick="this.closest('.keyboard-help-overlay').remove()">
          Got it!
        </button>
      </div>
    `;
    
    document.body.appendChild(help);

    // Close on backdrop click or escape
    help.addEventListener('click', (e) => {
      if (e.target === help) help.remove();
    });

    document.addEventListener('keydown', function escapeHandler(e) {
      if (e.key === 'Escape') {
        help.remove();
        document.removeEventListener('keydown', escapeHandler);
      }
    });
  }

  loadPresets() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        const presetArray = JSON.parse(stored);
        presetArray.forEach(preset => {
          this.presets.set(preset.id, preset);
        });
      }
    } catch (error) {
      console.error('Failed to load presets:', error);
    }
  }

  savePresets() {
    try {
      const presetArray = Array.from(this.presets.values());
      localStorage.setItem(this.storageKey, JSON.stringify(presetArray));
    } catch (error) {
      console.error('Failed to save presets:', error);
    }
  }

  generateId() {
    return 'preset_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
      <i class="fa-solid fa-${type === 'success' ? 'check-circle' : type === 'warning' ? 'exclamation-triangle' : 'info-circle'}"></i>
      <span>${message}</span>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.classList.add('show');
    }, 100);
    
    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }
}

// Enhanced Search Manager with Categories
class EnterpriseSearchManager {
  constructor(formManager) {
    this.formManager = formManager;
    this.categories = this.buildCategoryIndex();
    this.init();
  }

  init() {
    this.createEnhancedSearch();
  }

  buildCategoryIndex() {
    const fieldCategories = {
      'Customer Info': ['customer_id', 'first_name', 'last_name', 'email', 'phone', 'account_number', 'date_of_birth', 'address', 'city', 'state', 'zip_code'],
      'Claims': ['claim_id', 'policy_number', 'date_of_loss', 'incident_date', 'case_number', 'reference_number'],
      'Policies': ['policy_number', 'effective_date', 'expiry_date', 'contract_id'], 
      'Dates': ['hire_date', 'date_of_birth', 'effective_date', 'expiry_date', 'date_of_loss', 'incident_date', 'service_date', 'appointment_date'],
      'General': ['cert_fld', 'employee_id', 'badge_number', 'department', 'position', 'company', 'region', 'status', 'priority_level', 'ssn', 'license_number', 'vin', 'license_plate', 'invoice_number', 'order_id']
    };

    const categories = new Map();
    Object.entries(fieldCategories).forEach(([category, fieldIds]) => {
      fieldIds.forEach(fieldId => {
        if (!categories.has(fieldId)) {
          categories.set(fieldId, []);
        }
        categories.get(fieldId).push(category);
      });
    });

    return categories;
  }

  createEnhancedSearch() {
    // Wait for the panel to be created
    setTimeout(() => {
      const panelHeader = document.querySelector('.panel-header');
      if (!panelHeader) return;

      const searchContainer = document.createElement('div');
      searchContainer.className = 'enterprise-search-container';
      searchContainer.innerHTML = `
        <div class="search-input-container mb-2">
          <div class="input-group input-group-sm">
            <span class="input-group-text">
              <i class="fa-solid fa-search"></i>
            </span>
            <input 
              type="text" 
              class="form-control" 
              placeholder="Search fields... (Ctrl+F)"
              id="enterprise-field-search"
              autocomplete="off"
            >
            <button class="btn btn-outline-secondary" type="button" id="clear-search">
              <i class="fa-solid fa-times"></i>
            </button>
          </div>
        </div>
        <div class="category-filter mb-2">
          <div class="btn-group btn-group-sm w-100" role="group">
            <button type="button" class="btn btn-outline-secondary active" data-category="all">
              All
            </button>
            <button type="button" class="btn btn-outline-secondary" data-category="Customer Info">
              Customer
            </button>
            <button type="button" class="btn btn-outline-secondary" data-category="Claims">
              Claims
            </button>
            <button type="button" class="btn btn-outline-secondary" data-category="Policies">
              Policies
            </button>
            <button type="button" class="btn btn-outline-secondary" data-category="Dates">
              Dates
            </button>
          </div>
        </div>
        <div id="search-results-info" class="small text-muted mb-2"></div>
      `;

      // Insert after the title
      const title = panelHeader.querySelector('h2');
      title.parentNode.insertBefore(searchContainer, title.nextSibling);

      this.attachSearchEvents();
    }, 1000);
  }

  attachSearchEvents() {
    const searchInput = document.getElementById('enterprise-field-search');
    const clearBtn = document.getElementById('clear-search');
    const categoryButtons = document.querySelectorAll('.category-filter button');

    if (!searchInput) return;

    // Search functionality
    let searchTimeout;
    searchInput.addEventListener('input', (e) => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        this.performSearch(e.target.value);
      }, 200);
    });

    // Clear search
    clearBtn?.addEventListener('click', () => {
      searchInput.value = '';
      this.performSearch('');
      searchInput.focus();
    });

    // Category filtering
    categoryButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        categoryButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.filterByCategory(btn.dataset.category);
      });
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        searchInput.focus();
        searchInput.select();
      }
    });
  }

  performSearch(query) {
    const trimmedQuery = query.trim().toLowerCase();
    const pips = document.querySelectorAll('[class*="-pip"]');
    let visibleCount = 0;

    pips.forEach(pip => {
      const text = pip.textContent.toLowerCase();
      const isVisible = !trimmedQuery || text.includes(trimmedQuery);
      
      pip.style.display = isVisible ? 'inline-flex' : 'none';
      if (isVisible) visibleCount++;

      // Highlight matches
      if (trimmedQuery && isVisible) {
        this.highlightMatch(pip, trimmedQuery);
      } else {
        this.removeHighlight(pip);
      }
    });

    this.updateSearchResults(visibleCount, trimmedQuery);
  }

  filterByCategory(category) {
    const pips = document.querySelectorAll('[class*="-pip"]');
    let visibleCount = 0;
    
    pips.forEach(pip => {
      const fieldId = pip.className.match(/([^-\s]+)-pip/)?.[1];
      let shouldShow = true;
      
      if (category === 'all') {
        shouldShow = true;
      } else {
        const fieldCategories = this.categories.get(fieldId) || [];
        shouldShow = fieldCategories.includes(category);
      }
      
      pip.style.display = shouldShow ? 'inline-flex' : 'none';
      if (shouldShow) visibleCount++;
    });

    this.updateSearchResults(visibleCount, '', category);
  }

  highlightMatch(pip, query) {
    const span = pip.querySelector('span');
    if (!span) return;

    const text = span.textContent;
    const regex = new RegExp(`(${this.escapeRegex(query)})`, 'gi');
    const highlighted = text.replace(regex, '<mark>$1</mark>');
    span.innerHTML = highlighted;
  }

  removeHighlight(pip) {
    const span = pip.querySelector('span');
    if (!span) return;
    const text = span.textContent;
    span.innerHTML = '';
    span.textContent = text;
  }

  escapeRegex(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  updateSearchResults(count, query, category = '') {
    const resultsDiv = document.getElementById('search-results-info');
    if (!resultsDiv) return;

    if (query && count === 0) {
      resultsDiv.textContent = 'No fields found';
      resultsDiv.className = 'small text-warning mb-2';
    } else if (query || category) {
      const searchType = category ? `in ${category}` : 'matching search';
      resultsDiv.textContent = `${count} field${count !== 1 ? 's' : ''} found ${searchType}`;
      resultsDiv.className = 'small text-info mb-2';
    } else {
      resultsDiv.textContent = '';
    }
  }
}

// Initialize Enterprise Features
const originalFormManagerInit = ManyFieldsFormManager.prototype.init;
ManyFieldsFormManager.prototype.init = function() {
  originalFormManagerInit.call(this);
  
  // Initialize enterprise features
  this.presetManager = new EnterprisePresetManager(this);
  this.searchManager = new EnterpriseSearchManager(this);
};
