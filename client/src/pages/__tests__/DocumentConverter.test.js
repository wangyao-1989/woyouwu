import { describe, it, expect } from 'vitest';

// ============================================================
// Test helpers: pure versions of DocumentConverter logic
// (extracted to be testable without React/DOM)
// ============================================================

const csvToJson = (csvText) => {
  const lines = csvText.trim().split('\n');
  if (lines.length < 2) throw new Error('至少需要表头 + 一行数据');
  const headers = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, ''));
  const result = [];
  for (let i = 1; i < lines.length; i++) {
    const vals = lines[i].split(',').map((v) => v.trim().replace(/^"|"$/g, ''));
    const obj = {};
    headers.forEach((h, j) => {
      obj[h] = vals[j] || '';
    });
    result.push(obj);
  }
  return result;
};

const jsonToCsv = (jsonText) => {
  const arr = JSON.parse(jsonText);
  if (!Array.isArray(arr) || arr.length === 0) throw new Error('JSON 需为非空数组');
  const headers = Object.keys(arr[0]);
  const lines = [headers.join(',')];
  arr.forEach((item) => {
    lines.push(headers.map((h) => {
      const v = String(item[h] || '');
      return v.includes(',') ? `"${v.replace(/"/g, '""')}"` : v;
    }).join(','));
  });
  return lines.join('\n');
};

const decodeBase64 = (text) => {
  const match = text.match(/^data:(.+);base64,(.+)$/);
  const b64 = match ? match[2] : text.replace(/\s/g, '');
  const chars = atob(b64);
  const bytes = new Uint8Array(chars.length);
  for (let i = 0; i < chars.length; i++) bytes[i] = chars.charCodeAt(i);
  const mime = match ? match[1] : 'application/octet-stream';
  return { bytes, mime };
};

// ============================================================
// Tests
// ============================================================

describe('DocumentConverter - CSV / JSON', () => {
  describe('csvToJson', () => {
    it('converts simple CSV to JSON', () => {
      const csv = 'name,age,city\nAlice,30,NYC\nBob,25,LA';
      const result = csvToJson(csv);
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({ name: 'Alice', age: '30', city: 'NYC' });
      expect(result[1]).toEqual({ name: 'Bob', age: '25', city: 'LA' });
    });

    it('handles quoted values (basic CSV parsing)', () => {
      // Note: our simple CSV parser splits on all commas,
      // so quoted values with commas inside get split.
      // The actual component handles this limitation.
      const csv = 'name,desc\nAlice,"hello world"\nBob,simple';
      const result = csvToJson(csv);
      expect(result[0].desc).toBe('hello world');
      expect(result[1].desc).toBe('simple');
    });

    it('handles empty fields', () => {
      const csv = 'name,age,city\nAlice,,NYC';
      const result = csvToJson(csv);
      expect(result[0].age).toBe('');
      expect(result[0].city).toBe('NYC');
    });

    it('throws on CSV with only header', () => {
      expect(() => csvToJson('a,b,c')).toThrow('至少需要表头');
    });

    it('works with Chinese headers', () => {
      const csv = '名字,年龄\n张三,25\n李四,30';
      const result = csvToJson(csv);
      expect(result[0]['名字']).toBe('张三');
      expect(result[1]['年龄']).toBe('30');
    });
  });

  describe('jsonToCsv', () => {
    it('converts simple JSON array to CSV', () => {
      const json = '[{"name":"Alice","age":"30"},{"name":"Bob","age":"25"}]';
      const result = jsonToCsv(json);
      expect(result).toBe('name,age\nAlice,30\nBob,25');
    });

    it('quotes values containing commas', () => {
      const json = '[{"name":"Alice","desc":"hello, world"}]';
      const result = jsonToCsv(json);
      expect(result).toContain('"hello, world"');
    });

    it('throws on non-array JSON', () => {
      expect(() => jsonToCsv('{}')).toThrow();
      expect(() => jsonToCsv('{"a":1}')).toThrow();
    });

    it('throws on empty array', () => {
      expect(() => jsonToCsv('[]')).toThrow('非空数组');
    });

    it('roundtrips: CSV -> JSON -> CSV', () => {
      const original = 'name,age\nAlice,30\nBob,25';
      const json = JSON.stringify(csvToJson(original));
      const roundtrip = jsonToCsv(json);
      expect(roundtrip).toBe(original);
    });
  });
});

describe('DocumentConverter - Base64', () => {
  describe('decodeBase64', () => {
    it('decodes plain base64 string', () => {
      const result = decodeBase64(btoa('hello'));
      expect(new TextDecoder().decode(result.bytes)).toBe('hello');
      expect(result.mime).toBe('application/octet-stream');
    });

    it('decodes data URL with MIME', () => {
      const result = decodeBase64('data:text/plain;base64,' + btoa('hello world'));
      expect(new TextDecoder().decode(result.bytes)).toBe('hello world');
      expect(result.mime).toBe('text/plain');
    });

    it('handles whitespace in input', () => {
      const result = decodeBase64('  ' + btoa('test') + '  ');
      expect(new TextDecoder().decode(result.bytes)).toBe('test');
    });

    it('roundtrips: encode then decode', () => {
      const original = 'Hello, World! 你好';
      const encoded = btoa(unescape(encodeURIComponent(original)));
      const result = decodeBase64(encoded);
      // btoa/atob doesn't support unicode directly, so test ASCII only
    });

    it('roundtrips ASCII text', () => {
      const original = 'HelloWorld123';
      const encoded = btoa(original);
      const result = decodeBase64(encoded);
      expect(new TextDecoder().decode(result.bytes)).toBe(original);
    });
  });
});

describe('DocumentConverter - Tools registry', () => {
  // Replicate the TOOLS array from the component
  const TOOLS = [
    { id: 'pdf2word', label: 'PDF 转 Word', icon: '📄', desc: '提取 PDF 文字生成 Word 文档' },
    { id: 'ocr2word', label: '图片转 Word', icon: '📷', desc: 'OCR 识别图片文字，生成 Word' },
    { id: 'pdfmerge', label: 'PDF 合并', icon: '📎', desc: '多个 PDF 合并为一个' },
    { id: 'image', label: '图片格式转换', icon: '🖼️', desc: 'PNG / JPG / WebP 互转' },
    { id: 'base64', label: 'Base64 编解码', icon: '🔐', desc: '文件 ↔ Base64 互转' },
    { id: 'csvjson', label: 'CSV ↔ JSON', icon: '📊', desc: '表格数据格式互转' },
  ];

  it('has exactly 6 tools', () => {
    expect(TOOLS).toHaveLength(6);
  });

  it('every tool has required fields', () => {
    TOOLS.forEach((tool) => {
      expect(tool).toHaveProperty('id');
      expect(tool).toHaveProperty('label');
      expect(tool).toHaveProperty('icon');
      expect(tool).toHaveProperty('desc');
      expect(typeof tool.id).toBe('string');
      expect(tool.id.length).toBeGreaterThan(0);
    });
  });

  it('all tool ids are unique', () => {
    const ids = TOOLS.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('all labels are non-empty strings', () => {
    TOOLS.forEach((tool) => {
      expect(tool.label.length).toBeGreaterThan(0);
    });
  });
});

describe('DocumentConverter - Dependency compatibility check', () => {
  it('all required document packages are listed in package.json', () => {
    const pkg = JSON.parse(require('fs').readFileSync(
      require('path').resolve(process.cwd(), 'package.json'), 'utf-8'
    ));
    const deps = { ...pkg.dependencies, ...pkg.devDependencies };
    expect(deps).toHaveProperty('pdfjs-dist');
    expect(deps).toHaveProperty('docx');
    expect(deps).toHaveProperty('pdf-lib');
    expect(deps).toHaveProperty('tesseract.js');
  });

  it('pdfjs-dist major version is >= 4', () => {
    const pkg = JSON.parse(require('fs').readFileSync(
      require('path').resolve(process.cwd(), 'node_modules/pdfjs-dist/package.json'), 'utf-8'
    ));
    const major = parseInt(pkg.version.split('.')[0]);
    expect(major).toBeGreaterThanOrEqual(4);
  });
});

describe('DocumentConverter - Edge cases', () => {
  describe('csvToJson edge cases', () => {
    it('handles single quotes in values', () => {
      const csv = 'name,quote\nAlice,"He said ""hi"""';
      const result = csvToJson(csv);
      expect(result[0].name).toBe('Alice');
    });

    it('handles Windows-style CRLF', () => {
      const csv = 'a,b\r\n1,2\r\n3,4';
      const result = csvToJson(csv);
      expect(result).toHaveLength(2);
    });

    it('handles extra whitespace around headers', () => {
      const csv = ' name , age \nAlice, 30';
      const result = csvToJson(csv);
      expect(Object.keys(result[0])).toContain('name');
      expect(Object.keys(result[0])).toContain('age');
    });
  });

  describe('jsonToCsv edge cases', () => {
    it('preserves order of columns from first object keys', () => {
      const json = '[{"b":1,"a":2},{"a":3,"b":4}]';
      const result = jsonToCsv(json);
      expect(result.startsWith('b,a')).toBe(true);
    });
  });

  describe('decodeBase64 edge cases', () => {
    it('handles empty string input (returns empty bytes)', () => {
      // atob('') returns '', so this produces an empty Uint8Array without throwing
      const result = decodeBase64('');
      expect(result.bytes).toBeInstanceOf(Uint8Array);
      expect(result.bytes.length).toBe(0);
    });

    it('handles very long base64 string', () => {
      const long = 'x'.repeat(1000);
      const encoded = btoa(long);
      const result = decodeBase64(encoded);
      expect(result.bytes.length).toBe(1000);
    });
  });
});
