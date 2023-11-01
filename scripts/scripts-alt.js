import generateRandomFields from "./utils/generateRandomFields.js";
import generateTestableFields from "./utils/generateTestableFields.js";

const defaultConfig = {
  DEFAULT_PIP_LENGTH: 20,
  DEFAULT_FORM_LENGTH: 10,
};

function getCookie(cname) {
  let name = cname + "=";
  let decodedCookie = decodeURIComponent(document.cookie);
  let ca = decodedCookie.split(";");
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) == " ") {
      c = c.substring(1);
    }
    if (c.indexOf(name) == 0) {
      return c.substring(name.length, c.length).split(",");
    }
  }
  console.error(`Cookie not found -- ${cname}`);
  return "";
}

function setCookie(cname, cvalue, exdays) {
  const d = new Date();
  d.setTime(d.getTime() + exdays * 24 * 60 * 60 * 1000);
  let expires = "expires=" + d.toUTCString();
  let stringVal = cvalue instanceof Array ? cvalue.join(",") : cvalue;
  document.cookie = cname + "=" + stringVal + ";" + expires + "; path=/";
}

function cookieState(fieldId) {
  let cookie = getCookie("favFieldsList");
  let fieldInCookie = fieldId ? cookie.includes(fieldId) : false;
  return [cookie, fieldInCookie || undefined];
}

function findAvailableList(lists, maxItems) {
  for (let i = 0; i < lists.length; i++) {
    if (
      lists[i].children.length % maxItems !== 0 ||
      lists[i].children.length === 0
    ) {
      return lists[i];
    }
  }
  return null; // No available list found
}

class Pip {
  constructor(field) {
    this.field = field;
    this.fieldEl = new Field(field, cookieState(this.field.id)[1]);
    this.pipEl = this.pipHtml();
    this.add();
  }

  pipHtml() {
    const li = document.createElement("li");
    const [_, isInCookie] = cookieState(this.field.id);

    li.classList = `${this.field.id}-pip ${
      isInCookie ? "active favourite" : ""
    } ps-1 pe-4 mb-2`;
    li.innerHTML = `
    <i class="fa-solid fa-plus text-success ps-1"></i>
    <span class="ps-4">${this.field.name}</span>
    <i class="fa-${isInCookie ? "solid" : "regular"} fa-star"></i>
    `;
    return li;
  }

  add() {
    const pipLists = document.querySelectorAll(".pips-list");
    const currentPipList = findAvailableList(
      pipLists,
      defaultConfig.DEFAULT_PIP_LENGTH
    );

    if (currentPipList) {
      currentPipList.append(this.pipEl);
    }

    this.pipEl.addEventListener("click", (e) => {
      const [favesCookie, isInCookie] = cookieState(this.field.id);
      const target = e.target;
      const starIsClicked = target.classList.contains("fa-star");

      if (starIsClicked) {
        if (target.classList.contains("fa-solid")) {
          this.pipEl.classList.remove("favourite");
          target.classList.replace("fa-solid", "fa-regular");
        } else {
          this.pipEl.classList.add("favourite");
          target.classList.replace("fa-regular", "fa-solid");
        }

        if (favesCookie) {
          const updatedList = isInCookie
            ? favesCookie.filter((item) => item != this.field.id)
            : `${favesCookie},${this.field.id}`;

          setCookie("favFieldsList", updatedList, 999);
        } else {
          setCookie("favFieldsList", `${this.field.id}`, 999);
        }
      } else {
        if (this.pipEl.classList.contains("active")) {
          this.pipEl.classList.remove("active", "favourite");
        } else if (isInCookie) {
          this.pipEl.classList.add("active", "favourite");
        } else {
          this.pipEl.classList.add("active");
        }

        this.fieldEl[this.fieldEl.isActive ? "remove" : "add"]();
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
    const newFieldEl = document.createElement("div");
    newFieldEl.classList.add("mb-1");
    const dateField = this.field.type === "date";
    let addlFields = "";

    if (dateField) {
      addlFields = `
        <span class="date-to fld-label"> to </span>
        <input
        type="${this.field.type}"
        name="${this.field.id}"
        id="${this.field.id + "_to_fld"}"
        class="form-control"
      />
    `;
    }

    newFieldEl.innerHTML += `
      <label for="${this.field.id + "_to_fld"}" class="fld-label">${
      this.field.name
    }</label>
      ${
        this.field.type == "date"
          ? '<div class="d-flex align-items-center">'
          : ""
      }
      <input
        type="${this.field.type}"
        name="${this.field.id}"
        id="${
          this.field.type == "date"
            ? this.field.id + "_from_fld"
            : this.field.id + "_fld"
        }"
        class="form-control"
      />
      ${addlFields}
    `;
    return newFieldEl;
  }

  add() {
    let fldLists = document.querySelectorAll(".flds");
    let currentFldList = findAvailableList(
      fldLists,
      defaultConfig.DEFAULT_FORM_LENGTH
    );

    if (currentFldList) {
      this.isActive = true;
      currentFldList.append(this.fieldEl);
    }
  }

  remove() {
    this.isActive = false;
    this.fieldEl.remove();
  }
}

class ManyFieldsFormManager {
  constructor(fieldsList) {
    this.FIELDS_LIST = fieldsList;
    this.pipObjArray = [];
    this.init();
  }

  init() {
    const pipDiv = document.querySelector(".pips");
    const pipListsCount = Math.ceil(
      this.FIELDS_LIST.length / defaultConfig.DEFAULT_PIP_LENGTH
    );
    const fieldsDiv = document.querySelector(".flds-container");
    const fieldListsCount = Math.ceil(
      this.FIELDS_LIST.length / defaultConfig.DEFAULT_FORM_LENGTH
    );

    for (let i = 0; i < pipListsCount; i++) {
      const newCol = document.createElement("ul");
      newCol.classList = "pips-list p-0 me-2";
      pipDiv.append(newCol);
    }

    for (let i = 0; i < fieldListsCount - 1; i++) {
      let newCol = document.createElement("div");
      newCol.classList =
        "flds d-flex flex-column h-100 ms-5 align-items-center";
      fieldsDiv.append(newCol);
    }

    this.FIELDS_LIST.forEach((field) => {
      this.pipObjArray.push(new Pip(field, defaultConfig.DEFAULT_PIP_LENGTH));
    });
  }
}

let tempFormManager = new ManyFieldsFormManager(generateTestableFields(40));
