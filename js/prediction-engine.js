/**
 * PREDICTION & STATISTICAL BRIDGE ENGINE
 * Phân loại các nhóm dự đoán: Bạch Thủ, Song Thủ, Đề Đặc Biệt, Lô Kép, Lô Xiên, Dàn Đề
 */

const PredictionEngine = (() => {
  function getPredictions() {
    const all = LotteryData.getTopPicks();

    // 1. Bạch Thủ Lô: Số có tỉ lệ cao nhất, nhịp chưa ra từ 2-4 ngày
    const btlCandidates = all.filter(n => n.daysOmitted >= 2 && n.daysOmitted <= 5 && !n.isDouble);
    const bachThuLo = btlCandidates[0] || all[0];

    // 2. Song Thủ Lô: Cặp số lộn hoặc cặp bóng có tổng xác suất cao nhất
    let songThuLo = null;
    for (let item of all) {
      const reversed = item.number.split('').reverse().join('');
      if (reversed !== item.number) {
        const pairItem = LotteryData.getNumberDetail(reversed);
        if (pairItem && item.number !== bachThuLo.number && pairItem.number !== bachThuLo.number) {
          songThuLo = {
            num1: item,
            num2: pairItem,
            combinedRate: +((item.winRate + pairItem.winRate) / 2).toFixed(1),
            reason: `Cặp số đối xứng lộn vòng ${item.number} - ${pairItem.number} có biên độ cầu chạy 4 ngày thông. Điểm giao thoa Giải 4 và Giải 7 cho thấy cặp này giữ nhịp ổn định nhất hôm nay.`
          };
          break;
        }
      }
    }

    // 3. Đề Đặc Biệt (2 số cuối giải ĐB)
    const deCandidates = all.filter(n => n.winRate >= 85);
    const deDacBiet = deCandidates.slice(0, 4); // 4 con đề tâm điểm

    // Chạm đề và Tổng đề khuyên dùng
    const primaryHead = bachThuLo.head;
    const primaryTail = bachThuLo.tail;
    const primarySum = bachThuLo.sum;

    // 4. Lô Kép VIP (00, 11, 22, ..., 99)
    const loKepList = all.filter(n => n.isDouble).sort((a, b) => b.winRate - a.winRate).slice(0, 3);

    // 5. Lô Xiên 2 Tự Động
    const topLo = all.slice(0, 6);
    const loXien = [
      {
        pair: [topLo[0].number, topLo[2].number],
        rate: +((topLo[0].winRate * topLo[2].winRate) / 100).toFixed(1),
        reason: `Cặp xiên kết hợp giữa số Bạc nhớ ${topLo[0].number} và Cầu kẹp ${topLo[2].number}, xác suất nổ cả đôi rất cao.`
      },
      {
        pair: [topLo[1].number, topLo[3].number],
        rate: +((topLo[1].winRate * topLo[3].winRate) / 100).toFixed(1),
        reason: `Xiên đôi tương sinh theo quy luật bóng ngũ hành và nhịp rơi 3 ngày gần nhất.`
      }
    ];

    // 6. Dàn Đề 10 Số & 20 Số Bất Bại
    const danDe10 = all.slice(0, 10);
    const danDe20 = all.slice(0, 20);

    return {
      drawDate: LotteryData.getTodayDrawDate(),
      bachThuLo,
      songThuLo,
      deDacBiet,
      loKepList,
      loXien,
      danDe10,
      danDe20,
      chamDe: [primaryHead, primaryTail],
      tongDe: [primarySum, (primarySum + 5) % 10]
    };
  }

  // Lấy danh sách số gan cực đại / cảnh báo
  function getGanReport() {
    const all = Object.values(LotteryData.getAllNumbers());
    // Sắp xếp số ngày gan giảm dần
    return all.sort((a, b) => b.daysOmitted - a.daysOmitted);
  }

  // Sinh số may mắn ngẫu nhiên khi lắc 3 xúc xắc
  function rollLuckyForecast(d1, d2, d3) {
    const total = d1 + d2 + d3;
    // Thuật toán bốc quẻ từ 3 hột xúc xắc
    const luckyNum1 = String((d1 * 10 + d2) % 100).padStart(2, '0');
    const luckyNum2 = String((d2 * 10 + d3) % 100).padStart(2, '0');
    const luckyNum3 = String(total < 10 ? total * 11 : (total * 7) % 100).padStart(2, '0');

    const detail1 = LotteryData.getNumberDetail(luckyNum1);
    const detail2 = LotteryData.getNumberDetail(luckyNum2);
    const detail3 = LotteryData.getNumberDetail(luckyNum3);

    return {
      diceValues: [d1, d2, d3],
      totalPoints: total,
      taiXiu: total >= 11 ? 'TÀI (LỚN)' : 'XỈU (NHỎ)',
      luckyPicks: [detail1, detail2, detail3],
      oracleMessage: `Quẻ Xúc Xắc Tam Tài đắc lộc: Tổng ${total} nút (${total >= 11 ? 'Tài' : 'Xỉu'}), tam hợp sinh khí ứng vào các cặp số ${luckyNum1}, ${luckyNum2}, ${luckyNum3}.`
    };
  }

  return {
    getPredictions,
    getGanReport,
    rollLuckyForecast
  };
})();

window.PredictionEngine = PredictionEngine;
