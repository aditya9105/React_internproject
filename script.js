import {
  initializeApp
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import {
  getDatabase,
  ref,
  set,
  push,
  onValue,
  remove,
  update
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyDzH5UiDJNkVd4yoKGRon9AGqmSxkY0l90",
  authDomain: "reactinternproject.firebaseapp.com",
  databaseURL: "https://reactinternproject-default-rtdb.asia-southeast1.firebasedatabase.app/",
  projectId: "reactinternproject",
  storageBucket: "reactinternproject.appspot.com",
  messagingSenderId: "12894491806",
  appId: "1:12894491806:web:97fc439319fdbfcf8d578f",
  measurementId: "G-ZMMDT0XP2Y"
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

window.firebaseRef = (path) => ref(database, path);
window.firebaseSet = set;
window.firebasePush = push;
window.firebaseOnValue = onValue;
window.firebaseRemove = remove;
window.firebaseUpdate = update;

let allEntries = [];
let filteredEntries = [];
let currentPage = 1;
const pageSize = 20;
const selectedIds = new Set();

window.listenToFirebase = (callback) => {
  const dbRef = ref(database, "formResponses");
  onValue(dbRef, (snapshot) => {
    const data = snapshot.val() || {};
    const entries = Object.entries(data).map(([id, value]) => ({
      id,
      ...value
    }));
    entries.sort((a, b) => b.timestamp - a.timestamp);
    callback(entries);
  });
};

window.confirmAndDelete = async (ids = []) => {
  if (ids.length === 0) {
    alert("⚠️ Please choose at least one entry to delete.");
    return;
  }

  const confirmed = confirm(`Are you sure you want to delete ${ids.length} entries?`);
  if (!confirmed) return;

  const promises = ids.map(id => {
    const dbRef = ref(database, `formResponses/${id}`);
    return remove(dbRef);
  });

  await Promise.all(promises);
  ids.forEach(id => selectedIds.delete(id)); // Remove deleted IDs from selection
  alert(`✅ ${ids.length} entries deleted.`);

  // Refresh view without reloading
  renderTablePage(filteredEntries.length ? filteredEntries : allEntries);
};

// function renderTablePage(entries) {
//   const tbody = $("#entryTable tbody");
//   tbody.empty();

//   const start = (currentPage - 1) * pageSize;
//   const pagedEntries = entries.slice(start, start + pageSize);

//   pagedEntries.forEach(entry => {
//     const isChecked = selectedIds.has(entry.id);
//     const row = $("<tr>");
//     row.append(`<td class="delete-col"><input type="checkbox" class="row-check" data-id="${entry.id}" ${isChecked ? 'checked' : ''}></td>`);
//     row.append(`<td>${entry.name}</td>`);
//     row.append(`<td>${entry.lastName}</td>`);
//     row.append(`<td>${entry.email}</td>`);
//     row.append(`<td>${entry.mobile}</td>`);
//     row.append(`<td>${entry.company}</td>`);
//     row.append(`<td>${entry.dob}</td>`);
//     row.append(`<td>${entry.gender}</td>`);
//     row.append(`<td><img src="${entry.selectedImage}" class="img-thumb"></td>`);
//     const subjects = Array.isArray(entry.selectedSubjects) ? entry.selectedSubjects.join(", ") : "";
//     row.append(`<td><div class="subject-scroll-cell">${subjects}</div></td>`);
//     row.append(`
//       <td>
//         <button class="btn btn-sm btn-primary mr-1" onclick="openUpdateModal('${entry.id}')">Update</button>
//         <button class="btn btn-sm btn-danger" onclick="window.confirmAndDelete(['${entry.id}'])">Delete</button>
//       </td>
//     `);
//     tbody.append(row);
//   });

//   $("#entryTable").trigger("update");

//   const totalPages = Math.ceil(entries.length / pageSize) || 1;
//   $(".pagedisplay").text(`Page ${currentPage} of ${totalPages}`);
//   $(".first, .prev").prop("disabled", currentPage === 1);
//   $(".next, .last").prop("disabled", currentPage === totalPages);

//   updateSelectAllCheckbox();
// }
function renderTablePage(entries) {
  const tbody = $("#entryTable tbody");
  tbody.empty();

  const start = (currentPage - 1) * pageSize;
  const pagedEntries = entries.slice(start, start + pageSize);

  pagedEntries.forEach(entry => {
    const isChecked = selectedIds.has(entry.id);
    const subjects = Array.isArray(entry.selectedSubjects) ? entry.selectedSubjects.join(", ") : "";

    const rowHtml = `
      <tr>
        <td class="delete-col">
          <input type="checkbox" class="row-check" data-id="${entry.id}" ${isChecked ? 'checked' : ''}>
        </td>
        <td>${entry.name}</td>
        <td>${entry.lastName}</td>
        <td>${entry.email}</td>
        <td>${entry.mobile}</td>
        <td>${entry.company}</td>
        <td>${entry.dob}</td>
        <td>${entry.gender}</td>
        <td><img src="${entry.selectedImage}" class="img-thumb" /></td>
        <td><div class="subject-scroll-cell">${subjects}</div></td>
        <td>
          <button class="btn btn-sm btn-primary mr-1" onclick="openUpdateModal('${entry.id}')">Update</button>
          <button class="btn btn-sm btn-danger" onclick="window.confirmAndDelete(['${entry.id}'])">Delete</button>
        </td>
      </tr>
    `;

    tbody.append(rowHtml);
  });

  $("#entryTable").trigger("update");

  const totalPages = Math.ceil(entries.length / pageSize) || 1;
  $(".pagedisplay").text(`Page ${currentPage} of ${totalPages}`);
  $(".first, .prev").prop("disabled", currentPage === 1);
  $(".next, .last").prop("disabled", currentPage === totalPages);

  updateSelectAllCheckbox();
}


function updateSelectAllCheckbox() {
  const entriesToCheck = filteredEntries.length ? filteredEntries : allEntries;
  const allSelected = entriesToCheck.length > 0 && entriesToCheck.every(entry => selectedIds.has(entry.id));
  $("#selectAll").prop("checked", allSelected);
}

$(document).ready(function () {
  $("#entryTable").tablesorter({
    theme: "bootstrap",
    widgets: ["stickyHeaders"],
    headers: {
      8: { sorter: false },
      9: { sorter: false },
      10: { sorter: false }
    },
    widgetOptions: {
      stickyHeaders: ''
    }
  });

  $("#searchInput").on("keyup", function () {
    const query = $(this).val().toLowerCase();
    filteredEntries = !query
      ? allEntries
      : allEntries.filter(entry => {
          const searchableText = [
            entry.name,
            entry.lastName,
            entry.email,
            entry.mobile,
            entry.company,
            entry.dob,
            entry.gender
          ].join(" ").toLowerCase();

          return searchableText.includes(query);
        });

    currentPage = 1;
    renderTablePage(filteredEntries);
  });

  $("#selectAll").on("change", function () {
    const isChecked = $(this).is(":checked");
    const entriesToSelect = filteredEntries.length ? filteredEntries : allEntries;

    if (isChecked) {
      entriesToSelect.forEach(entry => selectedIds.add(entry.id));
    } else {
      entriesToSelect.forEach(entry => selectedIds.delete(entry.id));
    }

    renderTablePage(entriesToSelect);
  });

  $(document).on("change", ".row-check", function () {
    const id = $(this).data("id");
    if ($(this).is(":checked")) {
      selectedIds.add(id);
    } else {
      selectedIds.delete(id);
    }
    updateSelectAllCheckbox();
  });

  $("#deleteSelected").on("click", async function () {
    if (selectedIds.size === 0) {
      alert("⚠️ Please select at least one entry to delete.");
      return;
    }

    await window.confirmAndDelete(Array.from(selectedIds));
  });

  $(".first").on("click", () => {
    currentPage = 1;
    renderTablePage(filteredEntries.length ? filteredEntries : allEntries);
  });

  $(".prev").on("click", () => {
    if (currentPage > 1) currentPage--;
    renderTablePage(filteredEntries.length ? filteredEntries : allEntries);
  });

  $(".next").on("click", () => {
    const totalPages = Math.ceil((filteredEntries.length ? filteredEntries : allEntries).length / pageSize);
    if (currentPage < totalPages) currentPage++;
    renderTablePage(filteredEntries.length ? filteredEntries : allEntries);
  });

  $(".last").on("click", () => {
    currentPage = Math.ceil((filteredEntries.length ? filteredEntries : allEntries).length / pageSize);
    renderTablePage(filteredEntries.length ? filteredEntries : allEntries);
  });

  window.listenToFirebase(entries => {
    allEntries = entries;
    currentPage = 1;
    renderTablePage(allEntries);
  });

  window.addEventListener("message", function(event) {
    if (event.data === "refreshParent") {
      $("#entryModal").modal("hide");
      setTimeout(() => location.reload(), 500);
    }
  });
});


