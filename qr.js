// Minimal, dependency-free QR-code encoder — byte mode, foutcorrectie M, versies 1 t/m 4.
// Geschreven en getest voor dit prototype (bureau/qr-stickers.html). Geen externe library.
// Ondersteunt alleen wat de sticker-demo nodig heeft: platte ASCII/UTF-8 tekst tot 62 bytes.
(function (global) {
  'use strict';

  // ---- GF(256) rekentabellen, primitief polynoom 0x11D (QR-standaard) ----
  var EXP = new Array(512);
  var LOG = new Array(256);
  (function initGF() {
    var x = 1;
    for (var i = 0; i < 255; i++) {
      EXP[i] = x;
      LOG[x] = i;
      x <<= 1;
      if (x & 0x100) x ^= 0x11D;
    }
    for (var j = 255; j < 512; j++) EXP[j] = EXP[j - 255];
  })();
  function gmul(a, b) {
    if (a === 0 || b === 0) return 0;
    return EXP[LOG[a] + LOG[b]];
  }

  function rsGeneratorPoly(degree) {
    var g = [1];
    for (var i = 0; i < degree; i++) {
      var next = new Array(g.length + 1).fill(0);
      for (var j = 0; j < g.length; j++) {
        next[j] ^= g[j];
        next[j + 1] ^= gmul(g[j], EXP[i]);
      }
      g = next;
    }
    return g;
  }

  function rsEncode(dataBytes, eccCount) {
    var gen = rsGeneratorPoly(eccCount);
    var genCoefs = gen.slice(1);
    var remainder = new Array(eccCount).fill(0);
    for (var i = 0; i < dataBytes.length; i++) {
      var factor = dataBytes[i] ^ remainder[0];
      remainder.shift();
      remainder.push(0);
      for (var j = 0; j < eccCount; j++) {
        remainder[j] ^= gmul(genCoefs[j], factor);
      }
    }
    return remainder;
  }

  // ---- versietabellen, alleen foutcorrectieniveau M ----
  var VERSIONS = {
    1: { size: 21, align: null, blocks: [{ data: 16, ec: 10 }] },
    2: { size: 25, align: 18, blocks: [{ data: 28, ec: 16 }] },
    3: { size: 29, align: 22, blocks: [{ data: 44, ec: 26 }] },
    4: { size: 33, align: 26, blocks: [{ data: 32, ec: 18 }, { data: 32, ec: 18 }] },
    5: { size: 37, align: 30, blocks: [{ data: 43, ec: 24 }, { data: 43, ec: 24 }] },
    6: { size: 41, align: 34, blocks: [{ data: 27, ec: 16 }, { data: 27, ec: 16 }, { data: 27, ec: 16 }, { data: 27, ec: 16 }] }
  };

  function byteCapacity(v) {
    var total = 0;
    VERSIONS[v].blocks.forEach(function (b) { total += b.data; });
    return total - 2; // header (4 bits modus + 8 bits lengte) kost ~2 byte aan capaciteit
  }

  function chooseVersion(byteLen) {
    for (var v = 1; v <= 6; v++) {
      if (byteLen <= byteCapacity(v)) return v;
    }
    return null; // te lang voor dit minimale encoder — v5+ wordt hier niet ondersteund
  }

  function toUtf8Bytes(str) {
    if (typeof TextEncoder !== 'undefined') return Array.from(new TextEncoder().encode(str));
    // val terug op escape/unescape voor zeer oude omgevingen
    var out = [];
    var esc = unescape(encodeURIComponent(str));
    for (var i = 0; i < esc.length; i++) out.push(esc.charCodeAt(i));
    return out;
  }

  function BitBuf() { this.bits = []; }
  BitBuf.prototype.push = function (val, len) {
    for (var i = len - 1; i >= 0; i--) this.bits.push((val >>> i) & 1);
  };
  BitBuf.prototype.pushBytes = function (bytes) {
    for (var i = 0; i < bytes.length; i++) this.push(bytes[i], 8);
  };

  function encodeData(text, version) {
    var bytes = toUtf8Bytes(text);
    var blocks = VERSIONS[version].blocks;
    var totalDataCodewords = 0;
    blocks.forEach(function (b) { totalDataCodewords += b.data; });

    var bb = new BitBuf();
    bb.push(0x4, 4); // byte-modus
    bb.push(bytes.length, 8); // lengte-indicator (8 bits, versies 1-9)
    bb.pushBytes(bytes);

    var capBits = totalDataCodewords * 8;
    var termLen = Math.min(4, capBits - bb.bits.length);
    if (termLen > 0) bb.push(0, termLen);
    while (bb.bits.length % 8 !== 0) bb.bits.push(0);

    var padBytes = [0xEC, 0x11], pi = 0;
    while (bb.bits.length < capBits) {
      bb.pushBytes([padBytes[pi % 2]]);
      pi++;
    }

    var dataCodewords = [];
    for (var i = 0; i < bb.bits.length; i += 8) {
      var v = 0;
      for (var j = 0; j < 8; j++) v = (v << 1) | bb.bits[i + j];
      dataCodewords.push(v);
    }

    var blocksData = [], blocksEcc = [], off = 0;
    blocks.forEach(function (blk) {
      var d = dataCodewords.slice(off, off + blk.data);
      off += blk.data;
      blocksData.push(d);
      blocksEcc.push(rsEncode(d, blk.ec));
    });

    var maxData = Math.max.apply(null, blocks.map(function (b) { return b.data; }));
    var maxEcc = Math.max.apply(null, blocks.map(function (b) { return b.ec; }));
    var out = [];
    for (i = 0; i < maxData; i++) {
      for (var bi = 0; bi < blocksData.length; bi++) if (i < blocksData[bi].length) out.push(blocksData[bi][i]);
    }
    for (i = 0; i < maxEcc; i++) {
      for (bi = 0; bi < blocksEcc.length; bi++) if (i < blocksEcc[bi].length) out.push(blocksEcc[bi][i]);
    }
    return out;
  }

  function makeGrid(size, fill) {
    var g = [];
    for (var i = 0; i < size; i++) g.push(new Array(size).fill(fill));
    return g;
  }
  function setModule(m, f, x, y, val) { m[y][x] = val ? 1 : 0; f[y][x] = true; }

  function drawFinder(m, f, cx, cy) {
    for (var dy = -1; dy <= 7; dy++) {
      for (var dx = -1; dx <= 7; dx++) {
        var x = cx + dx, y = cy + dy;
        if (x < 0 || y < 0 || x >= m.length || y >= m.length) continue;
        var dark;
        if (dx >= 0 && dx <= 6 && dy >= 0 && dy <= 6) {
          var onBorder = (dx === 0 || dx === 6 || dy === 0 || dy === 6);
          var inCenter = (dx >= 2 && dx <= 4 && dy >= 2 && dy <= 4);
          dark = onBorder || inCenter;
        } else {
          dark = false;
        }
        setModule(m, f, x, y, dark);
      }
    }
  }
  function drawAlignment(m, f, cx, cy) {
    for (var dy = -2; dy <= 2; dy++) {
      for (var dx = -2; dx <= 2; dx++) {
        var onBorder = (dx === -2 || dx === 2 || dy === -2 || dy === 2);
        var center = (dx === 0 && dy === 0);
        setModule(m, f, cx + dx, cy + dy, onBorder || center);
      }
    }
  }
  function drawTiming(m, f, size) {
    for (var i = 8; i < size - 8; i++) {
      if (!f[6][i]) setModule(m, f, i, 6, i % 2 === 0);
      if (!f[i][6]) setModule(m, f, 6, i, i % 2 === 0);
    }
  }
  function reserveFormatAreas(m, f, size) {
    var i;
    for (i = 0; i <= 8; i++) { if (i === 6) continue; setModule(m, f, i, 8, false); }
    for (i = 0; i <= 8; i++) { if (i === 6) continue; setModule(m, f, 8, i, false); }
    for (i = 0; i < 8; i++) setModule(m, f, size - 1 - i, 8, false);
    for (i = 0; i < 7; i++) setModule(m, f, 8, size - 1 - i, false);
    setModule(m, f, 8, size - 8, true);
  }
  function drawCodewords(m, f, size, codewords) {
    var bits = [];
    codewords.forEach(function (c) { for (var i = 7; i >= 0; i--) bits.push((c >>> i) & 1); });
    var bi = 0, upward = true;
    for (var right = size - 1; right >= 1; right -= 2) {
      if (right === 6) right = 5;
      for (var vert = 0; vert < size; vert++) {
        for (var j = 0; j < 2; j++) {
          var x = right - j;
          var y = upward ? size - 1 - vert : vert;
          if (!f[y][x]) {
            m[y][x] = bi < bits.length ? bits[bi] : 0;
            bi++;
          }
        }
      }
      upward = !upward;
    }
  }
  function applyMask(m, f, size) {
    for (var y = 0; y < size; y++) {
      for (var x = 0; x < size; x++) {
        if (!f[y][x] && (x + y) % 2 === 0) m[y][x] ^= 1; // maskerpatroon 0, formaatbits hieronder komen overeen
      }
    }
  }
  function formatBits() {
    var maskIndex = 0, eccBits = 0x0; // M
    var data = (eccBits << 3) | maskIndex;
    var d = data << 10;
    var g = 0x537; // generatorpolynoom voor formaat-BCH
    for (var i = 14; i >= 10; i--) { if ((d >> i) & 1) d ^= (g << (i - 10)); }
    var format = (data << 10) | (d & 0x3FF);
    format ^= 0x5412;
    return format;
  }
  function placeFormatBits(m, size) {
    var bits15 = formatBits();
    function bitAt(i) { return (bits15 >> i) & 1; }
    var i, col, row;
    for (i = 0; i <= 5; i++) m[i][8] = bitAt(i);
    m[7][8] = bitAt(6);
    m[8][8] = bitAt(7);
    m[8][7] = bitAt(8);
    for (i = 9; i <= 14; i++) { col = 14 - i; m[8][col] = bitAt(i); }
    for (i = 0; i < 8; i++) { col = size - 1 - i; m[8][col] = bitAt(i); }
    for (i = 8; i <= 14; i++) { row = size - 15 + i; m[row][8] = bitAt(i); }
    m[size - 8][8] = 1;
  }

  function buildMatrix(text) {
    var byteLen = toUtf8Bytes(text).length;
    var version = chooseVersion(byteLen);
    if (!version) throw new Error('QR: tekst te lang voor dit minimale encoder (max ' + byteCapacity(6) + ' bytes)');
    var size = VERSIONS[version].size;
    var m = makeGrid(size, null);
    var f = makeGrid(size, false);

    drawFinder(m, f, 0, 0);
    drawFinder(m, f, size - 7, 0);
    drawFinder(m, f, 0, size - 7);
    var align = VERSIONS[version].align;
    if (align !== null) drawAlignment(m, f, align, align);
    drawTiming(m, f, size);
    reserveFormatAreas(m, f, size);

    drawCodewords(m, f, size, encodeData(text, version));
    applyMask(m, f, size);
    placeFormatBits(m, size);

    for (var y = 0; y < size; y++) for (var x = 0; x < size; x++) if (m[y][x] === null) m[y][x] = 0;
    return { matrix: m, size: size, version: version };
  }

  // Rendert een SVG-string (vierkant, quiet zone van 4 modules, currentColor voor de donkere modules).
  function toSVG(text, opts) {
    opts = opts || {};
    var moduleSize = opts.moduleSize || 4;
    var quiet = opts.quiet == null ? 4 : opts.quiet;
    var color = opts.color || 'currentColor';
    var built = buildMatrix(text);
    var size = built.size, m = built.matrix;
    var total = (size + quiet * 2) * moduleSize;
    var rects = [];
    for (var y = 0; y < size; y++) {
      for (var x = 0; x < size; x++) {
        if (m[y][x] === 1) {
          rects.push('<rect x="' + ((x + quiet) * moduleSize) + '" y="' + ((y + quiet) * moduleSize) +
            '" width="' + moduleSize + '" height="' + moduleSize + '"/>');
        }
      }
    }
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + total + ' ' + total +
      '" width="' + total + '" height="' + total + '" role="img" aria-hidden="true">' +
      '<rect x="0" y="0" width="' + total + '" height="' + total + '" fill="#FFFFFF"/>' +
      '<g fill="' + color + '">' + rects.join('') + '</g></svg>';
  }

  global.PLQR = { buildMatrix: buildMatrix, toSVG: toSVG, byteCapacity: byteCapacity };
})(typeof window !== 'undefined' ? window : this);
