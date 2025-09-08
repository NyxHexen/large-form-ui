# Enterprise Features Testing Guide

## 🚀 Quick Start Testing

### **1. Open the Application**
- Navigate to `http://localhost:8000` in your browser
- You should see the new enterprise toolbar at the top

### **2. Test Preset System (Most Important)**

#### **F1-F6 Quick Presets:**
1. **Press F1** - Should load "Customer Lookup" preset with 5 fields
2. **Press F2** - Should load "Claims Search" preset with 4 fields  
3. **Press F3** - Should load "Policy Inquiry" preset with 4 fields
4. **Try F4-F6** - Additional presets with different field combinations

#### **Save New Presets:**
1. **Add some fields manually** by clicking field chips in the library
2. **Press Ctrl+Shift+S** - Should open save preset dialog
3. **Enter a name** like "My Custom Search"
4. **Click Save** - Should appear as new quick button

### **3. Test Enhanced Search**

#### **Open Fields Library:**
1. **Click "Fields" button** on right side of screen
2. **Search panel should appear** at top with categories

#### **Test Search Features:**
1. **Press Ctrl+F** - Should focus search input
2. **Type "customer"** - Should filter to customer-related fields
3. **Click "Claims" category** - Should show only claims fields
4. **Click "Customer" category** - Should show only customer fields
5. **Try searching for "date"** - Should highlight matching text

### **4. Test Keyboard Navigation**

#### **Basic Shortcuts:**
- **Ctrl+Shift+C** - Clear all selected fields
- **Ctrl+Enter** - Submit search (click SEARCH button)
- **Ctrl+?** - Show keyboard shortcuts help dialog
- **Escape** - Close any open dialogs

#### **Field Navigation:**
- **Tab** through interface elements
- **Enter/Space** to activate focused fields
- **Arrow keys** to navigate field library

### **5. Test Mobile Responsiveness**
1. **Resize browser** to mobile width (~400px)
2. **Toolbar should stack vertically** on mobile
3. **All functionality should remain accessible**

---

## 🎯 **Expected Enterprise Workflow**

### **Call Center Agent Workflow:**
1. **Start of shift**: Press F1 for "Customer Lookup" 
2. **Customer calls about claim**: Press F2 for "Claims Search"
3. **Need policy info**: Press F3 for "Policy Inquiry"  
4. **Create custom combo**: Select fields + Ctrl+Shift+S to save

### **Insurance Processor Workflow:**
1. **Morning claims review**: Press F2 for "Claims Search"
2. **Policy verification**: Press F3 for "Policy Inquiry"
3. **Employee lookup**: Press F4 for "Employee Search"
4. **Save frequently used combo**: Create preset for specific claim types

---

## ✅ **Success Indicators**

### **Visual Indicators:**
- ✅ Dark gradient toolbar appears at top
- ✅ Quick preset buttons show F1-F6 hotkeys
- ✅ Active preset name displays in center
- ✅ Field count updates in real-time
- ✅ Search highlighting works with yellow background
- ✅ Notifications slide in from right side

### **Functional Indicators:**
- ✅ F1-F6 keys instantly switch field combinations
- ✅ Ctrl+Shift+S opens save preset dialog
- ✅ Ctrl+F focuses search input
- ✅ Category filtering works immediately
- ✅ All keyboard shortcuts respond correctly

### **Performance Indicators:**
- ✅ Preset switching is instantaneous (<100ms)
- ✅ Search filtering is real-time without lag
- ✅ No console errors in browser developer tools
- ✅ Smooth animations and transitions

---

## 🐛 **Common Issues & Solutions**

### **Issue: F1-F6 keys don't work**
**Solution:** Make sure browser isn't capturing F-keys (try in different browser)

### **Issue: Search doesn't highlight matches**  
**Solution:** Try typing slower - it's debounced for performance

### **Issue: Presets don't save between sessions**
**Solution:** Check if localStorage is enabled in browser

### **Issue: Mobile toolbar looks broken**
**Solution:** Try refreshing page - CSS might not have loaded fully

### **Issue: Fields don't appear when preset is applied**
**Solution:** Open Fields Library panel first, then try preset

---

## 📊 **Performance Testing**

### **Field Load Test:**
1. **Open Fields Library**
2. **Should see 40+ realistic enterprise fields**
3. **Search should work instantly** even with many fields
4. **Pagination should handle large field sets**

### **Memory Test:**
1. **Create 10+ presets**
2. **Switch between them rapidly**
3. **No memory leaks or slowdown should occur**

### **Mobile Test:**
1. **Test on actual mobile device or dev tools**
2. **Touch interactions should work smoothly**
3. **Text should be readable without zooming**

---

## 🎯 **Real-World Testing Scenarios**

### **Scenario 1: New Employee Training**
1. **Show new user the F1-F6 presets**
2. **Demonstrate search functionality**
3. **Let them create their first custom preset**

### **Scenario 2: High-Volume Call Center**
1. **Rapidly switch between F1 (Customer) and F2 (Claims)**
2. **Use search to find specific fields quickly**
3. **Save commonly used combinations**

### **Scenario 3: Power User Efficiency**
1. **Use only keyboard shortcuts**
2. **Never touch the mouse**
3. **Complete full workflow in under 30 seconds**

---

## 📈 **Success Metrics**

### **Speed Improvements:**
- **Preset switching**: Should be <100ms
- **Search results**: Should appear instantly while typing
- **Field selection**: Should be one-click or keypress

### **User Experience:**
- **Learning curve**: New users should understand presets in <2 minutes  
- **Error rate**: Users should rarely select wrong fields with presets
- **Efficiency**: Power users should be 50%+ faster than before

### **Technical Performance:**
- **Load time**: Enterprise features shouldn't add >500ms to load
- **Memory usage**: Should remain stable during extended use
- **Browser compatibility**: Should work identically across browsers

---

## 🎉 **Testing Complete!**

If all tests pass, your enterprise Dynamic Field Selector is ready for production use. The implementation provides:

- ⚡ **Instant context switching** for different search scenarios
- 🔍 **Advanced search and filtering** for 40+ enterprise fields  
- ⌨️ **Complete keyboard navigation** for power users
- 📱 **Mobile-responsive design** for any device
- 🎯 **Professional enterprise interface** suitable for corporate environments

Your users can now work more efficiently with standardized presets while maintaining the flexibility to create custom field combinations as needed.