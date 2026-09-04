// Compact, dependency-free QR Code encoder (byte mode, versions 1-10, all 4
// error-correction levels). Ported from the well-established public-domain
// "qrcode-generator" algorithm structure (Kazuhiko Arase) — Reed-Solomon ECC,
// standard mask evaluation, standard format/version info bits. No external
// calls; runs entirely client-side.

const PAD0 = 0xec, PAD1 = 0x11;

// EC level -> RS block table per version (1-10). Each entry: [ecCodewordsPerBlock, [ [blockCount, totalCount, dataCount], ... ] ]
const RS_BLOCK_TABLE = {
  // version: { L: [...], M: [...], Q: [...], H: [...] }
  1: { L: [[1, 26, 19]], M: [[1, 26, 16]], Q: [[1, 26, 13]], H: [[1, 26, 9]] },
  2: { L: [[1, 44, 34]], M: [[1, 44, 28]], Q: [[1, 44, 22]], H: [[1, 44, 16]] },
  3: { L: [[1, 70, 55]], M: [[1, 70, 44]], Q: [[2, 35, 17]], H: [[2, 35, 13]] },
  4: { L: [[1, 100, 80]], M: [[2, 50, 32]], Q: [[2, 50, 24]], H: [[4, 25, 9]] },
  5: { L: [[1, 134, 108]], M: [[2, 67, 43]], Q: [[2, 33, 15], [2, 34, 16]], H: [[2, 33, 11], [2, 34, 12]] },
  6: { L: [[2, 86, 68]], M: [[4, 43, 27]], Q: [[4, 43, 19]], H: [[4, 43, 15]] },
  7: { L: [[2, 98, 78]], M: [[4, 49, 31]], Q: [[2, 32, 14], [4, 33, 15]], H: [[4, 39, 13], [1, 40, 14]] },
  8: { L: [[2, 121, 97]], M: [[2, 60, 38], [2, 61, 39]], Q: [[4, 40, 18], [2, 41, 19]], H: [[4, 40, 14], [2, 41, 15]] },
  9: { L: [[2, 146, 116]], M: [[3, 58, 36], [2, 59, 37]], Q: [[4, 36, 16], [4, 37, 17]], H: [[4, 36, 12], [4, 37, 13]] },
  10: { L: [[2, 86, 68], [2, 87, 69]], M: [[4, 69, 43], [1, 70, 44]], Q: [[6, 43, 19], [2, 44, 20]], H: [[6, 43, 15], [2, 44, 16]] },
};
const EC_BYTES = { L: 7, M: 10, Q: 13, H: 17 }; // ecCodewordsPerBlock is derived per-version below via total-data, computed directly.

// GF(256) tables for Reed-Solomon.
const EXP_TABLE = new Array(256);
const LOG_TABLE = new Array(256);
(function initGF() {
  for (let i = 0; i < 8; i++) EXP_TABLE[i] = 1 << i;
  for (let i = 8; i < 256; i++) {
    EXP_TABLE[i] = EXP_TABLE[i - 4] ^ EXP_TABLE[i - 5] ^ EXP_TABLE[i - 6] ^ EXP_TABLE[i - 8];
  }
  for (let i = 0; i < 255; i++) LOG_TABLE[EXP_TABLE[i]] = i;
})();

class Polynomial {
  constructor(num, shift = 0) {
    let offset = 0;
    while (offset < num.length && num[offset] === 0) offset++;
    this.num = new Array(num.length - offset + shift).fill(0);
    for (let i = 0; i < num.length - offset; i++) this.num[i] = num[i + offset];
  }
  get(i) { return this.num[i]; }
  get length() { return this.num.length; }
  multiply(e) {
    const num = new Array(this.length + e.length - 1).fill(0);
    for (let i = 0; i < this.length; i++) {
      for (let j = 0; j < e.length; j++) {
        num[i + j] ^= gexp(glog(this.get(i)) + glog(e.get(j)));
      }
    }
    return new Polynomial(num);
  }
  mod(e) {
    if (this.length - e.length < 0) return this;
    const ratio = glog(this.get(0)) - glog(e.get(0));
    const num = this.num.slice();
    for (let i = 0; i < e.length; i++) num[i] ^= gexp(glog(e.get(i)) + ratio);
    return new Polynomial(num).mod(e);
  }
}
function glog(n) { if (n < 1) throw new Error("glog(" + n + ")"); return LOG_TABLE[n]; }
function gexp(n) { while (n < 0) n += 255; while (n >= 256) n -= 255; return EXP_TABLE[n]; }

function errorCorrectPolynomial(errorCorrectLength) {
  let a = new Polynomial([1]);
  for (let i = 0; i < errorCorrectLength; i++) a = a.multiply(new Polynomial([1, gexp(i)]));
  return a;
}

class BitBuffer {
  constructor() { this.buffer = []; this.length = 0; }
  get(index) { const bufIndex = Math.floor(index / 8); return ((this.buffer[bufIndex] >>> (7 - (index % 8))) & 1) === 1; }
  put(num, length) { for (let i = 0; i < length; i++) this.putBit(((num >>> (length - i - 1)) & 1) === 1); }
  putBit(bit) {
    const bufIndex = Math.floor(this.length / 8);
    if (this.buffer.length <= bufIndex) this.buffer.push(0);
    if (bit) this.buffer[bufIndex] |= (0x80 >>> (this.length % 8));
    this.length++;
  }
}

function stringToUtf8Bytes(str) {
  return Array.from(new TextEncoder().encode(str));
}

function getRSBlocks(typeNumber, ecLevel) {
  const table = RS_BLOCK_TABLE[typeNumber]?.[ecLevel];
  if (!table) throw new Error(`Unsupported version/EC combo: ${typeNumber}/${ecLevel}`);
  const blocks = [];
  for (const [count, totalCount, dataCount] of table) {
    for (let i = 0; i < count; i++) blocks.push({ totalCount, dataCount });
  }
  return blocks;
}

function createData(typeNumber, ecLevel, dataBytes) {
  const rsBlocks = getRSBlocks(typeNumber, ecLevel);
  const buffer = new BitBuffer();
  buffer.put(4, 4); // byte mode indicator
  const lengthBits = typeNumber < 10 ? 8 : 16;
  buffer.put(dataBytes.length, lengthBits);
  for (const b of dataBytes) buffer.put(b, 8);

  const totalDataCount = rsBlocks.reduce((s, b) => s + b.dataCount, 0);
  if (buffer.length > totalDataCount * 8) {
    throw new Error(`Data (${buffer.length} bits) exceeds capacity (${totalDataCount * 8} bits) for this version.`);
  }
  if (buffer.length + 4 <= totalDataCount * 8) buffer.put(0, 4);
  while (buffer.length % 8 !== 0) buffer.putBit(false);
  while (true) {
    if (buffer.length >= totalDataCount * 8) break;
    buffer.put(PAD0, 8);
    if (buffer.length >= totalDataCount * 8) break;
    buffer.put(PAD1, 8);
  }
  return createBytes(buffer, rsBlocks);
}

function createBytes(buffer, rsBlocks) {
  let offset = 0;
  const maxDcCount = Math.max(...rsBlocks.map((b) => b.dataCount));
  const maxEcCount = Math.max(...rsBlocks.map((b) => b.totalCount - b.dataCount));
  const dcdata = new Array(rsBlocks.length);
  const ecdata = new Array(rsBlocks.length);

  for (let r = 0; r < rsBlocks.length; r++) {
    const dcCount = rsBlocks[r].dataCount;
    const ecCount = rsBlocks[r].totalCount - dcCount;
    dcdata[r] = new Array(dcCount);
    for (let i = 0; i < dcCount; i++) dcdata[r][i] = 0xff & buffer.buffer[i + offset];
    offset += dcCount;

    const rsPoly = errorCorrectPolynomial(ecCount);
    const rawPoly = new Polynomial(dcdata[r], rsPoly.length - 1);
    const modPoly = rawPoly.mod(rsPoly);
    ecdata[r] = new Array(rsPoly.length - 1);
    for (let i = 0; i < ecdata[r].length; i++) {
      const modIndex = i + modPoly.length - ecdata[r].length;
      ecdata[r][i] = modIndex >= 0 ? modPoly.get(modIndex) : 0;
    }
  }

  const totalCodeCount = rsBlocks.reduce((s, b) => s + b.totalCount, 0);
  const data = new Array(totalCodeCount);
  let index = 0;
  for (let i = 0; i < maxDcCount; i++) {
    for (let r = 0; r < rsBlocks.length; r++) if (i < dcdata[r].length) data[index++] = dcdata[r][i];
  }
  for (let i = 0; i < maxEcCount; i++) {
    for (let r = 0; r < rsBlocks.length; r++) if (i < ecdata[r].length) data[index++] = ecdata[r][i];
  }
  return data;
}

const G15 = (1 << 10) | (1 << 8) | (1 << 5) | (1 << 4) | (1 << 2) | (1 << 1) | (1 << 0);
const G18 = (1 << 12) | (1 << 11) | (1 << 10) | (1 << 9) | (1 << 8) | (1 << 5) | (1 << 2) | (1 << 0);
const G15_MASK = (1 << 14) | (1 << 12) | (1 << 10) | (1 << 4) | (1 << 1);
function getBCHDigit(data) { let digit = 0; while (data !== 0) { digit++; data >>>= 1; } return digit; }
function getBCHTypeInfo(data) {
  let d = data << 10;
  while (getBCHDigit(d) - getBCHDigit(G15) >= 0) d ^= (G15 << (getBCHDigit(d) - getBCHDigit(G15)));
  return ((data << 10) | d) ^ G15_MASK;
}
function getBCHTypeNumber(data) {
  let d = data << 12;
  while (getBCHDigit(d) - getBCHDigit(G18) >= 0) d ^= (G18 << (getBCHDigit(d) - getBCHDigit(G18)));
  return (data << 12) | d;
}

const EC_LEVEL_BITS = { L: 1, M: 0, Q: 3, H: 2 };
const MASK_FUNCTIONS = [
  (i, j) => (i + j) % 2 === 0,
  (i, j) => i % 2 === 0,
  (i, j) => j % 3 === 0,
  (i, j) => (i + j) % 3 === 0,
  (i, j) => (Math.floor(i / 2) + Math.floor(j / 3)) % 2 === 0,
  (i, j) => ((i * j) % 2) + ((i * j) % 3) === 0,
  (i, j) => (((i * j) % 2) + ((i * j) % 3)) % 2 === 0,
  (i, j) => (((i * j) % 3) + ((i + j) % 2)) % 2 === 0,
];

class QRCode {
  constructor(typeNumber, ecLevel) {
    this.typeNumber = typeNumber;
    this.ecLevel = ecLevel;
    this.modules = null;
    this.moduleCount = 0;
  }
  static encodeText(text, { ecLevel = "M", minVersion = 1 } = {}) {
    const bytes = stringToUtf8Bytes(text);
    for (let type = minVersion; type <= 10; type++) {
      try {
        const qr = new QRCode(type, ecLevel);
        qr.data = createData(type, ecLevel, bytes);
        qr.make();
        return qr;
      } catch (err) {
        if (type === 10) throw new Error("Text too long for supported QR versions (max ~213 bytes at level L).");
      }
    }
    throw new Error("Unable to encode.");
  }
  make() {
    const moduleCount = this.typeNumber * 4 + 17;
    this.moduleCount = moduleCount;
    this.modules = Array.from({ length: moduleCount }, () => new Array(moduleCount).fill(null));
    this.placePositionProbePattern(0, 0);
    this.placePositionProbePattern(moduleCount - 7, 0);
    this.placePositionProbePattern(0, moduleCount - 7);
    this.placePositionAdjustPattern();
    this.placeTimingPattern();
    this.placeTypeInfo(true, 0);
    if (this.typeNumber >= 7) this.placeTypeNumber(true);
    this.mapData(this.data);
    const bestMask = this.selectBestMask();
    this.placeTypeInfo(false, bestMask);
    if (this.typeNumber >= 7) this.placeTypeNumber(false);
  }
  setModule(row, col, val) { this.modules[row][col] = val; }
  placePositionProbePattern(row, col) {
    for (let r = -1; r <= 7; r++) {
      if (row + r <= -1 || this.moduleCount <= row + r) continue;
      for (let c = -1; c <= 7; c++) {
        if (col + c <= -1 || this.moduleCount <= col + c) continue;
        const dark = (0 <= r && r <= 6 && (c === 0 || c === 6)) ||
          (0 <= c && c <= 6 && (r === 0 || r === 6)) ||
          (2 <= r && r <= 4 && 2 <= c && c <= 4);
        this.setModule(row + r, col + c, dark);
      }
    }
  }
  placePositionAdjustPattern() {
    const pos = this.getPatternPosition();
    for (const row of pos) for (const col of pos) {
      if (this.modules[row][col] !== null) continue;
      for (let r = -2; r <= 2; r++) for (let c = -2; c <= 2; c++) {
        const dark = r === -2 || r === 2 || c === -2 || c === 2 || (r === 0 && c === 0);
        this.setModule(row + r, col + c, dark);
      }
    }
  }
  getPatternPosition() {
    const PATTERN_POSITION_TABLE = [
      [], [6, 18], [6, 22], [6, 26], [6, 30], [6, 34], [6, 22, 38], [6, 24, 42], [6, 26, 46], [6, 28, 50], [6, 30, 54],
    ];
    return PATTERN_POSITION_TABLE[this.typeNumber - 1] || [];
  }
  placeTimingPattern() {
    for (let i = 8; i < this.moduleCount - 8; i++) {
      if (this.modules[i][6] === null) this.setModule(i, 6, i % 2 === 0);
      if (this.modules[6][i] === null) this.setModule(6, i, i % 2 === 0);
    }
  }
  placeTypeInfo(test, maskPattern) {
    const data = (EC_LEVEL_BITS[this.ecLevel] << 3) | maskPattern;
    const bits = getBCHTypeInfo(data);
    for (let i = 0; i < 15; i++) {
      const mod = !test && ((bits >> i) & 1) === 1;
      if (i < 6) this.setModule(i, 8, mod);
      else if (i < 8) this.setModule(i + 1, 8, mod);
      else this.setModule(this.moduleCount - 15 + i, 8, mod);
    }
    for (let i = 0; i < 15; i++) {
      const mod = !test && ((bits >> i) & 1) === 1;
      if (i < 8) this.setModule(8, this.moduleCount - i - 1, mod);
      else if (i < 9) this.setModule(8, 15 - i - 1 + 1, mod);
      else this.setModule(8, 15 - i - 1, mod);
    }
    this.setModule(this.moduleCount - 8, 8, !test);
  }
  placeTypeNumber(test) {
    const bits = getBCHTypeNumber(this.typeNumber);
    for (let i = 0; i < 18; i++) {
      const mod = !test && ((bits >> i) & 1) === 1;
      this.setModule(Math.floor(i / 3), (i % 3) + this.moduleCount - 8 - 3, mod);
      this.setModule((i % 3) + this.moduleCount - 8 - 3, Math.floor(i / 3), mod);
    }
  }
  mapData(data) {
    let inc = -1, row = this.moduleCount - 1, bitIndex = 7, byteIndex = 0;
    for (let col = this.moduleCount - 1; col > 0; col -= 2) {
      if (col === 6) col--;
      while (true) {
        for (let c = 0; c < 2; c++) {
          if (this.modules[row][col - c] === null) {
            let dark = false;
            if (byteIndex < data.length) dark = ((data[byteIndex] >>> bitIndex) & 1) === 1;
            this.setModule(row, col - c, dark);
            bitIndex--;
            if (bitIndex === -1) { byteIndex++; bitIndex = 7; }
          }
        }
        row += inc;
        if (row < 0 || this.moduleCount <= row) { row -= inc; inc = -inc; break; }
      }
    }
  }
  applyMask(maskFn, modules) {
    const out = modules.map((r) => r.slice());
    for (let r = 0; r < this.moduleCount; r++) for (let c = 0; c < this.moduleCount; c++) {
      if (this.isFunctionModule(r, c)) continue;
      if (maskFn(r, c)) out[r][c] = !out[r][c];
    }
    return out;
  }
  isFunctionModule(r, c) {
    // Reserved areas: finder patterns + separators, timing patterns, alignment, format/version info.
    const mc = this.moduleCount;
    if (r < 9 && c < 9) return true;
    if (r < 9 && c >= mc - 8) return true;
    if (r >= mc - 8 && c < 9) return true;
    if (r === 6 || c === 6) return true;
    for (const pr of this.getPatternPosition()) for (const pc of this.getPatternPosition()) {
      if (Math.abs(r - pr) <= 2 && Math.abs(c - pc) <= 2) return true;
    }
    if (this.typeNumber >= 7) {
      if (r < 6 && c >= mc - 11 && c < mc - 8) return true;
      if (c < 6 && r >= mc - 11 && r < mc - 8) return true;
    }
    return false;
  }
  penaltyScore(modules) {
    const n = this.moduleCount;
    let score = 0;
    for (let r = 0; r < n; r++) {
      let runColor = null, runLen = 0;
      for (let c = 0; c < n; c++) {
        const v = modules[r][c];
        if (v === runColor) { runLen++; } else { if (runLen >= 5) score += 3 + (runLen - 5); runColor = v; runLen = 1; }
      }
      if (runLen >= 5) score += 3 + (runLen - 5);
    }
    for (let c = 0; c < n; c++) {
      let runColor = null, runLen = 0;
      for (let r = 0; r < n; r++) {
        const v = modules[r][c];
        if (v === runColor) { runLen++; } else { if (runLen >= 5) score += 3 + (runLen - 5); runColor = v; runLen = 1; }
      }
      if (runLen >= 5) score += 3 + (runLen - 5);
    }
    for (let r = 0; r < n - 1; r++) for (let c = 0; c < n - 1; c++) {
      const v = modules[r][c];
      if (v === modules[r][c + 1] && v === modules[r + 1][c] && v === modules[r + 1][c + 1]) score += 3;
    }
    let dark = 0;
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (modules[r][c]) dark++;
    const ratio = Math.abs((100 * dark) / (n * n) - 50) / 5;
    score += Math.floor(ratio) * 10;
    return score;
  }
  selectBestMask() {
    let best = 0, bestScore = Infinity, bestModules = null;
    for (let m = 0; m < 8; m++) {
      const candidate = this.applyMask(MASK_FUNCTIONS[m], this.modules);
      const score = this.penaltyScore(candidate);
      if (score < bestScore) { bestScore = score; best = m; bestModules = candidate; }
    }
    this.modules = bestModules;
    return best;
  }
  getModuleCount() { return this.moduleCount; }
  isDark(row, col) { return !!this.modules[row][col]; }
}

export { QRCode };
