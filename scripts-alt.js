import generateRandomFields from "./generateRandomFields.js";

class ManyFieldsFormManager {
  constructor() {
    this.fields = generateRandomFields(32);
    this.DEFAULT_LENGTH = 11;

    this.availFieldsDiv = document.querySelector(".avail-fields");
    this.availFieldsList = document.querySelector(".avail-fields-list");
    this.activeFieldsList = document.querySelector(".active-fields-list");
    this.searchForm = document.querySelector(".flds-container>div");
    this.currentList;
  }

  init() {
    if (this.fields) {
      const pipEl = this.fields.map((field) =>
        this.pipMng({ field, list: this.availFieldsList, action: "add" })
      );
      this.currentList = undefined;
    }
  }

  pipGen(name, icon) {
    const li = document.createElement("li");
    li.innerHTML = `
    <i class="fa-solid fa-${
      icon === "plus" ? "plus text-success" : "minus text-danger"
    } ps-1"></i>
    <span class="ps-3 pe-2">${name}</span>
    `;
    return li;
  }

  pipMng(args) {
    const { field, list, action } = args;
    const isActiveList = list.classList.contains(`active-fields-list`);
    const newPip = this.pipGen(field.name, isActiveList ? "minus" : "plus");
    const fieldEl = document.querySelector(`[id*=${field.id}]`);
    newPip.classList = `${
      (isActiveList ? "active" : "avail") + "_" + field.id
    } field-${action} ps-1 mb-2`;

    // To-Do - Add position to each field so it can be organized additionally,
    // and will help with positioning/sorting.
    // To-Do - Reset button.
    // To-Do  Create buttons to organize the pips, "A-Z" or "Z-A".

    const setField = () => {
      // To-Do - Find a way to do this without having to reset currentList
      // each time
      // To-Do - Find a way to have pips that are being added back by removing a field
      // to be added all the way back. If the first ul is empty - get rid of it and add
      // a new one at the back.
      this.fieldMng({
        field,
        action: fieldEl ? "remove" : "add",
      });
      this.pipMng({
        field,
        list: isActiveList ? this.activeFieldsList : this.availFieldsList,
        action: "remove",
      });
      this.currentList = undefined;
      this.pipMng({
        field,
        list: isActiveList ? this.availFieldsList : this.activeFieldsList,
        action: "add",
      });
      this.currentList = undefined;
    };

    newPip.addEventListener("click", () => {
      setField();
    });

    if (!this.currentList) {
      this.currentList = list;
    }

    let pipLists = this.currentList.parentElement.querySelectorAll("ul");
    let tempList = [];

    if (action == "add") {
      if ((this.currentList.children.length + 1) % this.DEFAULT_LENGTH != 0) {
        this.currentList.append(newPip);
      } else {
        const newCol = document.createElement("ul");
        newCol.classList = "avail-fields-list p-0 me-2";

        if (pipLists.length > 1) {
          let minIndex;

          for (let i = 0; i < pipLists.length; i++) {
            if (pipLists[i].children.length < this.DEFAULT_LENGTH - 1) {
              minIndex = i;
            }
          }

          if (minIndex == undefined) {
            this.currentList.after(newCol);
            this.currentList = newCol;
            this.currentList.append(newPip);
          } else {
            this.currentList = pipLists[minIndex];
            this.currentList.append(newPip);
          }
        } else {
          this.currentList.after(newCol);
          this.currentList = newCol;
          this.currentList.append(newPip);
        }
      }
    } else if (action == "remove") {
      let pipToDel = document.querySelector(
        `[class*=${(isActiveList ? "active_" : "avail_") + field.id}]`
      );
      pipToDel.remove();
    }
  }

  fieldGen(field) {
    const dateField = field.type === "date";
    let addlFields = "";

    if (dateField) {
      addlFields = `
        <span class="date-to fld-label"> to </span>
        <input
        type="${field.type}"
        name="${field.id}"
        id="${field.id + "_to_fld"}"
        class="form-control"
      />
    `;
    }

    return `
    <div class="mb-1">
      <label for="${field.id + "_to_fld"}" class="fld-label">${
      field.name
    }</label>
      ${field.type == "date" ? '<div class="d-flex align-items-center">' : ""}
      <input
        type="${field.type}"
        name="${field.id}"
        id="${
          field.type == "date" ? field.id + "_from_fld" : field.id + "_fld"
        }"
        class="form-control"
      />
      ${addlFields}
    </div>
    `;
  }

  fieldMng(args) {
    let { action, field } = args;

    // Check if both action and field are provided
    if (action && field) {
      if (action == "add") {
        // Check if the number of child elements in searchForm is divisible by DEFAULT_LENGTH
        if ((this.searchForm.childElementCount + 1) % this.DEFAULT_LENGTH) {
          // Add the field using fieldGen
          this.searchForm.innerHTML += this.fieldGen(field);
        } else {
          // Create a new column for fields
          this.addNewFieldColumn(field);
        }
      } else if (action == "remove") {
        // Remove the specified field element
        this.removeField(field);
      }
    }
  }

  // Function to add a new column for fields
  addNewFieldColumn(field) {
    let newCol = document.createElement("div");
    newCol.classList = "flds d-flex flex-column h-100 ms-5 align-items-center";
    this.searchForm.parentElement.children[
      this.searchForm.parentElement.children.length - 1
    ].after(newCol);
    this.searchForm = document.querySelectorAll(".flds-container>div")[
      this.searchForm.parentElement.children.length - 1
    ];
    this.searchForm.innerHTML += this.fieldGen(field);
  }

  // Function to remove a field element
  removeField(field) {
    let fieldToRemove = document.querySelector(`[id*=${field.id}]`);
    if (field.type == "date") {
      fieldToRemove.parentElement.parentElement.remove();
    } else {
      fieldToRemove.parentElement.remove();
    }
  }
}

const FormManager = new ManyFieldsFormManager();
FormManager.init();
