# Enterprise Quick Implementation Guide
## Preset Management & Productivity Features

This guide provides production-ready code for the most critical enterprise features, specifically designed for call center and corporate search environments.

---

## **1. Enterprise Preset Management System (45 minutes)**
**HIGHEST PRIORITY - Enables context switching for different search scenarios**

### **Core Preset Manager**

Add this to your `scripts.js`:

```javascript
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
    this.createPresetToolbar();
    this.setupKeyboardShortcuts();
    this.loadDefaultPresets();
  }

  // Create persistent toolbar at top of page
  createPresetToolbar() {
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
        <button class="btn btn-sm btn-success" id="save-current-preset" title="Save current field selection as preset">
          <i class="fa-solid fa-save"></i> Save Preset
        </button>
        <button class="btn btn-sm btn-outline-secondary" id="manage-presets" title="Manage all presets">
          <i class="fa-solid fa-cog"></i> Manage
        </button>
        <button class="btn btn-sm btn-outline-danger" id="clear-all-fields" title="Clear all selected fields">
          <i class="fa-solid fa-trash"></i> Clear All
        </button>
      </div>
    `;

    // Insert at top of page
    document.body.insertBefore(toolbar, document.body.firstChild);
    
    // Adjust page layout
    document.querySelector('.form-container').style.paddingTop = '60px';
    
    this.attachToolbarEvents();
  }

  attachToolbarEvents() {
    // Save current preset
    document.getElementById('save-current-preset')?.addEventListener('click', () => {
      this.showSavePresetDialog();
    });

    // Manage presets
    document.getElementById('manage-presets')?.addEventListener('click', () => {
      this.showPresetManager();
    });

    // Clear all fields
    document.getElementById('clear-all-fields')?.addEventListener('click', () => {
      this.clearAllFields();
    });

    // Update field count when fields change
    document.addEventListener('addFieldEvent', () => this.updateFieldCount());
    document.addEventListener('removeFieldEvent', () => this.updateFieldCount());
  }

  // Setup F1-F6 hotkeys for quick preset switching
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
    });
  }

  // Apply preset by F-key index
  applyQuickPreset(index) {
    const quickPresets = Array.from(this.presets.values())
      .filter(p => !p.isArchived)
      .sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0))
      .slice(0, 6);

    if (quickPresets[index]) {
      this.applyPreset(quickPresets[index].id);
    }
  }

  // Main preset application logic
  applyPreset(presetId, skipAnimation = false) {
    const preset = this.presets.get(presetId);
    if (!preset) return;

    // Track usage
    preset.lastUsed = new Date().toISOString();
    preset.usageCount = (preset.usageCount || 0) + 1;
    this.savePresets();

    // Clear current selection
    this.clearAllFields();

    // Apply preset fields with subtle animation
    if (!skipAnimation) {
      this.applyFieldsWithAnimation(preset.fieldIds);
    } else {
      this.applyFieldsImmediate(preset.fieldIds);
    }

    this.activePreset = preset;
    this.updateToolbarState();
    this.renderQuickButtons();

    // Analytics
    this.trackPresetUsage(preset);

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
      }, index * 100); // Stagger animations
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

  // Render quick access buttons (F1-F6)
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
          title="${preset.name} - Press ${hotkey}"
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

  // Save current field selection as preset
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
          <div class="form-group mb-3">
            <label>
              <input type="checkbox" id="set-as-default"> Set as default for this category
            </label>
          </div>
          <div class="dialog-buttons">
            <button type="button" class="btn btn-secondary" id="cancel-save">Cancel</button>
            <button type="submit" class="btn btn-primary">Save Preset</button>
          </div>
        </form>
      </div>
    `;

    document.body.appendChild(dialog);

    // Handle form submission
    document.getElementById('save-preset-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('preset-name').value;
      const category = document.getElementById('preset-category').value;
      const isDefault = document.getElementById('set-as-default').checked;

      this.createPreset(name, category, activeFields.map(f => f.id), isDefault);
      dialog.remove();
      this.showNotification(`Preset "${name}" saved successfully!`, 'success');
    });

    document.getElementById('cancel-save').addEventListener('click', () => {
      dialog.remove();
    });

    // Focus name input
    document.getElementById('preset-name').focus();
  }

  createPreset(name, category, fieldIds, isDefault = false) {
    const preset = {
      id: this.generateId(),
      name,
      category,
      fieldIds,
      isDefault,
      createdAt: new Date().toISOString(),
      lastUsed: new Date().toISOString(),
      usageCount: 0,
      isArchived: false,
      createdBy: 'current_user' // In real app, get from auth
    };

    this.presets.set(preset.id, preset);
    this.savePresets();
    this.renderQuickButtons();
    
    return preset;
  }

  // Get currently active fields
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

  // Clear all active fields
  clearAllFields() {
    document.querySelectorAll('[class*="-pip"].active').forEach(pip => {
      pip.click(); // Deactivate
    });
    
    this.activePreset = null;
    this.updateToolbarState();
  }

  updateToolbarState() {
    const nameEl = document.getElementById('current-preset-name');
    const countEl = document.getElementById('field-count');
    
    if (nameEl) {
      nameEl.textContent = this.activePreset ? this.activePreset.name : 'Manual Selection';
    }
    
    this.updateFieldCount();
  }

  updateFieldCount() {
    const countEl = document.getElementById('field-count');
    if (countEl) {
      const activeCount = document.querySelectorAll('[class*="-pip"].active').length;
      countEl.textContent = `${activeCount} fields`;
    }
  }

  // Load default presets for common use cases
  loadDefaultPresets() {
    if (this.presets.size > 0) return; // Don't overwrite existing presets

    const defaultPresets = [
      {
        name: 'Customer Lookup',
        category: 'Customer Service',
        fieldIds: ['customer_id', 'phone', 'email', 'last_name'],
        isDefault: true
      },
      {
        name: 'Claim Search',
        category: 'Claims',
        fieldIds: ['claim_id', 'policy_number', 'date_of_loss'],
        isDefault: true
      },
      {
        name: 'Policy Inquiry',
        category: 'Policy Search',
        fieldIds: ['policy_number', 'effective_date', 'customer_id'],
        isDefault: true
      },
      {
        name: 'Quick Search',
        category: 'General',
        fieldIds: ['cert_fld'], // Using existing field
        isDefault: true
      }
    ];

    defaultPresets.forEach(preset => {
      this.createPreset(preset.name, preset.category, preset.fieldIds, preset.isDefault);
    });
  }

  // Storage methods
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

  // Analytics
  trackPresetUsage(preset) {
    // In production, send to analytics service
    console.log('Preset Usage:', {
      presetId: preset.id,
      presetName: preset.name,
      category: preset.category,
      fieldCount: preset.fieldIds.length,
      timestamp: new Date().toISOString()
    });
  }

  generateId() {
    return 'preset_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
      <i class="fa-solid fa-${type === 'success' ? 'check' : type === 'warning' ? 'exclamation-triangle' : 'info-circle'}"></i>
      ${message}
    `;
    
    document.body.appendChild(notification);
    
    // Auto-remove
    setTimeout(() => notification.remove(), 4000);
  }
}

// Initialize Enterprise Preset Manager
const originalManagerInit = ManyFieldsFormManager.prototype.init;
ManyFieldsFormManager.prototype.init = function() {
  originalManagerInit.call(this);
  this.presetManager = new EnterprisePresetManager(this);
};
```

### **Enterprise Toolbar Styles**

Add to your `styles.css`:

```css
/* Enterprise Toolbar */
.enterprise-toolbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 50px;
  background: linear-gradient(135deg, #2c3e50 0%, #34495e 100%);
  color: white;
  display: flex;
  align-items: center;
  padding: 0 1rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
  z-index: 1050;
  font-size: 0.9rem;
}

.toolbar-left, .toolbar-center, .toolbar-right {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.toolbar-center {
  flex: 1;
  justify-content: center;
}

.toolbar-label {
  font-weight: 600;
  color: #bdc3c7;
  white-space: nowrap;
}

.preset-quick-buttons {
  display: flex;
  gap: 0.5rem;
}

.preset-quick-btn {
  background: rgba(255,255,255,0.1);
  border: 1px solid rgba(255,255,255,0.2);
  color: white;
  padding: 0.5rem 0.75rem;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  min-width: 100px;
  text-align: left;
}

.preset-quick-btn:hover {
  background: rgba(255,255,255,0.2);
  border-color: rgba(255,255,255,0.3);
}

.preset-quick-btn.active {
  background: var(--accent);
  border-color: var(--accent);
  box-shadow: 0 0 0 2px rgba(10, 132, 255, 0.3);
}

.preset-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.preset-name {
  font-weight: 500;
}

.preset-hotkey {
  font-size: 0.75rem;
  background: rgba(255,255,255,0.2);
  padding: 0.1rem 0.3rem;
  border-radius: 3px;
}

.preset-meta {
  font-size: 0.75rem;
  color: rgba(255,255,255,0.7);
  margin-top: 0.2rem;
}

.current-context {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: rgba(255,255,255,0.1);
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-weight: 500;
}

.field-count {
  font-size: 0.8rem;
  color: rgba(255,255,255,0.7);
}

/* Preset Dialog */
.preset-dialog-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}

.preset-dialog {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  width: 90%;
  max-width: 500px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.3);
}

.selected-fields-preview {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  max-height: 100px;
  overflow-y: auto;
}

.field-tag {
  background: var(--accent-30);
  color: var(--accent);
  padding: 0.2rem 0.5rem;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 500;
}

.dialog-buttons {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 1.5rem;
}

/* Notifications */
.notification {
  position: fixed;
  top: 70px;
  right: 1rem;
  background: white;
  padding: 1rem 1.5rem;
  border-radius: 6px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.15);
  border-left: 4px solid;
  z-index: 2000;
  animation: slideInRight 0.3s ease;
}

.notification-success { border-left-color: #28a745; }
.notification-warning { border-left-color: #ffc107; }
.notification-info { border-left-color: #17a2b8; }

@keyframes slideInRight {
  from { transform: translateX(100%); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .enterprise-toolbar {
    flex-direction: column;
    height: auto;
    padding: 0.5rem;
    gap: 0.5rem;
  }
  
  .toolbar-left, .toolbar-center, .toolbar-right {
    width: 100%;
    justify-content: space-between;
  }
  
  .preset-quick-btn {
    min-width: auto;
    flex: 1;
  }
}
```

---

## **2. Enhanced Search with Categories (20 minutes)**

Extend your existing search with enterprise features:

```javascript
class EnterpriseSearchManager extends FieldSearchManager {
  constructor(formManager) {
    super(formManager);
    this.categories = this.buildCategoryIndex();
    this.recentSearches = this.loadRecentSearches();
    this.setupCategoryFilters();
  }

  buildCategoryIndex() {
    const categories = new Map();
    
    // Categorize fields for enterprise use
    const fieldCategories = {
      'Customer Info': ['customer_id', 'first_name', 'last_name', 'email', 'phone'],
      'Claims': ['claim_id', 'policy_number', 'date_of_loss', 'claim_status'],
      'Policies': ['policy_number', 'effective_date', 'expiry_date', 'coverage_period'],
      'Dates': ['hire_date', 'dob', 'effective_date', 'expiry_date'],
      'Identifiers': ['cert_fld', 'customer_id', 'claim_id', 'policy_number']
    };

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

  setupCategoryFilters() {
    const searchContainer = document.querySelector('.search-container');
    if (!searchContainer) return;

    const categoryFilter = document.createElement('div');
    categoryFilter.className = 'category-filter mb-2';
    categoryFilter.innerHTML = `
      <div class="btn-group btn-group-sm" role="group">
        <button type="button" class="btn btn-outline-secondary active" data-category="all">
          All Fields
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
        <button type="button" class="btn btn-outline-secondary" data-category="recent">
          Recent
        </button>
      </div>
    `;

    searchContainer.appendChild(categoryFilter);

    // Handle category filtering
    categoryFilter.addEventListener('click', (e) => {
      if (e.target.dataset.category) {
        // Update active button
        categoryFilter.querySelectorAll('.btn').forEach(btn => 
          btn.classList.remove('active'));
        e.target.classList.add('active');
        
        this.filterByCategory(e.target.dataset.category);
      }
    });
  }

  filterByCategory(category) {
    const pips = document.querySelectorAll('[class*="-pip"]');
    
    pips.forEach(pip => {
      const fieldId = pip.className.match(/([^-\s]+)-pip/)?.[1];
      let shouldShow = true;
      
      if (category === 'all') {
        shouldShow = true;
      } else if (category === 'recent') {
        shouldShow = this.isRecentlyUsed(fieldId);
      } else {
        const fieldCategories = this.categories.get(fieldId) || [];
        shouldShow = fieldCategories.includes(category);
      }
      
      pip.style.display = shouldShow ? 'inline-flex' : 'none';
    });
  }

  isRecentlyUsed(fieldId) {
    // Check if field was used in recent presets
    const recentlyUsed = JSON.parse(localStorage.getItem('recently_used_fields') || '[]');
    return recentlyUsed.includes(fieldId);
  }
}

// Initialize enhanced search
const originalSearchInit = FieldSearchManager;
window.FieldSearchManager = EnterpriseSearchManager;
```

---

## **3. Quick Context Switching (15 minutes)**

Add rapid preset switching capability:

```javascript
class QuickContextSwitcher {
  constructor(presetManager) {
    this.presetManager = presetManager;
    this.init();
  }

  init() {
    this.createContextSwitcher();
    this.setupHotkeys();
  }

  createContextSwitcher() {
    const switcher = document.createElement('div');
    switcher.className = 'context-switcher';
    switcher.innerHTML = `
      <div class="context-label">Context:</div>
      <select id="context-select" class="form-control form-control-sm">
        <option value="">Select search context...</option>
        <option value="customer_service">Customer Service Call</option>
        <option value="claims_processing">Claims Processing</option>
        <option value="policy_inquiry">Policy Inquiry</option>
        <option value="general_search">General Search</option>
      </select>
    `;

    // Add to toolbar or main area
    const toolbar = document.querySelector('.enterprise-toolbar .toolbar-left');
    if (toolbar) {
      toolbar.appendChild(switcher);
    }

    // Handle context switching
    document.getElementById('context-select').addEventListener('change', (e) => {
      this.switchContext(e.target.value);
    });
  }

  switchContext(contextType) {
    const contextPresets = {
      'customer_service': 'Customer Lookup',
      'claims_processing': 'Claim Search',
      'policy_inquiry': 'Policy Inquiry',
      'general_search': 'Quick Search'
    };

    const presetName = contextPresets[contextType];
    if (presetName) {
      const preset = Array.from(this.presetManager.presets.values())
        .find(p => p.name === presetName);
      
      if (preset) {
        this.presetManager.applyPreset(preset.id, true); // Skip animation for speed
      }
    }
  }

  setupHotkeys() {
    // Ctrl+1-4 for quick context switching
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.key >= '1' && e.key <= '4') {
        e.preventDefault();
        const contexts = ['customer_service', 'claims_processing', 'policy_inquiry', 'general_search'];
        const contextIndex = parseInt(e.key) - 1;
        
        if (contexts[contextIndex]) {
          this.switchContext(contexts[contextIndex]);
          
          // Update dropdown
          const select = document.getElementById('context-select');
          if (select) {
            select.value = contexts[contextIndex];
          }
        }
      }
    });
  }
}

// Initialize context switcher after preset manager
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    if (window.tempFormManager && window.tempFormManager.presetManager) {
      new QuickContextSwitcher(window.tempFormManager.presetManager);
    }
  }, 1000);
});
```

Add context switcher styles:

```css
.context-switcher {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.context-label {
  font-weight: 500;
  color: #bdc3c7;
  white-space: nowrap;
}

#context-select {
  background: rgba(255,255,255,0.1);
  border: 1px solid rgba(255,255,255,0.2);
  color: white;
  min-width: 180px;
}

#context-select option {
  background: #2c3e50;
  color: white;
}
```

---

## **4. Enterprise Keyboard Shortcuts (10 minutes)**

Add comprehensive keyboard support for power users:

```javascript
class EnterpriseKeyboardManager {
  constructor() {
    this.shortcuts = {
      // Preset management
      'F1': () => this.applyQuickPreset(0),
      'F2': () => this.applyQuickPreset(1),
      'F3': () => this.applyQuickPreset(2),
      'F4': () => this.applyQuickPreset(3),
      'F5': () => this.applyQuickPreset(4),
      'F6': () => this.applyQuickPreset(5),
      
      // Context switching
      'ctrl+1': () => this.switchToContext('customer_service'),
      'ctrl+2': () => this.switchToContext('claims_processing'),
      'ctrl+3': () => this.switchToContext('policy_inquiry'),
      'ctrl+4': () => this.switchToContext('general_search'),
      
      // Form actions
      'ctrl+shift+c': () => this.clearAllFields(),
      'ctrl+shift+s': () => this.saveCurrentPreset(),
      'ctrl+enter': () => this.executeSearch(),
      'ctrl+shift+n': () => this.newSearch(),
      
      // Navigation
      'ctrl+f': () => this.focusSearch(),
      'escape': () => this.handleEscape(),
      'ctrl+k': () => this.showCommandPalette()
    };

    this.init();
  }

  init() {
    document.addEventListener('keydown', (e) => {
      const shortcut = this.getShortcut(e);
      if (this.shortcuts[shortcut] && this.shouldHandle(e)) {
        e.preventDefault();
        this.shortcuts[shortcut]();
      }
    });

    this.showKeyboardHelp();
  }

  getShortcut(e) {
    const parts = [];
    if (e.ctrlKey) parts.push('ctrl');
    if (e.shiftKey) parts.push('shift');
    if (e.altKey) parts.push('alt');
    parts.push(e.key.toLowerCase());
    return parts.join('+');
  }

  shouldHandle(e) {
    // Don't handle shortcuts when typing in inputs (except for specific cases)
    const activeElement = document.activeElement;
    const isInput = activeElement && (
      activeElement.tagName === 'INPUT' || 
      activeElement.tagName === 'TEXTAREA' ||
      activeElement.contentEditable === 'true'
    );

    // Allow certain shortcuts even in inputs
    const allowedInInputs = ['escape', 'ctrl+enter', 'ctrl+f'];
    const shortcut = this.getShortcut(e);
    
    return !isInput || allowedInInputs.includes(shortcut);
  }

  executeSearch() {
    // Trigger search action
    const searchButton = document.querySelector('button[type="submit"]');
    if (searchButton) {
      searchButton.click();
    }
  }

  newSearch() {
    this.clearAllFields();
    this.focusFirstField();
  }

  focusFirstField() {
    const firstField = document.querySelector('.flds input');
    if (firstField) {
      firstField.focus();
    }
  }

  showCommandPalette() {
    // Quick command palette for power users
    const palette = document.createElement('div');
    palette.className = 'command-palette';
    palette.innerHTML = `
      <div class="palette-content">
        <input type="text" placeholder="Type a command..." class="palette-input">
        <div class="palette-suggestions">
          <div class="palette-item" data-action="save-preset">Save current as preset</div>
          <div class="palette-item" data-action="clear-all">Clear all fields</div>
          <div class="palette-item" data-action="customer-search">Switch to customer search</div>
          <div class="palette-item" data-action="claims-search">Switch to claims search</div>
        </div>
      </div>
    `;
    
    document.body.appendChild(palette);
    
    const input = palette.querySelector('.palette-input');
    input.focus();
    
    // Handle palette interactions
    palette.addEventListener('click', (e) => {
      if (e.target.dataset.action) {
        this.executePaletteAction(e.target.dataset.action);
        palette.remove();
      }
    });
    
    // Close on escape
    palette.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        palette.remove();
      }
    });
  }

  showKeyboardHelp() {
    // Show help overlay on Ctrl+?
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.key === '?') {
        e.preventDefault();
        this.displayKeyboardHelp();
      }
    });
  }

  displayKeyboardHelp() {
    const help = document.createElement('div');
    help.className = 'keyboard-help-overlay';
    help.innerHTML = `
      <div class="keyboard-help">
        <h3>Keyboard Shortcuts</h3>
        <div class="shortcut-groups">
          <div class="shortcut-group">
            <h4>Presets</h4>
            <div class="shortcut-item"><kbd>F1-F6</kbd> Apply quick presets</div>
            <div class="shortcut-item"><kbd>Ctrl+Shift+S</kbd> Save current preset</div>
          </div>
          <div class="shortcut-group">
            <h4>Context</h4>
            <div class="shortcut-item"><kbd>Ctrl+1-4</kbd> Switch context</div>
            <div class="shortcut-item"><kbd>Ctrl+K</kbd> Command palette</div>
          </div>
          <div class="shortcut-group">
            <h4>Actions</h4>
            <div class="shortcut-item"><kbd>Ctrl+Enter</kbd> Execute search</div>
            <div class="shortcut-item"><kbd>Ctrl+Shift+C</kbd> Clear all</div>
            <div class="shortcut-item"><kbd>Ctrl+F</kbd> Focus search</div>
          </div>
        </div>
        <button class="btn btn-secondary mt-3" onclick="this.closest('.keyboard-help-overlay').remove()">
          Close
        </button>
      </div>
    `;
    
    document.body.appendChild(help);
  }
}

// Initialize enterprise keyboard manager
document.addEventListener('DOMContentLoaded', () => {
  new EnterpriseKeyboardManager();
});
```

---

## **Implementation Steps**

### **Step 1: Add Preset System (Day 1)**
1. Copy the `EnterprisePresetManager` code to `scripts.js`
2. Add the toolbar CSS to `styles.css`
3. Test preset creation and switching

### **Step 2: Add Enhanced Search (Day 1)**
1. Replace existing search with `EnterpriseSearchManager`
2. Add category filtering
3. Test field categorization

### **Step 3: Add Context Switching (Day 2)**
1. Add `QuickContextSwitcher` code
2. Test rapid context changes
3. Verify hotkey functionality

### **Step 4: Add Keyboard Shortcuts (Day 2)**
1. Add `EnterpriseKeyboardManager`
2. Test all keyboard shortcuts
3. Add keyboard help overlay

### **Testing Scenarios**

**Call Center Workflow:**
1. Press F1 → Customer Lookup preset loads
2. Enter customer ID → Press Ctrl+Enter to search
3. Press Ctrl+2 → Switch to claims context
4. Press F2 → Claims search preset loads

**Insurance Processing:**
1. Press Ctrl+3 → Policy inquiry context
2. Use preset with policy fields
3. Switch to claims with Ctrl+2
4. Save new combination with Ctrl+Shift+S

This implementation provides a production-ready enterprise search interface that dramatically improves productivity for corporate users.