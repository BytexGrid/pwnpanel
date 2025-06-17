import { spawn } from 'child_process';

export const runCommand = (
  command: string,
  args: string[],
  options: {
    cwd?: string;
    onOutput?: (data: string) => void;
  } = {}
) => {
  return new Promise<void>((resolve, reject) => {
    const child = spawn(command, args, {
      shell: true,
      stdio: 'pipe',
      cwd: options.cwd,
    });

    let stderr = '';

    child.stdout.on('data', (data) => {
      if (options.onOutput) {
        options.onOutput(data.toString());
      }
    });

    child.stderr.on('data', (data) => {
      const errorString = data.toString();
      stderr += errorString;
      if (options.onOutput) {
        options.onOutput(errorString);
      }
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Command failed with code ${code}. Stderr: ${stderr.trim()}`));
      }
    });

    child.on('error', (err) => {
      reject(err);
    });
  });
}; 