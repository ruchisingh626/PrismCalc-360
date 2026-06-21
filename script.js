/* ==========================================================================
   1. Universal Haptic Sound Generator Engine (FIXED)
   ========================================================================== */
let audioCtx = null;

function playHapticSound() {
  try {
    // Lazy initialize: Only create AudioContext on actual user click
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }

    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(1200, audioCtx.currentTime); 
    
    gainNode.gain.setValueAtTime(0.05, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.05);

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    oscillator.start();
    oscillator.stop(audioCtx.currentTime + 0.05);
  } catch (e) {
    // If the browser still blocks it, catch silently so it doesn't break buttons
    console.log("Audio feedback paused safely.");
  }
}

// Global click event dispatcher
document.addEventListener('click', (e) => {
  if (e.target.tagName === 'BUTTON' || e.target.tagName === 'SELECT') {
    playHapticSound();
  }
});

/* ==========================================================================
   2. Light / Dark Theme & Mode Navigation Logic
   ========================================================================= */
function toggleTheme() {
  const body = document.body;
  const btn = document.getElementById('themeToggle');
  if (body.classList.contains('dark-theme')) {
    body.classList.remove('dark-theme');
    body.classList.add('light-theme');
    btn.textContent = '🌙 Dark Mode';
  } else {
    body.classList.remove('light-theme');
    body.classList.add('dark-theme');
    btn.textContent = '☀️ Light Mode';
  }
}

function switchAppMode(selectedMode) {
  document.querySelectorAll('.app-mode-panel').forEach(panel => {
    panel.classList.remove('active');
  });
  document.getElementById(`${selectedMode}Mode`).classList.add('active');

  if (selectedMode === 'currency') convertCurrency();
}

/* ==========================================================================
   3. Core Calculator & History Matrix Engine
   ========================================================================== */
const display = document.getElementById('display');
const historyLog = document.getElementById('historyLog');
let calculationsHistory = [];

function appendValue(v) {
  const operators = ['+', '-', '*', '/', '**', '%'];
  const lastChar = display.value.slice(-1);
  if (operators.includes(v) && operators.includes(lastChar)) {
    return; 
  }
  display.value += v;
}

function clearDisplay() {
  display.value = '';
}

function backspace() {
  display.value = display.value.slice(0, -1);
}

function calculate() {
  try {
    const rawExpression = display.value.trim();
    if (rawExpression === "") return;

    let result = eval(rawExpression);

    if (result % 1 !== 0) {
      result = parseFloat(result.toFixed(8));
    }

    addHistoryItem(rawExpression, result);
    display.value = result;
  } catch {
    display.value = 'Error';
  }
}

function scientific(type) {
  try {
    let currentVal = parseFloat(display.value) || 0;
    let result = 0;

    switch(type) {
      case 'sin': result = Math.sin(currentVal * Math.PI / 180); break;
      case 'cos': result = Math.cos(currentVal * Math.PI / 180); break;
      case 'tan': result = Math.tan(currentVal * Math.PI / 180); break;
      case 'sqrt': result = Math.sqrt(currentVal); break;
      case 'log': result = Math.log10(currentVal); break;
      case 'ln': result = Math.log(currentVal); break;
      case 'pi': display.value += parseFloat(Math.PI.toFixed(6)); return;
    }
    
    if (result % 1 !== 0) result = parseFloat(result.toFixed(6));
    addHistoryItem(`${type}(${currentVal})`, result);
    display.value = result;
  } catch {
    display.value = 'Error';
  }
}

function addHistoryItem(expr, res) {
  calculationsHistory.unshift({ expr, res });
  updateHistoryUI();
}

function updateHistoryUI() {
  if (calculationsHistory.length === 0) {
    historyLog.innerHTML = '<p class="empty-msg">No history yet</p>';
    return;
  }

  historyLog.innerHTML = calculationsHistory.map((item) => `
    <div class="history-item" onclick="useHistoryValue(${item.res})">
      <div>${item.expr}</div>
      <strong>= ${item.res}</strong>
    </div>
  `).join('');
}

function useHistoryValue(val) {
  display.value = val;
}

function clearHistory() {
  calculationsHistory = [];
  updateHistoryUI();
}

/* ==========================================================================
   4. Currency Converter Sub-App
   ========================================================================== */
function convertCurrency() {
  const amt = parseFloat(document.getElementById('currencyAmount').value) || 0;
  const from = document.getElementById('fromCurrency').value;
  const to = document.getElementById('toCurrency').value;
  const resultDisplay = document.getElementById('currencyResult');

  const baseRatesInUSD = { USD: 1, EUR: 0.92, GBP: 0.78, INR: 83.50 };

  const amountInUSD = amt / baseRatesInUSD[from];
  const convertedAmount = amountInUSD * baseRatesInUSD[to];

  resultDisplay.textContent = `${amt} ${from} = ${convertedAmount.toFixed(2)} ${to}`;
}

/* ==========================================================================
   5. Age Calculator Sub-App
   ========================================================================== */
function calculateAge() {
  const dobInput = document.getElementById('birthDate').value;
  const resultDisplay = document.getElementById('ageResult');
  if (!dobInput) return;

  const dob = new Date(dobInput);
  const today = new Date();

  let years = today.getFullYear() - dob.getFullYear();
  let months = today.getMonth() - dob.getMonth();
  let days = today.getDate() - dob.getDate();

  if (days < 0) {
    months--;
    const lastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
    days += lastMonth.getDate();
  }

  if (months < 0) {
    years--;
    months += 12;
  }

  if (years < 0) {
    resultDisplay.textContent = "Invalid Birthdate! Check dates.";
  } else {
    resultDisplay.textContent = `${years} Years, ${months} Months, ${days} Days old`;
  }
}

/* ==========================================================================
   6. Percentage Calculator Sub-App
   ========================================================================== */
function calculatePercentage() {
  const val1 = parseFloat(document.getElementById('pctInput1').value);
  const val2 = parseFloat(document.getElementById('pctInput2').value);
  const resultDisplay = document.getElementById('percentResult');

  if (isNaN(val1) || isNaN(val2)) {
    resultDisplay.textContent = "Enter numbers to compute";
    return;
  }

  const output = (val1 / 100) * val2;
  resultDisplay.textContent = `${val1}% of ${val2} is = ${parseFloat(output.toFixed(4))}`;
}
