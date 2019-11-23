#!/usr/bin/env node

import { Walk } from 'suf-node';
import { failure, success, logger } from './messages';
import { readFileSync, writeFile, existsSync } from 'fs';
import { basename } from 'path';

const codeBlock = '```';
class Start {
  args: string[];
  dir = 'dist';
  out = 'README.md';
  name = 'Docs';
  include = [];
  exclude: string[] = [];
  constructor() {
    const [, , ...argumentArr] = process.argv;
    this.args = [];
    argumentArr.forEach((arg, i) => {
      if (arg.toLowerCase() === '--dir') {
        argumentArr[i + 1] ? (this.dir = argumentArr[i + 1]) : failure(`--dir ${argumentArr[i + 1]} not Found.`);
      }
      if (arg.toLowerCase() === '--out') {
        argumentArr[i + 1] ? (this.out = argumentArr[i + 1]) : failure(`--out ${argumentArr[i + 1]} not Found.`);
      }
      if (arg.toLowerCase() === '--name') {
        argumentArr[i + 1] ? (this.name = argumentArr[i + 1]) : failure(`--name ${argumentArr[i + 1]} not Found.`);
      }
      if (arg.toLowerCase() === '--exclude') {
        this.getInOrExclude(i, 'exclude', argumentArr);
      }
      if (arg.toLowerCase() === '--include') {
        this.getInOrExclude(i, 'include', argumentArr);
      }
      this.args[i] = arg === undefined ? '' : arg.toLowerCase();
    });
    if (/^--?(h|help)$/i.test(this.args[0])) {
      logger.Log('help');
    } else {
      this.run();
    }
  }
  private async run() {
    const filesPaths = await this.getPaths();
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
        let res = `\n### ${fileName}

`;
        while ((m = declarationRegex.exec(fileText)) !== null) {
          if (m.index === declarationRegex.lastIndex) {
            declarationRegex.lastIndex++;
          }
          let [all, comment, declaration, type, name, content] = m;
          if (!/^[\n \t]*internal[\n \t]*/i.test(getComment(comment))) {
            links.push(declaration === 'interface' ? type : name);
            res += `\n##### ${declaration === 'interface' ? type : name}\n
${codeBlock}typescript
${all.replace(/export ?| ?declare ?/g, '')}
${codeBlock}
`;
          }
        }

        rawText += res;
      }
    }

    const generated = `<span id="DOC_GENERATION_MARKER_0"></span>\n# ${this.name}\n${this.createNav(
      links
    )}${rawText}\n*Generated With* **[ts-doc-gen](https://www.npmjs.com/package/ts-doc-gen)**\n<span id="DOC_GENERATION_MARKER_1"></span>`;
    writeFile(this.out, input.replace(/DOC_INSERTION_MARKER/, generated), err => {
      if (err) throw err;
      success(`Successfully Generated Docs at ${this.out}`);
    });
  }
  private createNav(links: string[]) {
    let linkRes = '';
    for (const link of links) {
      if (link.startsWith('#')) {
        linkRes += `\n- **[${link.replace(/#/, '')}](${link.toLowerCase()})**\n\n`;
      } else {
        linkRes += `  - [${link}](#${link.toLowerCase()})\n`;
      }
    }
    return linkRes;
  }
  private getInOrExclude(i: number, type: 'include' | 'exclude', args: string[]) {
    if (type === 'exclude' ? this.include.length === 0 : this.exclude.length === 0) {
      args[i + 1]
        ? (this[type] = args[i + 1]
            .replace(/['"](.*?)['"]/, '$1')
            .split(',')
            .map(v => (v.endsWith('.d.ts') ? v : v.concat('.d.ts'))))
        : failure(`--${type} ${args[i + 1]} not Found.`);
    } else {
      failure(
        `--${type} cannot be used with ${type === 'exclude' ? '--include' : '--exclude'}, --${type} will be ignored.`
      );
    }
  }
  private async getPaths() {
    const dir = await Walk(`./${this.dir}`);
    const isInclude = this.include.length === 0;
    const type = isInclude ? 'exclude' : 'include';
    const filesPaths = dir.filter(
      fileName =>
        fileName.endsWith('d.ts') &&
        this.operators[isInclude ? '===' : '!=='](this[type].indexOf(basename(fileName)), -1)
    );
    return filesPaths;
  }
  private operators = {
    '!==': function(a, b) {
      return a !== b;
    },
    '===': function(a, b) {
      return a === b;
    }
  };
}
new Start();
function getComment(comment: string) {
  return comment ? comment.replace(/\/?\*\*?\/?/g, '') : '';
}
