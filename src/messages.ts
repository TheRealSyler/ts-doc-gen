import chalk from 'chalk';

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
