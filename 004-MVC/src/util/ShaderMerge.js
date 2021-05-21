let fs = require('fs');

let includeDir = 'src/shader/include/';
let includes = {};

const OUTPUT_FOLDER = 'shader';
if (!fs.existsSync(OUTPUT_FOLDER)) {
  fs.mkdirSync(OUTPUT_FOLDER);
}

fs.readdirSync(includeDir).forEach((fileName) => {
  if (fileName.endsWith('.glsl')) {
    let name = fileName.substr(0, fileName.length - 5);
    let code = fs.readFileSync(includeDir + fileName, { encoding: 'utf8' });
    includes[name] = code;
  }
});

function replaceInclude(code) {
  let codeLines = code.split('\n');
  codeLines.forEach((codeLine, index) => {
    let match = codeLine.match(/^([\s]*)#include[\s]*<([\S]*)>/);
    if (match) {
      let space = match[1];
      let includeFileName = match[2];
      let includeCode = includes[includeFileName];
      if (includeCode) {
        codeLines[index] = includeCode
          .split('\n')
          .map((line) => space + line)
          .join('\n');
      }
    }
  });
  return codeLines.join('\n');
}

const SHADER_PREFIX =
  '#version 300 es\\nprecision highp float;\\nlayout(std140, column_major) uniform;\\n\\n';

let shaders = [`export const SHADER_PREFIX = '${SHADER_PREFIX}';`];

[
  'default',
  'pbr',
  'shadow_map',
  'output',
  'terrain',
  'picking',
  'billboard',
  'outline',
  'glow',
  'glow_color',
  'glow_blur',
  'particle',
  'particle_feedback',
].forEach((name) => {
  let vertexShader = fs.readFileSync(`src/shader/${name}.vs`, {
    encoding: 'utf8',
  });
  let fragmentShader = fs.readFileSync(`src/shader/${name}.fs`, {
    encoding: 'utf8',
  });
  vertexShader = replaceInclude(vertexShader);
  fragmentShader = replaceInclude(fragmentShader);
  fs.writeFileSync(`${OUTPUT_FOLDER}/${name}.vs`, vertexShader);
  fs.writeFileSync(`${OUTPUT_FOLDER}/${name}.fs`, fragmentShader);
  // windows

  vertexShader = vertexShader.split('\r').join('\\n');
  vertexShader = vertexShader.split('\n').join('\\n');
  shaders.push(
    `export const ${name.toUpperCase()}_VERTEX_SHADER = '${vertexShader}';`
  );

  fragmentShader = fragmentShader.split('\r').join('\\n');
  fragmentShader = fragmentShader.split('\n').join('\\n');
  shaders.push(
    `export const ${name.toUpperCase()}_FRAGMENT_SHADER = '${fragmentShader}';\n`
  );
  // mac
  // shaders.push(`export const ${name.toUpperCase()}_VERTEX_SHADER = '${vertexShader.split('\n').join('\\n')}';`);
  // shaders.push(`export const ${name.toUpperCase()}_FRAGMENT_SHADER = '${fragmentShader.split('\n').join('\\n')}';\n`);
});
// windows
fs.writeFileSync('src/core/Shader.ts', shaders.join('\n'));

// mac
// fs.writeFileSync('src/core/Shader.js', shaders.join('\n'));
