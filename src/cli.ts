#!/usr/bin/env node

import { Walk } from './utils';
import { failure, success } from './messages';
import { readFileSync, writeFile, existsSync } from 'fs';

const codeBlock = '```';
class Start {
  args: string[];
  dir = 'dist';
  out = 'README.md';
  exclude = '';
  constructor() {
    const [, , ...argumentArr] = process.argv;
    this.args = [];
    argumentArr.forEach((arg, i) => {
      if (arg.toLowerCase().startsWith('--dir')) {
        argumentArr[i + 1] ? (this.dir = argumentArr[i + 1]) : failure(`--dir ${argumentArr[i + 1]} not Found.`);
      }
      if (arg.toLowerCase().startsWith('--out')) {
        argumentArr[i + 1] ? (this.out = argumentArr[i + 1]) : failure(`--out ${argumentArr[i + 1]} not Found.`);
      }
      if (arg.toLowerCase().startsWith('--exclude')) {
        argumentArr[i + 1] ? (this.out = argumentArr[i + 1]) : failure(`--exclude ${argumentArr[i + 1]} not Found.`);
      }
      this.args[i] = arg === undefined ? '' : arg.toLowerCase();
    });
    this.run();
  }
  private async run() {
    const dir = await Walk(`./${this.dir}`);
    const excluded = this.exclude.split(',');
    const filesPaths = dir.filter(fileName => fileName.endsWith('d.ts') && excluded.indexOf(fileName) === -1);
    let input = 'DOC_INSERTION_MARKER';
    if (existsSync(this.out)) {
      const inputFile = readFileSync(this.out).toString();
      input = inputFile.replace(
        /<span id="DOC_GENERATION_MARKER_0"><\/span>[\S\s]*<span id="DOC_GENERATION_MARKER_1"><\/span>/,
        'DOC_INSERTION_MARKER'
      );
      if (!/DOC_INSERTION_MARKER/.test(input)) {
        input += '\nDOC_INSERTION_MARKER';
      }
    }

    const declarationRegex = /(\/\*\*[\S\s]*? \*\/\n)?export (declare|interface) ([\w-]*) ([\w-]*)(.*?;|[\S\s]*?^})/gm;
    let rawText = '';
    const links: string[] = [];
    for (const path of filesPaths) {
      const fileText = readFileSync(path).toString();
      const fileName = path.replace(/.*(\/|\\\\)([\w\.-]*)\.d\.ts/, '$2');
      let m: RegExpExecArray;
      if (!fileName.endsWith('.internal')) {
        links.push(`#${fileName}`);
        let res = `\n## ${fileName}

`;
        while ((m = declarationRegex.exec(fileText)) !== null) {
          if (m.index === declarationRegex.lastIndex) {
            declarationRegex.lastIndex++;
          }
          let [all, comment, declaration, type, name, content] = m;
          if (!/^[\n \t]*internal[\n \t]*/i.test(getComment(comment))) {
            links.push(declaration === 'interface' ? type : name);
            res += `\n#### ${declaration === 'interface' ? type : name}\n
${codeBlock}typescript
${all.replace(/export ?| ?declare ?/g, '')}
${codeBlock}
`;
          }
        }

        rawText += res;
      }
    }
    let linkRes = '';
    for (const link of links) {
      if (link.startsWith('#')) {
        linkRes += `\n- **[${link.replace(/#/, '')}](${link.toLowerCase()})**\n\n`;
      } else {
        linkRes += `  - [${link}](#${link.toLowerCase()})\n`;
      }
    }
    const generated = `<span id="DOC_GENERATION_MARKER_0"></span>\n${linkRes}${rawText}\n<span id="DOC_GENERATION_MARKER_1"></span>`;
    writeFile(this.out, input.replace(/DOC_INSERTION_MARKER/, generated), err => {
      if (err) throw err;
      success(`Successfully Generated Docs at ${this.out}`);
    });
  }
}
new Start();
function getComment(comment: string) {
  return comment ? comment.replace(/\/?\*\*?\/?/g, '') : '';
}
