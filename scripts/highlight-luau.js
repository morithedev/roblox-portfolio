const keywords = new Set([
  'and', 'break', 'continue', 'do', 'else', 'elseif', 'end', 'export', 'false', 'for', 'function',
  'if', 'in', 'local', 'nil', 'not', 'or', 'repeat', 'return', 'then', 'true', 'type', 'until', 'while',
]);

const builtins = new Set([
  'Enum', 'Instance', 'Vector2', 'Vector3', 'CFrame', 'Color3', 'UDim2', 'TweenInfo', 'RaycastParams',
  'game', 'math', 'os', 'pairs', 'pcall', 'print', 'require', 'select', 'setmetatable', 'string', 'table',
  'task', 'tonumber', 'tostring', 'type', 'typeof', 'unpack', 'workspace', 'xpcall',
]);

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, (character) => {
    if (character === '&') return '&amp;';
    if (character === '<') return '&lt;';
    if (character === '>') return '&gt;';
    if (character === '"') return '&quot;';
    return '&#39;';
  });
}

function readLongString(source, start) {
  const opening = /^\[(=*)\[/.exec(source.slice(start));
  if (!opening) return -1;
  const closing = `]${opening[1]}]`;
  const end = source.indexOf(closing, start + opening[0].length);
  return end < 0 ? source.length : end + closing.length;
}

export function highlightLuau(source) {
  if (typeof source !== 'string' || source.length === 0) return '';

  let output = '';
  let index = 0;

  while (index < source.length) {
    const character = source[index];

    if (character === '"' || character === "'") {
      const quote = character;
      const start = index++;
      while (index < source.length) {
        if (source[index] === '\\') index += 2;
        else if (source[index++] === quote) break;
      }
      output += `<span class="token-string">${escapeHtml(source.slice(start, index))}</span>`;
      continue;
    }

    if (character === '[') {
      const end = readLongString(source, index);
      if (end >= 0) {
        output += `<span class="token-string">${escapeHtml(source.slice(index, end))}</span>`;
        index = end;
        continue;
      }
    }

    if (/[A-Za-z_]/.test(character)) {
      const start = index++;
      while (/[A-Za-z0-9_]/.test(source[index] ?? '')) index += 1;
      const word = source.slice(start, index);
      if (keywords.has(word)) output += `<span class="token-keyword">${word}</span>`;
      else if (builtins.has(word)) output += `<span class="token-builtin">${word}</span>`;
      else output += word;
      continue;
    }

    if (/\d/.test(character)) {
      const number = /^(?:0[xX][\da-fA-F]+|\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)/.exec(source.slice(index))?.[0];
      if (number) {
        output += `<span class="token-number">${number}</span>`;
        index += number.length;
        continue;
      }
    }

    output += escapeHtml(character);
    index += 1;
  }

  return output;
}
