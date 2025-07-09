import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import { getDatabase, ref, set, push, onValue, remove, update } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-database.js";

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
    const entries = Object.entries(data).map(([id, value]) => ({ id, ...value }));
    entries.sort((a, b) => b.timestamp - a.timestamp);
    callback(entries);
  });
};

window.renderTableRows = (entries) => {
  const tableBody = document.getElementById("dataTableBody");
  tableBody.innerHTML = "";

  entries.forEach(data => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${data.name}</td><td>${data.lastName}</td><td>${data.email}</td>
      <td>${data.mobile}</td><td>${data.company}</td><td>${data.dob}</td>
      <td>${data.gender}</td>
      <td><img src="${data.selectedImage}" style="width:50px;height:50px;object-fit:cover;"></td>
      <td>
        <a href="index.html?id=${data.id}" class="btn btn-sm btn-primary">Update</a>
        <button class="btn btn-sm btn-danger" onclick="confirmAndDelete('${data.id}')">Delete</button>
      </td>`;
    tableBody.appendChild(row);
  });
};

window.confirmAndDelete = (id) => {
  if (confirm("Are you sure you want to delete this entry?")) {
    const dbRef = ref(database, `formResponses/${id}`);
    remove(dbRef).then(() => {
      alert("✅ Entry deleted.");
    }).catch(err => {
      console.error("❌", err);
      alert("❌ Failed to delete entry.");
    });
  }
};
