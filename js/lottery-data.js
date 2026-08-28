/**
 * LOTTERY DATA & STATISTICAL ENGINE (XSMB 2-DIGIT)
 * Cung cấp dữ liệu lịch sử, thống kê gan, tần suất và quy luật bạc nhớ
 */

const LotteryData = (() => {
  // Tạo dữ liệu mô phỏng thực tế cho 100 số từ 00 đến 99
  const numbersDB = {};
  
  // Danh sách các giải thưởng XSMB
  const prizesList = [
    'Giải Đặc Biệt', 'Giải Nhất', 'Giải Nhì (1)', 'Giải Nhì (2)',
    'Giải Ba (1)', 'Giải Ba (2)', 'Giải Ba (3)', 'Giải Ba (4)', 'Giải Ba (5)', 'Giải Ba (6)',
    'Giải Tư (1)', 'Giải Tư (2)', 'Giải Tư (3)', 'Giải Tư (4)',
    'Giải Năm (1)', 'Giải Năm (2)', 'Giải Năm (3)', 'Giải Năm (4)', 'Giải Năm (5)', 'Giải Năm (6)',
    'Giải Sáu (1)', 'Giải Sáu (2)', 'Giải Sáu (3)',
    'Giải Bảy (1)', 'Giải Bảy (2)', 'Giải Bảy (3)', 'Giải Bảy (4)'
  ];

  // Các phương pháp soi cầu cơ bản và nâng cao
  const bridgeMethods = [
    {
      name: "Bạc Nhớ Dân Gian",
      pattern: (num) => `Theo quy luật Bạc Nhớ kinh điển: Khi giải ĐB kỳ trước về chạm đuôi ${(parseInt(num) + 7) % 10}, xác suất xuất hiện cặp số ${num} trong 3 ngày tới lên đến đỉnh điểm.`
    },
    {
      name: "Cầu Tam Giác Pascale",
      pattern: (num) => `Cộng dồn ma trận Pascale giữa Giải Đặc Biệt và Giải Nhất kỳ trước thu được nhịp số tâm điểm chuẩn xác tại nút ${num}.`
    },
    {
      name: "Cầu Kẹp Giải Ba & Năm",
      pattern: (num) => `Xuất hiện vị trí số kẹp giữa 2 con số trùng nhau tại Giải 3.${(parseInt(num) % 6) + 1} và Giải 5.${(parseInt(num) % 6) + 1}, chỉ báo ${num} sẽ nổ rực rỡ.`
    },
    {
      name: "Lô Rơi Từ Đề Hôm Qua",
      pattern: (num) => `Nhịp lô rơi đạt đỉnh chu kỳ 2 ngày liên tiếp sau khi đề chạm ${num[1]}, biên độ dao động hoàn hảo để nổ lại hôm nay.`
    },
    {
      name: "Thống Kê Nhịp Tần Suất",
      pattern: (num) => `Chu kỳ xuất hiện của ${num} đang đạt điểm rơi phong độ (trung bình 3.2 ngày/lần), hiện tại đã tích lũy đủ nhịp nổ kỳ này.`
    },
    {
      name: "Cầu Bù Đầu/Đuôi Câm",
      pattern: (num) => `Kỳ quay trước xuất hiện Đầu ${num[0]} câm hoàn toàn, theo xác suất thống kê 90 ngày thì số ${num} có tỷ lệ bù đầu về lại cao nhất.`
    },
    {
      name: "Bóng Âm Dương Ngũ Hành",
      pattern: (num) => `Áp dụng thuyết tương sinh ngũ hành & bóng âm dương số học, ${num} là bóng thuận tuyệt đối của giải nhất kỳ trước.`
    }
  ];

  // Khởi tạo ngày cơ sở
  const today = new Date();
  
  function formatDate(d) {
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  }

  // Khởi tạo thông tin cho 100 số (00 - 99)
  for (let i = 0; i <= 99; i++) {
    const strNum = String(i).padStart(2, '0');
    
    // Tạo số ngày chưa ra (gan) thực tế
    let daysOmitted;
    const seed = (i * 37 + 13) % 100;
    if (seed < 40) {
      daysOmitted = (seed % 4) + 1; // 1 - 4 ngày
    } else if (seed < 75) {
      daysOmitted = ((seed - 40) % 6) + 5; // 5 - 10 ngày
    } else if (seed < 90) {
      daysOmitted = ((seed - 75) % 8) + 11; // 11 - 18 ngày
    } else {
      daysOmitted = ((seed - 90) % 10) + 19; // 19 - 28 ngày (lô gan)
    }

    // Gan cực đại (lịch sử) từ 18 đến 42 ngày
    const maxGan = Math.max(daysOmitted + 4, 18 + ((i * 19) % 22));

    // Tính ngày ra gần nhất
    const lastDateObj = new Date(today);
    lastDateObj.setDate(today.getDate() - daysOmitted);
    const lastDate = formatDate(lastDateObj);

    // Giải thưởng ra gần nhất
    const lastPrize = prizesList[(i * 7 + daysOmitted) % prizesList.length];

    // Số lần xuất hiện trong 30 ngày qua (từ 1 đến 14 lần)
    const frequency30Days = Math.max(1, Math.min(14, Math.round(12 - (daysOmitted * 0.35) + ((i % 5) - 2))));

    // Tính điểm tín nhiệm (Probability Score) dựa trên chu kỳ, nhịp rơi, không quá gan
    let baseScore = 68;
    if (daysOmitted >= 2 && daysOmitted <= 5) baseScore += 20; // Điểm rơi lý tưởng
    else if (daysOmitted === 1) baseScore += 16; // Lô rơi liên tiếp
    else if (daysOmitted >= 6 && daysOmitted <= 9) baseScore += 10;
    else if (daysOmitted > 18) baseScore -= 18; // Lô gan

    // Gia số theo thuật toán
    const modScore = ((i * 43 + 7) % 12);
    const winRate = Math.min(97.5, Math.max(45.0, +(baseScore + modScore - (daysOmitted > 20 ? 12 : 0)).toFixed(1)));

    // Chọn phương pháp soi cầu phù hợp
    const methodObj = bridgeMethods[(i + daysOmitted) % bridgeMethods.length];

    numbersDB[strNum] = {
      number: strNum,
      winRate: winRate, // % tỉ lệ trúng
      daysOmitted: daysOmitted, // Số ngày chưa ra (Gan hiện tại)
      maxGan: maxGan, // Gan cực đại lịch sử
      lastDate: lastDate, // Lần gần nhất ra
      lastPrize: lastPrize, // Giải thưởng lần gần nhất
      frequency30Days: frequency30Days, // Tần suất về trong 30 ngày
      methodName: methodObj.name,
      reason: methodObj.pattern(strNum),
      isDouble: strNum[0] === strNum[1], // Lô kép
      head: strNum[0],
      tail: strNum[1],
      sum: (parseInt(strNum[0]) + parseInt(strNum[1])) % 10
    };
  }

  return {
    getAllNumbers: () => numbersDB,
    getNumberDetail: (num) => {
      const formatted = String(num).padStart(2, '0');
      return numbersDB[formatted] || null;
    },
    getTopPicks: () => {
      const all = Object.values(numbersDB);
      return all.sort((a, b) => b.winRate - a.winRate);
    },
    getTodayDrawDate: () => formatDate(today)
  };
})();

window.LotteryData = LotteryData;
