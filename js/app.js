/**
 * MAIN APP CONTROLLER
 * Render giao diện, xử lý sự kiện, âm thanh Web Audio API, tìm kiếm và quay xúc xắc
 */

document.addEventListener('DOMContentLoaded', () => {
  // 1. Khởi tạo 3D Dice Background
  let diceBg = null;
  try {
    diceBg = new DiceBackground('diceCanvas');
  } catch (err) {
    console.warn("WebGL / Three.js canvas init note:", err);
  }

  // 2. Lấy dữ liệu dự đoán từ Engine
  const predictions = PredictionEngine.getPredictions();
  const allNumbers = LotteryData.getAllNumbers();

  // 3. Cập nhật ngày hiển thị
  const drawDateEls = document.querySelectorAll('.draw-date-text');
  drawDateEls.forEach(el => el.textContent = predictions.drawDate);

  // 4. Web Audio API Sound Generator (Không cần file mp3 ngoài)
  const soundEngine = {
    ctx: null,
    init() {
      if (!this.ctx) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (AudioContext) this.ctx = new AudioContext();
      }
    },
    playDiceRoll() {
      this.init();
      if (!this.ctx) return;
      const count = 12;
      for (let i = 0; i < count; i++) {
        setTimeout(() => {
          if (!this.ctx) return;
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(160 + Math.random() * 280, this.ctx.currentTime);
          gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.08);
          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start();
          osc.stop(this.ctx.currentTime + 0.08);
        }, i * 90);
      }
    },
    playWinChime() {
      this.init();
      if (!this.ctx) return;
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        setTimeout(() => {
          if (!this.ctx) return;
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
          gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.5);
          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start();
          osc.stop(this.ctx.currentTime + 0.5);
        }, idx * 120);
      });
    }
  };

  // 5. Hàm tạo HTML cho Thẻ Dự Đoán Chi Tiết (Full Info Card)
  function createNumberCard(item, label = "LÔ TÂM ĐIỂM", colorTheme = "red") {
    const ganClass = item.daysOmitted <= 5 ? 'safe' : (item.daysOmitted <= 12 ? 'warning' : 'danger');
    const ganText = item.daysOmitted <= 5 ? 'Nhịp rơi đẹp' : (item.daysOmitted <= 12 ? 'Gan vừa phải' : 'Cảnh báo Gan cao');

    return `
      <div class="number-card">
        <div>
          <div class="card-top">
            <div class="number-badge-wrapper">
              <div class="lotto-ball ${colorTheme === 'gold' ? 'gold' : (colorTheme === 'cyan' ? 'cyan' : '')}">
                ${item.number}
              </div>
              <div>
                <div class="number-label">${label}</div>
                <span class="number-subtag">2 Số Cuối XSMB</span>
              </div>
            </div>
            <div class="rate-badge-box">
              <span class="rate-val">${item.winRate}%</span>
              <span class="rate-label">Xác suất nổ</span>
            </div>
          </div>

          <div class="progress-bar-bg">
            <div class="progress-bar-fill" style="width: ${item.winRate}%"></div>
          </div>

          <div class="card-details">
            <div class="detail-row">
              <span class="detail-icon">🎯</span>
              <div class="detail-text">
                <strong>Lý do soi cầu:</strong><br/>
                <span>${item.reason}</span>
              </div>
            </div>

            <div class="detail-row">
              <span class="detail-icon">⏳</span>
              <div class="detail-text">
                <strong>Thời gian chưa ra:</strong>
                <span>${item.daysOmitted} ngày</span>
                <span class="badge-gan ${ganClass}">[${ganText} - Max: ${item.maxGan} ngày]</span>
              </div>
            </div>

            <div class="detail-row">
              <span class="detail-icon">📅</span>
              <div class="detail-text">
                <strong>Lần gần nhất ra:</strong>
                <span>${item.lastDate} (${item.lastPrize})</span>
              </div>
            </div>

            <div class="detail-row">
              <span class="detail-icon">📈</span>
              <div class="detail-text">
                <strong>Tần suất 30 ngày:</strong>
                <span>${item.frequency30Days} lần xuất hiện</span>
              </div>
            </div>
          </div>
        </div>

        <div class="card-footer">
          <span class="method-tag">${item.methodName}</span>
          <button class="btn-action-copy" data-num="${item.number}">
            📋 Sao chép
          </button>
        </div>
      </div>
    `;
  }

  // 6. Render Thẻ Bạch Thủ Lô & Song Thủ Lô
  const btlContainer = document.getElementById('btl-container');
  if (btlContainer) {
    const btl = predictions.bachThuLo;
    const stl = predictions.songThuLo;

    btlContainer.innerHTML = `
      <!-- Featured Bạch Thủ Lô -->
      <div class="featured-card">
        <div class="featured-ribbon">VIP 1 SỐ DUY NHẤT</div>
        <div class="card-top">
          <div class="number-badge-wrapper">
            <div class="lotto-ball gold">${btl.number}</div>
            <div>
              <h3 style="font-family: var(--font-heading); font-size: 1.4rem; color: #ffd700;">BẠCH THỦ LÔ SIÊU CẤP</h3>
              <p style="color: #94a3b8; font-size: 0.88rem;">Khuyên đánh độc thủ đài Miền Bắc hôm nay</p>
            </div>
          </div>
          <div class="rate-badge-box">
            <span class="rate-val" style="font-size: 2.2rem; color: #ffd700;">${btl.winRate}%</span>
            <span class="rate-label">Độ tin cậy thuật toán</span>
          </div>
        </div>

        <div class="progress-bar-bg" style="height: 10px; margin-bottom: 1.5rem;">
          <div class="progress-bar-fill" style="width: ${btl.winRate}%; background: var(--gold-gradient);"></div>
        </div>

        <div class="card-details" style="font-size: 0.95rem; gap: 1rem;">
          <div class="detail-row">
            <span class="detail-icon" style="font-size: 1.3rem;">🎯</span>
            <div class="detail-text">
              <strong style="color: #ffd700; font-size: 1rem;">Lý do chốt số:</strong><br/>
              <span style="color: #f1f5f9; line-height: 1.7;">${btl.reason}</span>
            </div>
          </div>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1rem; background: rgba(0,0,0,0.3); padding: 1rem; border-radius: 12px; border: 1px solid rgba(255,215,0,0.15);">
            <div>
              <span style="color: #94a3b8; font-size: 0.82rem; display: block;">THỜI GIAN CHƯA RA</span>
              <strong style="color: #05d550; font-size: 1.1rem;">${btl.daysOmitted} ngày</strong>
              <span style="font-size: 0.78rem; color: #cbd5e1;">(Gan cực đại: ${btl.maxGan} ngày)</span>
            </div>
            <div>
              <span style="color: #94a3b8; font-size: 0.82rem; display: block;">LẦN GẦN NHẤT RA</span>
              <strong style="color: #fff; font-size: 1rem;">${btl.lastDate}</strong>
              <span style="font-size: 0.78rem; color: #cbd5e1; display: block;">${btl.lastPrize}</span>
            </div>
            <div>
              <span style="color: #94a3b8; font-size: 0.82rem; display: block;">TẦN SUẤT 30 NGÀY</span>
              <strong style="color: #00f2fe; font-size: 1.1rem;">${btl.frequency30Days} lần về</strong>
              <span style="font-size: 0.78rem; color: #cbd5e1;">(Phong độ cao)</span>
            </div>
          </div>
        </div>

        <div class="card-footer" style="margin-top: 1.2rem;">
          <span class="method-tag" style="font-size: 0.85rem; padding: 0.4rem 0.9rem;">⭐ Cầu Bạch Thủ Số 1</span>
          <button class="btn-action-copy" data-num="${btl.number}" style="padding: 0.5rem 1.2rem; font-weight: 700; background: rgba(255,215,0,0.2); border-color: #ffd700; color: #ffd700;">
            📋 Sao chép số ${btl.number}
          </button>
        </div>
      </div>

      <!-- Song Thủ Lô Grid -->
      <div style="margin-bottom: 1rem;">
        <h3 class="section-title" style="font-size: 1.3rem;">🔥 CẶP SONG THỦ LÔ TƯƠNG SINH (${stl.num1.number} - ${stl.num2.number})</h3>
        <p class="section-subtitle">${stl.reason}</p>
      </div>

      <div class="cards-grid">
        ${createNumberCard(stl.num1, `SONG THỦ (${stl.num1.number})`, 'cyan')}
        ${createNumberCard(stl.num2, `LỘN VÒNG (${stl.num2.number})`, 'cyan')}
      </div>
    `;
  }

  // 7. Render Đề Đặc Biệt & Chạm Đề
  const deContainer = document.getElementById('de-container');
  if (deContainer) {
    const cardsHtml = predictions.deDacBiet.map(item => createNumberCard(item, 'ĐỀ ĐẶC BIỆT', 'red')).join('');
    deContainer.innerHTML = `
      <div style="background: rgba(229, 45, 39, 0.12); border: 1px solid rgba(229, 45, 39, 0.35); border-radius: 20px; padding: 1.5rem; margin-bottom: 2rem;">
        <div style="display: flex; flex-wrap: wrap; gap: 2rem; justify-content: space-around; text-align: center;">
          <div>
            <span style="color: #94a3b8; font-size: 0.85rem; font-weight: 600;">CHẠM ĐỀ ĐẸP HÔM NAY</span>
            <div style="font-family: var(--font-heading); font-size: 2rem; font-weight: 900; color: #ff2a6d; margin-top: 0.2rem;">
              Chạm ${predictions.chamDe[0]} & Chạm ${predictions.chamDe[1]}
            </div>
          </div>
          <div style="border-left: 1px solid rgba(255,255,255,0.1); padding-left: 2rem;">
            <span style="color: #94a3b8; font-size: 0.85rem; font-weight: 600;">TỔNG ĐỀ TÂM ĐIỂM</span>
            <div style="font-family: var(--font-heading); font-size: 2rem; font-weight: 900; color: #ffd700; margin-top: 0.2rem;">
              Tổng ${predictions.tongDe[0]} - Tổng ${predictions.tongDe[1]}
            </div>
          </div>
        </div>
      </div>
      <div class="cards-grid">
        ${cardsHtml}
      </div>
    `;
  }

  // 8. Render Lô Kép & Lô Xiên
  const xienKepContainer = document.getElementById('xien-kep-container');
  if (xienKepContainer) {
    const loKepCards = predictions.loKepList.map(item => createNumberCard(item, 'LÔ KÉP VIP', 'gold')).join('');
    const xienCards = predictions.loXien.map((x, idx) => `
      <div class="number-card">
        <div>
          <div class="card-top">
            <div class="number-badge-wrapper">
              <div style="display: flex; gap: 0.4rem;">
                <div class="lotto-ball cyan" style="width: 52px; height: 52px; font-size: 1.4rem;">${x.pair[0]}</div>
                <div class="lotto-ball cyan" style="width: 52px; height: 52px; font-size: 1.4rem;">${x.pair[1]}</div>
              </div>
              <div>
                <div class="number-label">CẶP XIÊN 2 (SỐ ${idx + 1})</div>
                <span class="number-subtag">2 Cặp Số Nổ Cùng Nhau</span>
              </div>
            </div>
            <div class="rate-badge-box">
              <span class="rate-val">${x.rate}%</span>
              <span class="rate-label">Xác suất đôi</span>
            </div>
          </div>

          <div class="progress-bar-bg">
            <div class="progress-bar-fill" style="width: ${x.rate}%; background: var(--cyan-gradient);"></div>
          </div>

          <div class="card-details">
            <div class="detail-row">
              <span class="detail-icon">🎯</span>
              <div class="detail-text">
                <strong>Lý do ghép xiên:</strong><br/>
                <span>${x.reason}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="card-footer">
          <span class="method-tag">Cặp Xiên Vàng</span>
          <button class="btn-action-copy" data-num="${x.pair[0]} - ${x.pair[1]}">
            📋 Sao chép cặp
          </button>
        </div>
      </div>
    `).join('');

    xienKepContainer.innerHTML = `
      <div style="margin-bottom: 2rem;">
        <h3 class="section-title" style="margin-bottom: 1rem;">✨ DANH SÁCH LÔ KÉP VIP NỔ CAO</h3>
        <div class="cards-grid">${loKepCards}</div>
      </div>
      <div>
        <h3 class="section-title" style="margin-bottom: 1rem;">⚡ CÁC CẶP LÔ XIÊN 2 SÁNG NHẤT</h3>
        <div class="cards-grid">${xienCards}</div>
      </div>
    `;
  }

  // 9. Render Bảng Thống Kê Lô Gan
  const ganContainer = document.getElementById('gan-table-container');
  if (ganContainer) {
    const ganList = PredictionEngine.getGanReport();
    const rows = ganList.slice(0, 25).map((item, idx) => {
      const ganClass = item.daysOmitted <= 5 ? 'safe' : (item.daysOmitted <= 12 ? 'warning' : 'danger');
      return `
        <tr>
          <td><strong style="color: var(--gold-primary); font-size: 1.1rem;">#${idx + 1}</strong></td>
          <td><span class="lotto-ball" style="width: 38px; height: 38px; font-size: 1.1rem; display: inline-flex;">${item.number}</span></td>
          <td><strong style="color: #ff2a6d; font-size: 1.1rem;">${item.daysOmitted} ngày</strong></td>
          <td>${item.maxGan} ngày</td>
          <td>${item.lastDate} (${item.lastPrize})</td>
          <td>${item.frequency30Days} lần</td>
          <td><span class="badge-gan ${ganClass}">${item.daysOmitted > 15 ? 'Siêu Gan (Né)' : (item.daysOmitted > 8 ? 'Gan Trung Bình' : 'Đang Ra Đều')}</span></td>
          <td>
            <button class="matrix-btn inspect-quick-btn" data-num="${item.number}" style="padding: 0.25rem 0.6rem; font-size: 0.8rem;">
              🔍 Xem Cầu
            </button>
          </td>
        </tr>
      `;
    }).join('');

    ganContainer.innerHTML = `
      <div class="table-responsive">
        <table class="gan-table">
          <thead>
            <tr>
              <th>Hạng</th>
              <th>Số</th>
              <th>Số Ngày Chưa Ra</th>
              <th>Gan Cực Đại</th>
              <th>Lần Gần Nhất Về</th>
              <th>Tần Suất 30 Ngày</th>
              <th>Trạng Thái</th>
              <th>Tra Cứu</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
      </div>
    `;
  }

  // 10. Render Dàn Đề Chọn Lọc
  const danDeContainer = document.getElementById('dan-de-container');
  if (danDeContainer) {
    const strDan10 = predictions.danDe10.map(n => n.number).join(', ');
    const strDan20 = predictions.danDe20.map(n => n.number).join(', ');

    danDeContainer.innerHTML = `
      <div class="cards-grid">
        <div class="number-card">
          <div class="card-top">
            <div>
              <div class="number-label" style="font-size: 1.3rem; color: #ffd700;">📋 DÀN ĐỀ 10 SỐ BẤT BẠI</div>
              <span class="number-subtag">Top 10 số có xác suất thống kê cao nhất hôm nay</span>
            </div>
          </div>
          <div style="background: rgba(0,0,0,0.4); border-radius: 12px; padding: 1.2rem; margin: 1rem 0; border: 1px dashed rgba(255,215,0,0.3);">
            <div style="font-family: var(--font-heading); font-size: 1.3rem; font-weight: 800; color: #fff; line-height: 1.8; letter-spacing: 2px;">
              ${strDan10}
            </div>
          </div>
          <div class="card-footer">
            <span class="method-tag">Thuật toán tổng hợp</span>
            <button class="btn-action-copy" data-num="${strDan10}">
              📋 Sao chép dàn 10 số
            </button>
          </div>
        </div>

        <div class="number-card">
          <div class="card-top">
            <div>
              <div class="number-label" style="font-size: 1.3rem; color: #00f2fe;">📋 DÀN ĐỀ 20 SỐ BAO KHUNG</div>
              <span class="number-subtag">Bao trọn các cầu chạm và bóng ngũ hành mạnh</span>
            </div>
          </div>
          <div style="background: rgba(0,0,0,0.4); border-radius: 12px; padding: 1.2rem; margin: 1rem 0; border: 1px dashed rgba(0,242,254,0.3);">
            <div style="font-family: var(--font-heading); font-size: 1.15rem; font-weight: 700; color: #fff; line-height: 1.8; letter-spacing: 1.5px;">
              ${strDan20}
            </div>
          </div>
          <div class="card-footer">
            <span class="method-tag">Dàn khung 3 ngày</span>
            <button class="btn-action-copy" data-num="${strDan20}">
              📋 Sao chép dàn 20 số
            </button>
          </div>
        </div>
      </div>
    `;
  }

  // 11. Render Ma Trận 100 Số (00 - 99 Matrix)
  const matrixContainer = document.getElementById('matrix-100-container');
  if (matrixContainer) {
    let matrixHtml = '';
    for (let i = 0; i <= 99; i++) {
      const str = String(i).padStart(2, '0');
      matrixHtml += `<button class="matrix-btn inspect-quick-btn" data-num="${str}">${str}</button>`;
    }
    matrixContainer.innerHTML = matrixHtml;
  }

  // 12. Xử lý Tab Navigation
  const tabBtns = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      tabBtns.forEach(b => b.classList.remove('active'));
      tabContents.forEach(c => c.classList.remove('active'));

      btn.classList.add('active');
      const targetId = btn.getAttribute('data-target');
      const targetContent = document.getElementById(targetId);
      if (targetContent) targetContent.classList.add('active');
    });
  });

  // 13. Toast Notification Handler
  const toastEl = document.getElementById('toastMsg');
  function showToast(msg) {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    setTimeout(() => {
      toastEl.classList.remove('show');
    }, 2800);
  }

  // 14. Sự kiện Sao Chép (Copy to Clipboard)
  document.addEventListener('click', (e) => {
    const copyBtn = e.target.closest('.btn-action-copy');
    if (copyBtn) {
      const numText = copyBtn.getAttribute('data-num');
      if (navigator.clipboard) {
        navigator.clipboard.writeText(numText);
      }
      showToast(`✅ Đã sao chép: ${numText}`);
      soundEngine.playWinChime();
    }
  });

  // 15. Tra Cứu Chi Tiết 1 Con Số (Inspect Number Modal)
  const modalOverlay = document.getElementById('numberModal');
  const modalBody = document.getElementById('modalCardBody');
  const modalClose = document.getElementById('modalClose');

  function openNumberModal(num) {
    const item = LotteryData.getNumberDetail(num);
    if (!item) return;

    modalBody.innerHTML = createNumberCard(item, `TRA CỨU SỐ ${item.number}`, 'gold');
    modalOverlay.classList.add('active');
    soundEngine.playWinChime();
  }

  if (modalClose) {
    modalClose.addEventListener('click', () => modalOverlay.classList.remove('active'));
  }
  if (modalOverlay) {
    modalOverlay.addEventListener('click', (e) => {
      if (e.target === modalOverlay) modalOverlay.classList.remove('active');
    });
  }

  // Click vào số trong Matrix hoặc bảng Gan
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.inspect-quick-btn');
    if (btn) {
      const num = btn.getAttribute('data-num');
      openNumberModal(num);
    }
  });

  // Tìm kiếm bằng ô Input
  const searchInput = document.getElementById('searchInput');
  const btnInspectSearch = document.getElementById('btnInspectSearch');

  function handleSearch() {
    if (!searchInput) return;
    let val = searchInput.value.trim();
    if (val === '') return;
    const formatted = String(parseInt(val, 10)).padStart(2, '0');
    if (parseInt(formatted, 10) >= 0 && parseInt(formatted, 10) <= 99) {
      openNumberModal(formatted);
    } else {
      showToast('⚠️ Vui lòng nhập số từ 00 đến 99');
    }
  }

  if (btnInspectSearch) btnInspectSearch.addEventListener('click', handleSearch);
  if (searchInput) {
    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') handleSearch();
    });
  }

  // 16. Sự kiện Lắc Xúc Xắc 3D (Roll Dice Interactive)
  const btnRollDice = document.getElementById('btnRollDice');
  const luckyModal = document.getElementById('luckyForecastModal');
  const luckyModalBody = document.getElementById('luckyModalBody');
  const luckyModalClose = document.getElementById('luckyModalClose');

  if (btnRollDice) {
    btnRollDice.addEventListener('click', () => {
      // Âm thanh xúc xắc lăn
      soundEngine.playDiceRoll();

      // Cuộn mượt lên đỉnh để chiêm ngưỡng 3D Canvas
      window.scrollTo({ top: 0, behavior: 'smooth' });

      // Gọi animation quay 3D Three.js
      if (diceBg) {
        btnRollDice.disabled = true;
        btnRollDice.innerHTML = `🎲 Đang lắc xúc xắc...`;

        diceBg.rollDice((results) => {
          btnRollDice.disabled = false;
          btnRollDice.innerHTML = `🎲 LẮC XÚC XẮC XIN SỐ HÔM NAY`;
          soundEngine.playWinChime();

          // Tính quẻ từ 3 hột xúc xắc
          const forecast = PredictionEngine.rollLuckyForecast(results[0], results[1], results[2]);

          luckyModalBody.innerHTML = `
            <div style="text-align: center; margin-bottom: 1.5rem; padding-bottom: 1.2rem; border-bottom: 1px solid rgba(255,215,0,0.2);">
              <div style="font-size: 2.6rem; margin-bottom: 0.35rem; filter: drop-shadow(0 0 15px #ffd700);">🎲 ${results[0]} • ${results[1]} • ${results[2]} 🎲</div>
              <h3 style="font-family: var(--font-heading); font-size: 1.6rem; color: #ffd700; text-transform: uppercase;">
                QUẺ THẦN TÀI: ${forecast.taiXiu} (${forecast.totalPoints} ĐIỂM)
              </h3>
              <p style="color: #f1f5f9; font-size: 0.95rem; margin-top: 0.5rem; line-height: 1.6; max-width: 620px; margin-left: auto; margin-right: auto;">
                ${forecast.oracleMessage}
              </p>
            </div>

            <div style="display: flex; justify-content: center; gap: 1rem; flex-wrap: wrap; margin-bottom: 1.5rem;">
              ${forecast.luckyPicks.map(p => `
                <div style="background: rgba(255,215,0,0.1); border: 1px solid rgba(255,215,0,0.35); border-radius: 14px; padding: 0.75rem 1.2rem; display: flex; align-items: center; gap: 0.75rem;">
                  <div class="lotto-ball gold" style="width: 48px; height: 48px; font-size: 1.35rem;">${p.number}</div>
                  <div style="text-align: left;">
                    <div style="font-weight: 700; color: #fff; font-size: 0.9rem;">Số ${p.number}</div>
                    <div style="font-size: 0.78rem; color: #ffd700;">Tỉ lệ nổ: ${p.winRate}%</div>
                  </div>
                </div>
              `).join('')}
            </div>

            <h4 style="color: var(--cyan-primary); margin-bottom: 1rem; font-size: 1.05rem; font-weight: 700;">
              📊 CHI TIẾT CÁC CẶP SỐ LINH ỨNG TỪ XÚC XẮC
            </h4>

            <div class="cards-grid" style="grid-template-columns: 1fr; gap: 1rem; margin-bottom: 1.5rem;">
              ${forecast.luckyPicks.map(p => createNumberCard(p, `SỐ MAY MẮN (${p.number})`, 'gold')).join('')}
            </div>

            <div style="text-align: center; margin-top: 1.5rem; padding-top: 1rem; border-top: 1px solid rgba(255,255,255,0.08);">
              <button class="btn-roll-dice" onclick="document.getElementById('luckyForecastModal').classList.remove('active')" style="margin: 0 auto; padding: 0.75rem 2.2rem; font-size: 0.95rem;">
                ✖ Đóng Bảng Quẻ
              </button>
            </div>
          `;

          luckyModal.classList.add('active');
        });
      }
    });
  }

  if (luckyModalClose) {
    luckyModalClose.addEventListener('click', () => luckyModal.classList.remove('active'));
  }
  if (luckyModal) {
    luckyModal.addEventListener('click', (e) => {
      if (e.target === luckyModal) luckyModal.classList.remove('active');
    });
  }

  // Nút Quick Scroll to Search
  const btnScrollSearch = document.getElementById('btnScrollSearch');
  if (btnScrollSearch) {
    btnScrollSearch.addEventListener('click', () => {
      const searchTabBtn = document.querySelector('[data-target="tab-lookup"]');
      if (searchTabBtn) searchTabBtn.click();
      const lookupSec = document.getElementById('tab-lookup');
      if (lookupSec) lookupSec.scrollIntoView({ behavior: 'smooth' });
    });
  }
});
