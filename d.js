import { initializeApp } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-app.js";
import { getDatabase, ref, set, get, update, push } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-database.js";

// ضع مفاتيحك هنا 👇👇👇
const firebaseConfig = {
  apiKey: "ضع هنا المفتاح",
  authDomain: "ضع هنا الدومين",
  databaseURL: "ضع هنا رابط القاعدة",
  projectId: "ضع هنا الـ projectId",
  storageBucket: "ضع هنا الـ bucket",
  messagingSenderId: "ضع هنا الـ senderId",
  appId: "ضع هنا الـ appId"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// عناصر الصفحة
const nameInput = document.getElementById("name");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const loginBtn = document.getElementById("loginBtn");
const registerBtn = document.getElementById("registerBtn");
const authMsg = document.getElementById("authMsg");
const authSection = document.getElementById("auth");
const quizSection = document.getElementById("quiz");
const userName = document.getElementById("userName");
const userPoints = document.getElementById("userPoints");
const stageTitle = document.getElementById("stageTitle");
const questionEl = document.getElementById("question");
const optionsEl = document.getElementById("options");
const resultEl = document.getElementById("result");
const nextBtn = document.getElementById("nextBtn");
const reportBtn = document.getElementById("reportBtn");
const adminPanel = document.getElementById("adminPanel");
const banBtn = document.getElementById("banBtn");

let currentUser = null;
let currentStage = 0;
let currentQuestion = 0;
let points = 0;

const stages = [
  {
    title: "المرحلة 1 - كلمات أساسية",
    questions: [
      { q: "ما معنى كلمة bug في البرمجة؟", options: ["خطأ", "كود", "ملف"], correct: 0 },
      { q: "ما معنى كلمة program؟", options: ["تطبيق", "دالة", "خطأ"], correct: 0 },
      { q: "ما معنى كلمة correct؟", options: ["تصحيح", "كلمة", "ملف"], correct: 0 }
    ]
  }
];

function renderQuestion() {
  const stage = stages[currentStage];
  const q = stage.questions[currentQuestion];
  stageTitle.textContent = stage.title;
  questionEl.textContent = q.q;
  optionsEl.innerHTML = "";
  q.options.forEach((opt, i) => {
    const btn = document.createElement("button");
    btn.textContent = opt;
    btn.onclick = () => checkAnswer(i);
    optionsEl.appendChild(btn);
  });
}

function checkAnswer(i) {
  const q = stages[currentStage].questions[currentQuestion];
  if (i === q.correct) {
    resultEl.textContent = "إجابة صحيحة!";
    resultEl.style.color = "lightgreen";
    points += 10;
    userPoints.textContent = points;
  } else {
    resultEl.textContent = "إجابة خاطئة!";
    resultEl.style.color = "tomato";
  }
  nextBtn.classList.remove("hidden");
}

nextBtn.onclick = () => {
  const stage = stages[currentStage];
  if (currentQuestion < stage.questions.length - 1) {
    currentQuestion++;
    resultEl.textContent = "";
    nextBtn.classList.add("hidden");
    renderQuestion();
  } else {
    stageTitle.textContent = "انتهت المرحلة!";
    questionEl.textContent = "";
    optionsEl.innerHTML = "";
    resultEl.textContent = "مبروك! نقاطك: " + points;
    nextBtn.classList.add("hidden");
  }
};

registerBtn.onclick = async () => {
  const name = nameInput.value.trim();
  const email = emailInput.value.trim();
  const pass = passwordInput.value.trim();
  if (!name || !email || !pass) return authMsg.textContent = "املأ جميع الحقول.";

  await set(ref(db, "users/" + email.replace(/\./g, "_")), {
    name, email, pass, banned: false, reports: 0, points: 0
  });
  authMsg.textContent = "تم التسجيل بنجاح!";
};

loginBtn.onclick = async () => {
  const email = emailInput.value.trim();
  const pass = passwordInput.value.trim();
  if (!email || !pass) return authMsg.textContent = "أدخل البريد وكلمة المرور.";
  const snap = await get(ref(db, "users/" + email.replace(/\./g, "_")));
  if (!snap.exists()) return authMsg.textContent = "المستخدم غير موجود.";
  const user = snap.val();
  if (user.banned) return authMsg.textContent = "تم حظرك من النظام.";
  if (user.pass !== pass) return authMsg.textContent = "كلمة المرور خاطئة.";

  currentUser = user;
  authSection.classList.add("hidden");
  quizSection.classList.remove("hidden");
  userName.textContent = user.name;
  userPoints.textContent = user.points;
  if (user.email === "admin@app.com") adminPanel.classList.remove("hidden");
  renderQuestion();
};

reportBtn.onclick = async () => {
  if (!currentUser) return;
  const userRef = ref(db, "users/" + currentUser.email.replace(/\./g, "_"));
  const snap = await get(userRef);
  if (snap.exists()) {
    const user = snap.val();
    const newReports = (user.reports || 0) + 1;
    await update(userRef, { reports: newReports });
    if (newReports >= 3) {
      await update(userRef, { banned: true });
      alert(`تم حظر المستخدم ${user.name}`);
    } else {
      alert("تم تبليغ عن المستخدم!");
    }
  }
};

banBtn.onclick = async () => {
  const email = prompt("أدخل البريد الإلكتروني للمستخدم لحظره:");
  if (!email) return;
  await update(ref(db, "users/" + email.replace(/\./g, "_")), { banned: true });
  alert(`تم حظر المستخدم ${email}`);
};