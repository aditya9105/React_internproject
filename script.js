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

  if (!confirm(`Are you sure you want to delete ${ids.length} entries?`)) return;

  const promises = ids.map(id => {
    const dbRef = ref(database, `formResponses/${id}`);
    return remove(dbRef);
  });

  await Promise.all(promises);
  alert(`✅ ${ids.length} entries deleted.`);
};

$(document).ready(function () {
  let deleteMode = false;
  let allEntries = [];
  let filteredEntries = [];
  let currentPage = 1;
  const pageSize = 20;

  function renderTablePage(entries) {
    const tbody = $("#entryTable tbody");
    tbody.empty();

    const start = (currentPage - 1) * pageSize;
    const pagedEntries = entries.slice(start, start + pageSize);

    pagedEntries.forEach(entry => {
      const row = $("<tr>");
      row.append(`<td class="delete-col d-none"><input type="checkbox" class="row-check d-none" data-id="${entry.id}"></td>`);
      row.append(`<td>${entry.name}</td>`);
      row.append(`<td>${entry.lastName}</td>`);
      row.append(`<td>${entry.email}</td>`);
      row.append(`<td>${entry.mobile}</td>`);
      row.append(`<td>${entry.company}</td>`);
      row.append(`<td>${entry.dob}</td>`);
      row.append(`<td>${entry.gender}</td>`);
      row.append(`<td><img src="${entry.selectedImage}" class="img-thumb"></td>`);
      row.append(`
        <td>
          <button class="btn btn-sm btn-primary mr-1" onclick="openUpdateModal('${entry.id}')">Update</button>
          <button class="btn btn-sm btn-danger" onclick="window.confirmAndDelete(['${entry.id}'])">Delete</button>
        </td>
      `);
      tbody.append(row);
    });

    $("#entryTable").trigger("update");

    const totalPages = Math.ceil(entries.length / pageSize) || 1;
    $(".pagedisplay").text(`Page ${currentPage} of ${totalPages}`);
    $(".first, .prev").prop("disabled", currentPage === 1);
    $(".next, .last").prop("disabled", currentPage === totalPages);
  }

  $("#entryTable").tablesorter({
    theme: "bootstrap",
    widgets: ["stickyHeaders"],
    headers: {
      8: { sorter: false },
      9: { sorter: false }
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

  $("#toggleDeleteMode").on("click", function () {
    deleteMode = !deleteMode;
    $(".delete-col, .row-check").toggleClass("d-none", !deleteMode);
    $("#deleteSelected").toggleClass("d-none", !deleteMode);
    $(this)
      .removeClass("btn-danger btn-secondary")
      .addClass(deleteMode ? "btn-secondary" : "btn-danger")
      .text(deleteMode ? "❌ Cancel Delete Mode" : "Enable Delete Mode");
    $("#selectAll").prop("checked", false);
  });

  $("#selectAll").on("change", function () {
    const isChecked = $(this).is(":checked");
    $(".row-check").prop("checked", isChecked);
  });

  $("#deleteSelected").on("click", async function () {
    const ids = $(".row-check:checked").map(function () {
      return $(this).data("id");
    }).get();

    if (ids.length === 0) {
      alert("⚠️ Please choose at least one entry to delete.");
      return; // DO NOT exit delete mode
    }

    await window.confirmAndDelete(ids);

    // Now exit delete mode AFTER deletion
    deleteMode = false;
    $(".delete-col, .row-check").addClass("d-none");
    $("#deleteSelected").addClass("d-none");
    $("#toggleDeleteMode")
      .removeClass("btn-secondary")
      .addClass("btn-danger")
      .text("Enable Delete Mode");
    $("#selectAll").prop("checked", false);

    setTimeout(() => location.reload(), 1000);
  });


  $(".first").on("click", function () {
    currentPage = 1;
    renderTablePage(filteredEntries.length ? filteredEntries : allEntries);
  });

  $(".prev").on("click", function () {
    if (currentPage > 1) currentPage--;
    renderTablePage(filteredEntries.length ? filteredEntries : allEntries);
  });

  $(".next").on("click", function () {
    const totalPages = Math.ceil((filteredEntries.length ? filteredEntries : allEntries).length / pageSize);
    if (currentPage < totalPages) currentPage++;
    renderTablePage(filteredEntries.length ? filteredEntries : allEntries);
  });

  $(".last").on("click", function () {
    currentPage = Math.ceil((filteredEntries.length ? filteredEntries : allEntries).length / pageSize);
    renderTablePage(filteredEntries.length ? filteredEntries : allEntries);
  });

  window.listenToFirebase(entries => {
    allEntries = entries;
    currentPage = 1;
    renderTablePage(allEntries);
  });
});
