import chalk from 'chalk';
import { Logger, LoggerType, PresetNodeHelp } from '@sorg/log';
export const successFile = (filePath: string) => {
  console.log(chalk.green.bold(`Done! File created at ${filePath}`));
};
export const success = (message: any) => {
  console.log(chalk.green.bold(message));
};
export const failure = (message: string) => {
  console.log(chalk.red.bold(message));
};
export const info = (message: string) => {
  console.log(chalk.yellow.bold(message));
};
export const logger = new Logger<{ help: LoggerType }>({
  help: {
    styles: [
      { color: '#72a', background: '#111' },
      { color: '#f23', background: '#222' },
      { color: '#2af', background: '#222' }
    ],
    preset: new PresetNodeHelp(
      `--out: OUTPUT_FILE:Relative path to the output file with extension.
--dir: DIR:        Relative path to the input dir.
--name: NAME:       Header name.
--exclude: FILES:      Comma separated list of files to exclude.
-h: :           Displays this Message.`,
      ':',
      11,
      70
    )
  }
});
