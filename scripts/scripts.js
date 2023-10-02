import generateRandomFields from "./generateRandomFields.js";

// const fields = [
//   {
//     name: "Effective Date",
//     id: "effective_date",
//     type: "date",
//   },
//   {
//     name: "Expiry Date",
//     id: "expiry_date",
//     type: "date",
//   },
//   {
//     name: "Member ID",
//     id: "member_id",
//     type: "text",
//   },
//   {
//     name: "External ID",
//     id: "external_id",
//     type: "text",
//   },
//   {
//     name: "Name",
//     id: "name",
//     type: "text",
//   },
//   {
//     name: "Country",
//     id: "country",
//     type: "text",
//   },
//   {
//     name: "User Variable",
//     id: "user_var",
//     type: "text",
//   },
//   {
//     name: "Field 8",
//     id: "field_8",
//     type: "text",
//   },
//   {
//     name: "Field 9",
//     id: "field_9",
//     type: "text",
//   },
//   {
//     name: "Field 10",
//     id: "field_10",
//     type: "text",
//   },
//   {
//     name: "Field 11",
//     id: "field_11",
//     type: "text",
//   },
//   {
//     name: "Field 12",
//     id: "field_12",
//     type: "text",
//   },
//   {
//     name: "Field 13",
//     id: "field_13",
//     type: "text",
//   },
//   {
//     name: "Field 14",
//     id: "field_14",
//     type: "text",
//   },
//   {
//     name: "Field 15",
//     id: "field_15",
//     type: "text",
//   },
//   {
//     name: "Field 16",
//     id: "field_16",
//     type: "text",
//   },
//   {
//     name: "Field 17",
//     id: "field_17",
//     type: "text",
//   },
//   {
//     name: "Field 18",
//     id: "field_18",
//     type: "text",
//   },
//   {
//     name: "Field 19",
//     id: "field_19",
//     type: "text",
//   },
//   {
//     name: "Field 20",
//     id: "field_20",
//     type: "text",
//   },
//   {
//     name: "Field 20",
//     id: "field_21",
//     type: "text",
//   },
//   {
//     name: "Field 22",
//     id: "field_21",
//     type: "text",
//   },
//   {
//     name: "Field 23",
//     id: "field_22",
//     type: "text",
//   },
//   {
//     name: "Field 24",
//     id: "field_23",
//     type: "text",
//   },
//   {
//     name: "Field 25",
//     id: "field_24",
//     type: "text",
//   },
//   {
//     name: "Field 26",
//     id: "field_25",
//     type: "text",
//   },
//   {
//     name: "Field 27aaaaaaaaaaaaaaaaaaaaaaaaaa",
//     id: "field_26",
//     type: "text",
//   },
//   {
//     name: "Field 28",
//     id: "field_27",
//     type: "text",
//   },
//   {
//     name: "Field 29",
//     id: "field_28",
//     type: "text",
//   },
//   {
//     name: "Field 30",
//     id: "field_29",
//     type: "text",
//   },
// ];

const fields = generateRandomFields(32);
const DEFAULT_LENGTH = 9;

const availFieldsDiv = document.querySelector(".avail-fields");
const availFieldsList = document.querySelector(".avail-fields-list");
const activeFieldsList = document.querySelector(".active-fields-list");
let searchForm = document.querySelector(".flds-container>div");
let currentList;

function init() {
  if (fields) {
    const pipEl = fields.map((field) =>
      pipMng({ field, list: availFieldsList, action: "add" })
    );
    currentList = undefined;
  }
}

function pipGen(name, icon) {
  const li = document.createElement("li");
  li.innerHTML = `
  <i class="fa-solid fa-${
    icon === "plus" ? "plus text-success" : "minus text-danger"
  } ps-1"></i>
  <span class="ps-3 pe-2">${name}</span>
  `;
  return li;
}

function pipMng(args) {
  const { field, list, action } = args;
  const pipSwitch = list.classList.contains(`active-fields-list`);
  const newPip = pipGen(field.name, pipSwitch ? "minus" : "plus");
  const fieldEl = document.querySelector(`[id*=${field.id}]`);
  newPip.classList = `${
    (pipSwitch ? "active" : "avail") + "_" + field.id
  } field-${action} ps-1 mb-2`;

  // To-Do - Add position to each field so it can be organized additionally,
  // and will help with positioning/sorting.
  // To-Do - Reset button.
  // To-Do  Create buttons to organize the pips, "A-Z" or "Z-A".

  function setField() {
    // To-Do - Find a way to do this without having to reset currentList
    // each time
    // To-Do - Find a way to have pips that are being added back by removing a field
    // to be added all the way back. If the first ul is empty - get rid of it and add
    // a new one at the back.
    fieldMng({
      field,
      action: fieldEl ? "remove" : "add",
    });
    pipMng({
      field,
      list: pipSwitch ? activeFieldsList : availFieldsList,
      action: "remove",
    });
    currentList = undefined;
    pipMng({
      field,
      list: pipSwitch ? availFieldsList : activeFieldsList,
      action: "add",
    });
    currentList = undefined;
  }

  newPip.addEventListener("click", () => {
    setField();
  });

  if (!currentList) {
    currentList = list;
  }

  let pipLists = currentList.parentElement.querySelectorAll("ul");
  let tempList = [];

  if (action == "add") {
    if ((currentList.children.length + 1) % DEFAULT_LENGTH != 0) {
      currentList.append(newPip);
    } else {
      const newCol = document.createElement("ul");
      newCol.classList = "avail-fields-list p-0 me-2";

      if (pipLists.length > 1) {
        let minIndex;

        for (let i = 0; i < pipLists.length; i++) {
          if (pipLists[i].children.length < DEFAULT_LENGTH - 1) {
            minIndex = i;
          }
        }

        if (minIndex == undefined) {
          currentList.after(newCol);
          currentList = newCol;
          currentList.append(newPip);
        } else {
          currentList = pipLists[minIndex];
          currentList.append(newPip);
          console.log(currentList);
        }
      } else {
        currentList.after(newCol);
        currentList = newCol;
        currentList.append(newPip);
      }
    }
  } else if (action == "remove") {
    let pipToDel = document.querySelector(
      `[class*=${(pipSwitch ? "active_" : "avail_") + field.id}]`
    );
    pipToDel.remove();
  }
}

function fieldGen(field) {
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
    <label for="${field.id + "_to_fld"}" class="fld-label">${field.name}</label>
    ${field.type == "date" ? '<div class="d-flex align-items-center">' : ""}
    <input
      type="${field.type}"
      name="${field.id}"
      id="${field.type == "date" ? field.id + "_from_fld" : field.id + "_fld"}"
      class="form-control"
    />
    ${addlFields}
  </div>
  `;
}

function fieldMng(args) {
  let { action, field } = args;

  // Check if both action and field are provided
  if (action && field) {
    if (action == "add") {
      // Check if the number of child elements in searchForm is divisible by DEFAULT_LENGTH
      if ((searchForm.childElementCount + 1) % DEFAULT_LENGTH) {
        // Add the field using fieldGen
        searchForm.innerHTML += fieldGen(field);
      } else {
        // Create a new column for fields
        addNewFieldColumn(field);
      }
    } else if (action == "remove") {
      // Remove the specified field element
      removeField(field);
    }
  }
}

// Function to add a new column for fields
function addNewFieldColumn(field) {
  let newCol = document.createElement("div");
  newCol.classList = "flds d-flex flex-column h-100 ms-5 align-items-center";
  searchForm.parentElement.children[
    searchForm.parentElement.children.length - 1
  ].after(newCol);
  searchForm = document.querySelectorAll(".flds-container>div")[
    searchForm.parentElement.children.length - 1
  ];
  searchForm.innerHTML += fieldGen(field);
}

// Function to remove a field element
function removeField(field) {
  let fieldToRemove = document.querySelector(`[id*=${field.id}]`);
  if (field.type == "date") {
    fieldToRemove.parentElement.parentElement.remove();
  } else {
    fieldToRemove.parentElement.remove();
  }
}

init();
