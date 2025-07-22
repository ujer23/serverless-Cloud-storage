const API_BASE = "https://9kqqwyebd3.execute-api.us-east-1.amazonaws.com/prod";

const loginBtn = document.getElementById("loginBtn");
const loginPopup = document.getElementById("loginPopup");
const fileInput = document.getElementById("fileInput");
const progressArea = document.getElementById("progress-area");
const uploadStatus = document.getElementById("uploadStatus");

// Toggle login/logout
loginBtn.onclick = () => {
  const username = localStorage.getItem("username");
  if (username) {
    const confirmLogout = confirm(`Logout from ${username}?`);
    if (confirmLogout) {
      localStorage.removeItem("username");
      loginBtn.textContent = "🔐 Login / Sign Up";
      fileInput.disabled = true;
      if (uploadStatus) uploadStatus.style.display = "none";
      alert("Logged out successfully.");
    }
  } else {
    loginPopup.style.display = "flex";
  }
};

function closePopup() {
  loginPopup.style.display = "none";
}

// Login function
async function login() {
  const user = document.getElementById("username").value;
  const pass = document.getElementById("password").value;

  if (!user || !pass) return alert("Please enter both username and password.");

  try {
    const res = await fetch(`${API_BASE}/loginUser`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userid: user, password: pass })
    });

    const data = await res.json();

    if (res.ok && data.success) {
      alert("✅ Logged in as: " + user);
      localStorage.setItem("username", user);
      fileInput.disabled = false;
      loginBtn.textContent = user;
      if (uploadStatus) {
        uploadStatus.textContent = `Welcome back, ${user}! Start uploading your files.`;
        uploadStatus.style.display = "block";
      }
      closePopup();
    } else {
      alert("❌ Login failed: " + (data.message || "Invalid credentials"));
    }
  } catch (e) {
    alert("❌ Error logging in");
    console.error(e);
  }
}

// Signup function
async function signup() {
  const user = document.getElementById("username").value;
  const pass = document.getElementById("password").value;

  if (!user || !pass) return alert("Please enter both username and password.");

  try {
    const res = await fetch(`${API_BASE}/signupUser`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userid: user, password: pass })
    });

    const data = await res.json();

    if (res.ok && (data.message === "User registered successfully" || data.success)) {
      alert("✅ Signup successful. You are now logged in.");
      localStorage.setItem("username", user);
      fileInput.disabled = false;
      loginBtn.textContent = user;
      if (uploadStatus) {
        uploadStatus.textContent = `Welcome, ${user}! You can now upload files.`;
        uploadStatus.style.display = "block";
      }
      closePopup();
    } else {
      alert("❌ Signup failed: " + (data.message || "Try another username."));
    }
  } catch (e) {
    alert("❌ Error signing up");
    console.error(e);
  }
}

// On load
document.addEventListener("DOMContentLoaded", () => {
  const user = localStorage.getItem("username");
  if (user) {
    fileInput.disabled = false;
    loginBtn.textContent = user;
    if (uploadStatus) {
      uploadStatus.textContent = `Welcome back, ${user}! Start uploading your files.`;
      uploadStatus.style.display = "block";
    }
  } else {
    fileInput.disabled = true;
  }
});

// Upload files
fileInput.addEventListener("change", async function () {
  const user = localStorage.getItem("username");
  if (!user) {
    alert("⚠️ Please login first.");
    fileInput.value = "";
    return;
  }

  for (const file of this.files) {
    if (!file) continue;

    const fileItem = document.createElement("div");
    fileItem.classList.add("file-item");
    fileItem.innerHTML = `
      <span>${file.name}</span>
      <div class="progress-wrapper"><div class="progress-bar" style="height: 6px; background: #007bff; width: 0%; transition: width 0.3s;"></div></div>
    `;
    progressArea.appendChild(fileItem);

    const progressBar = fileItem.querySelector(".progress-bar");

    try {
      // 1. Generate pre-signed upload URL
      const res = await fetch(`${API_BASE}/generateUploadURL`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userid: user,
          filename: file.name
        })
      });

      const data = await res.json();
      const uploadURL = data.uploadURL;
      const fileKey = data.fileKey;

      // 2. Upload to S3
      const uploadRes = await fetch(uploadURL, {
        method: "PUT",
        headers: {
          "Content-Type": file.type || "application/octet-stream"
        },
        body: file
      });

      if (!uploadRes.ok) throw new Error("Upload failed to S3");

      progressBar.style.width = "100%";
      progressBar.style.background = "#28a745";

      // 3. Save metadata to DynamoDB
      const saveMeta = await fetch(`${API_BASE}/uploadFile`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userid: user,
          filename: file.name,
          size: file.size,
          fileKey: fileKey
        })
      });

      const metaResp = await saveMeta.json();
      if (!saveMeta.ok) throw new Error(metaResp.message || "Metadata save failed");

      // Optional: confirm success
      const successMsg = document.createElement("div");
      successMsg.textContent = "✅ Uploaded successfully";
      successMsg.style.color = "#00ff88";
      successMsg.style.fontSize = "0.9rem";
      fileItem.appendChild(successMsg);

    } catch (err) {
      console.error(err);
      progressBar.style.width = "100%";
      progressBar.style.background = "red";
      fileItem.appendChild(document.createTextNode(" ❌ Upload failed"));
    }
  }
});
