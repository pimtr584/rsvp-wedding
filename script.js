// ==========================================
// 1. ส่วนตั้งค่าตัวเลือกความสัมพันธ์ (แก้ข้อความได้ตามต้องการ)
// ==========================================
const relationshipOptions = {
  'ฝั่งเจ้าบ่าว': [
    'แขกฝั่งคุณพ่อ',
    'แขกฝั่งคุณแม่',
    'BM',
    'TNK',
    'PnET',
    'EE',
    'CU',
    'NESDC',
    'PTT Digital'
  ],
  'ฝั่งเจ้าสาว': [
    'แขกคุณพ่อคุณแม่',
    'เพื่อนประถม',
    'SKN',
    'Samsen',
    'CU STAT',
    'CU ENG',
    'CU ชาวเขา',
    'KBANK',
    'ACN',
    'IBM'
    
  ]
  
};

const relationshipSelect = document.getElementById('relationship');

function updateRelationshipDropdown(selectedSide) {
  // ล้างค่าเดิมออกให้เหลือแค่คำว่า "กรุณาเลือก"
  relationshipSelect.innerHTML = '<option value="" disabled selected>กรุณาเลือก</option>';

  // นำข้อความมาสร้างเป็นตัวเลือกใหม่
  if (relationshipOptions[selectedSide]) {
    relationshipOptions[selectedSide].forEach(function(optionText) {
      const option = document.createElement('option');
      option.value = optionText;
      option.textContent = optionText;
      relationshipSelect.appendChild(option);
    });
  }
}

// ==========================================
// 2. ระบบนับจำนวนคน และการแสดงผลช่องต่างๆ
// ==========================================
let count = 1;
const countGroup = document.getElementById('countGroup');

function updateCount(n) {
  count = Math.max(1, Math.min(5, n));
  document.getElementById('countDisplay').textContent = count;
  document.getElementById('guestCount').value = count;
}

document.getElementById('countDown').addEventListener('click', () => updateCount(count - 1));
document.getElementById('countUp').addEventListener('click',   () => updateCount(count + 1));

// เมื่อกดเลือก "ฝั่งแขก" ให้แสดงฟิลด์เพิ่มเติม และอัปเดตตัวเลือกความสัมพันธ์
document.querySelectorAll('input[name="side"]').forEach(r => {
  r.addEventListener('change', (e) => {
    document.getElementById('extraFields').classList.add('show');
    updateRelationshipDropdown(e.target.value); // ดึงฝั่งที่เลือกไปรันฟังก์ชันเปลี่ยน Dropdown
  });
});

// แสดง/ซ่อน จำนวนคนตามการตอบรับ
document.querySelectorAll('input[name="attend"]').forEach(r => {
  r.addEventListener('change', () => {
    countGroup.classList.toggle('hidden', r.value !== 'ยืนยันเข้าร่วมงาน');
  });
});


// ==========================================
// 3. ระบบตรวจสอบฟอร์ม และส่งข้อมูลเข้า Google Sheets
// ==========================================
document.getElementById('submitBtn').addEventListener('click', async () => {
  const name         = document.getElementById('guestName').value.trim();
  const attendEl     = document.querySelector('input[name="attend"]:checked');
  const sideEl       = document.querySelector('input[name="side"]:checked');
  const relationship = document.getElementById('relationship').value;
  const fillTypeEl   = document.querySelector('input[name="fillType"]:checked');
  const btn          = document.getElementById('submitBtn');

  let hasError = false;
  document.getElementById('guestName').classList.remove('field-error');
  document.querySelector('.toggle-group')?.classList.remove('field-error');
  
  if (!name) {
    document.getElementById('guestName').classList.add('field-error');
    showMsg('กรุณากรอกข้อมูลให้ครบถ้วน', 'error');
    hasError = true;
  }
  if (!attendEl) {
    document.querySelectorAll('.toggle-group label').forEach(l => l.style.borderColor = '#cc0000');
    showMsg('กรุณากรอกข้อมูลให้ครบถ้วน', 'error');
    hasError = true;
  }
  if (!sideEl) {
    document.querySelectorAll('.side-option label').forEach(l => l.style.borderColor = '#cc0000');
    showMsg('กรุณากรอกข้อมูลให้ครบถ้วน', 'error');
    hasError = true;
  }
  if (!relationship) {
    document.getElementById('relationship').classList.add('field-error');
    showMsg('กรุณากรอกข้อมูลให้ครบถ้วน', 'error');
    hasError = true;
  }
  if (!fillTypeEl) {
    showMsg('กรุณากรอกข้อมูลให้ครบถ้วน', 'error');
    hasError = true;
  }
  if (hasError) return;

  const attend   = attendEl.value;
  const side     = sideEl.value;
  const fillType = fillTypeEl.value;
  const guests   = attend === 'ยืนยันเข้าร่วมงาน' ? count : 0;
  const now      = new Date().toISOString();

  btn.disabled = true;
  showMsg('กำลังส่งข้อมูล...', 'loading');

  try {
    const scriptURL = 'https://script.google.com/macros/s/AKfycby5U4DhLMYTqkpa61uRtqvUeotc0JwSDo9HjfR2i3c2cJ0k2xiSpKih8_Jd_L_vBvt9/exec'; 
    
    const res = await fetch(scriptURL, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8'
      },
      body: JSON.stringify({
        'ชื่อ': name,
        'การตอบรับ': attend,
        'ฝั่งแขก': side,
        'จำนวนคน': guests,
        'ความสัมพันธ์': relationship,
        'ประเภทการกรอก': fillType,
        'เวลากรอก': now
      })
    });

    if (!res.ok) throw new Error('Google Sheets error');

    document.getElementById('formWrap').classList.add('hidden');
    document.getElementById('successCard').classList.add('show');

    if (attend !== 'ยืนยันเข้าร่วมงาน') {
      document.getElementById('successTitle').textContent = 'ขอบคุณที่แจ้งให้ทราบ';
      document.getElementById('successText').textContent  = 'เราเข้าใจและขอบคุณที่ส่งความปรารถนาดีมา\nหวังว่าจะได้พบกันในโอกาสหน้า';
    }
  } catch (e) {
    showMsg('เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง', 'error');
    btn.disabled = false;
  }
});

function showMsg(text, type) {
  const msg = document.getElementById('statusMsg');
  msg.textContent = text;
  msg.className   = 'status-msg ' + type;
}
