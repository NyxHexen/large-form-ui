import generateRandomFields from "./generateRandomFields.js";
import generateTestableFields from "./generateTestableFields.js";

class ManyFieldsFormManager {
  constructor() {
    this.fields = generateTestableFields(31);
    this.fields[0].type = "date";
    this.PIP_LENGTH = 21;
    this.FORM_LENGTH = 11;

    this.pipsDiv = document.querySelector(".pips");
    this.pipsList = document.querySelector(".pips-list");
    this.searchForm = document.querySelector(".flds-container>div");
  }

  init() {
    if (this.fields) {
      let isInCookie = this.getCookie("favFieldsList");

      const tempPipsList = this.fields.map((field) => {
        this.pipMng(field, "add");
        if (isInCookie.includes(field.id)) {
          this.fieldMng("add", field);
        }
      });
    }
  }

  getCookie(cname) {
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

  setCookie(cname, cvalue, exdays) {
    const d = new Date();
    d.setTime(d.getTime() + exdays * 24 * 60 * 60 * 1000);
    let expires = "expires=" + d.toUTCString();
    let stringVal = cvalue instanceof Array ? cvalue.join(",") : cvalue;
    document.cookie = cname + "=" + stringVal + ";" + expires + "; path=/";
  }

  deleteCookie(cname) {
    this.setCookie(cname, "", -1);
  }

  pipGen(field) {
    const li = document.createElement("li");
    let isInCookie = this.getCookie("favFieldsList");
    isInCookie = isInCookie.includes(field.id);

    li.classList = `${field.id}-pip ${
      isInCookie ? "active favourite" : ""
    } ps-1 pe-4 mb-2`;
    li.innerHTML = `
    <i class="fa-solid fa-plus text-success ps-1"></i>
    <span class="ps-4">${field.name}</span>
    <i class="fa-${isInCookie ? "solid" : "regular"} fa-star"></i>
    `;
    return li;
  }

  pipMng(field, action) {
    if (field && action == "add") {
      const newPip = this.pipGen(field);

      const updateField = () => {
        const fieldEl =
          document.querySelector(`[id*=${field.id}_fld]`) ||
          document.querySelector(`[id*=${field.id}_from_fld]`);
        this.fieldMng(fieldEl ? "remove" : "add", field);
      };

      newPip.addEventListener("click", () => {
        let isInCookie = this.getCookie("favFieldsList");
        isInCookie = isInCookie.includes(field.id);

        if (newPip.classList.contains("active")) {
          newPip.classList.remove("active");
          newPip.classList.contains("favourite")
            ? newPip.classList.remove("favourite")
            : "";
        } else {
          if (isInCookie) {
            newPip.classList.add("active");
            newPip.classList.add("favourite");
          } else {
            newPip.classList.add("active");
          }
        }

        updateField();
      });

      newPip.querySelector(".fa-star").addEventListener("click", (e) => {
        e.stopPropagation();
        let thisEl = e.target;
        let parentEl = e.target.parentElement;
        let favListCookie = this.getCookie("favFieldsList");

        if (thisEl.classList.contains("fa-solid")) {
          parentEl.classList.remove("favourite");
          thisEl.classList.remove("fa-solid");
          thisEl.classList.add("fa-regular");
        } else {
          parentEl.classList.add("favourite");
          thisEl.classList.add("fa-solid");
          thisEl.classList.remove("fa-regular");
        }

        if (favListCookie) {
          if (favListCookie.includes(field.id)) {
            let updatedList = favListCookie.filter((item) => {
              return item !== field.id;
            });
            this.setCookie("favFieldsList", updatedList, 999);
          } else {
            this.setCookie(
              "favFieldsList",
              `${favListCookie + "," + field.id}`,
              999
            );
          }
        } else {
          this.setCookie("favFieldsList", `${field.id}`, 999);
        }
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
      // To Do - Figure out if I need this.
      console.log("Update!");
    }
  }

  fieldGen(field) {
    const newFieldEl = document.createElement("div");
    newFieldEl.classList.add("mb-1");
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

    newFieldEl.innerHTML += `
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
    `;

    return newFieldEl;
  }

  fieldMng(action, field) {
    // Check if both action and field are provided
    if (action && field) {
      if (action == "add") {
        // Check if the number of child elements in searchForm is divisible by FORM_LENGTH
        if ((this.searchForm.childElementCount + 1) % this.FORM_LENGTH) {
          // Add the field using fieldGen
          let newField = this.fieldGen(field);
          this.searchForm.append(newField);
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
    this.searchForm.append(this.fieldGen(field));
  }

  // Function to remove a field element
  removeField(field) {
    let fieldToRemove =
      document.querySelector(`[id*=${field.id}_fld]`) ||
      document.querySelector(`[id*=${field.id}_from_fld]`);
    if (field.type == "date") {
      fieldToRemove.parentElement.parentElement.remove();
    } else {
      fieldToRemove.parentElement.remove();
    }
  }
}

const FormManager = new ManyFieldsFormManager();
FormManager.init();
