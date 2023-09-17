import generateRandomFields from "./generateRandomFields.js";

class ManyFieldsFormManager {
  constructor() {
    this.fields = generateRandomFields(32);
    this.PIP_LENGTH = 21;
    this.FORM_LENGTH = 11;

    this.pipsDiv = document.querySelector(".pips");
    this.pipsList = document.querySelector(".pips-list");
    this.searchForm = document.querySelector(".flds-container>div");
  }

  init() {
    if (this.fields) {
      const tempPipsList = this.fields.map((field) => {
        this.pipMng(field, "add");
      });
    }
  }

  pipGen(field) {
    const li = document.createElement("li");
    li.classList = `${field.id}-pip ps-1 pe-1 mb-2`;
    li.innerHTML = `
    <i class="fa-solid fa-plus text-success ps-1"></i>
    <span class="ps-3 pe-2">${field.name}</span>
    `;
    return li;
  }

  pipMng(field, action) {
    if (field && action == "add") {
      const newPip = this.pipGen(field);
      const fieldEl = document.querySelector(`[id*=${field.id}]`);

      const updateField = () => {
        // To-Do - Find a way to do this without having to reset pipsList
        // each time
        // To-Do - Find a way to have pips that are being added back by removing a field
        // to be added all the way back. If the first ul is empty - get rid of it and add
        // a new one at the back.
        this.fieldMng({
          field,
          action: fieldEl ? "remove" : "add",
        });
      };

      newPip.addEventListener("click", () => {
        updateField();
      });

      let pipLists = this.pipsList.parentElement.querySelectorAll("ul");
      let tempList = [];

      if ((this.pipsList.children.length + 1) % this.PIP_LENGTH != 0) {
        this.pipsList.append(newPip);
      } else {
        const newCol = document.createElement("ul");
        newCol.classList = "pips-list p-0 me-2";

        if (pipLists.length > 1) {
          let minIndex;

          for (let i = 0; i < pipLists.length; i++) {
            if (pipLists[i].children.length < this.PIP_LENGTH - 1) {
              minIndex = i;
            }
          }

          if (minIndex == undefined) {
            this.pipsList.after(newCol);
            this.pipsList = newCol;
            this.pipsList.append(newPip);
          } else {
            this.pipsList = pipLists[minIndex];
            this.pipsList.append(newPip);
          }
        } else {
          this.pipsList.after(newCol);
          this.pipsList = newCol;
          this.pipsList.append(newPip);
        }
      }
    } else if (field && action == "update") {
      console.log("Update!");
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

  fieldMng(action, field) {
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
