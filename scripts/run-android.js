/*
  Smart Android runner for Windows/Expo
  - Tries to start an available AVD if none running
  - Waits for a device to come online
  - Then launches `npx expo start --android`
*/

const { spawn } = require('child_process');
const path = require('path');
const os = require('os');

const isWindows = process.platform === 'win32';

function getEnv(name, fallback) {
  return process.env[name] || fallback;
}

function resolveTool(tool) {
  // Prefer PATH
  return tool;
}

function resolveAndroidHome() {
  const local = getEnv('LOCALAPPDATA');
  const candidates = [
    getEnv('ANDROID_HOME'),
    local ? path.join(local, 'Android', 'Sdk') : undefined,
    getEnv('ANDROID_SDK_ROOT'),
  ].filter(Boolean);
  return candidates[0];
}

function run(cmd, args, opts = {}) {
  return new Promise((resolve) => {
    const child = spawn(cmd, args, { stdio: 'pipe', shell: true, ...opts });
    let out = '';
    let err = '';
    child.stdout.on('data', (d) => (out += d.toString()));
    child.stderr.on('data', (d) => (err += d.toString()));
    child.on('close', (code) => resolve({ code, out, err }));
  });
}

async function listAvds() {
  const result = await run(resolveTool('emulator'), ['-list-avds']);
  if (result.code !== 0) return [];
  return result.out
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean);
}

async function startEmulator(avd) {
  console.log(`Starting emulator: ${avd}`);
  // Try with fast cold boot
  await run(resolveTool('emulator'), [
    '-avd',
    avd,
    '-no-snapshot-load',
    '-gpu',
    'host',
    '-accel',
    'on',
  ]);
}

function parseAdbDevices(out) {
  return out
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith('List of devices'))
    .map((l) => {
      const [serial, state] = l.split(/\s+/, 2);
      return { serial, state };
    });
}

async function hasOnlineDevice() {
  const res = await run(resolveTool('adb'), ['devices']);
  if (res.code !== 0) return false;
  const devices = parseAdbDevices(res.out);
  return devices.some((d) => d.state === 'device');
}

async function waitForDevice(timeoutMs = 120000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const res = await run(resolveTool('adb'), ['devices']);
    if (res.code === 0) {
      const devices = parseAdbDevices(res.out);
      const hasReady = devices.some((d) => d.state === 'device');
      const hasAny = devices.length > 0;
      if (hasReady) return true;
      if (hasAny) {
        process.stdout.write('.');
      }
    }
    await new Promise((r) => setTimeout(r, 1000));
  }
  return false;
}

async function main() {
  const androidHome = resolveAndroidHome();
  if (androidHome) {
    // Prepend platform-tools & emulator to PATH for this process
    const platformTools = path.join(androidHome, 'platform-tools');
    const emulatorDir = path.join(androidHome, 'emulator');
    process.env.PATH = `${emulatorDir};${platformTools};${process.env.PATH}`;
  }

  let deviceReady = await hasOnlineDevice();
  if (!deviceReady) {
    const avds = await listAvds();
    if (avds.length > 0) {
      // Prefer Pixel_6 if present
      const preferred = avds.find((n) => /Pixel_6/.test(n)) || avds[0];
      // Do not await startEmulator because it blocks; start detached
      spawn(resolveTool('emulator'), [
        '-avd',
        preferred,
        '-no-snapshot-load',
        '-no-boot-anim',
        '-gpu',
        'angle_indirect',
        '-accel',
        'on',
        '-no-audio',
      ], { stdio: 'ignore', shell: true, detached: true }).unref();

      process.stdout.write('Waiting for emulator to come online');
      const ok = await waitForDevice(180000);
      process.stdout.write('\n');
      if (!ok) {
        console.warn('Timed out waiting for device. You can try launching the AVD manually from Android Studio, then re-run npm run android.');
      }
    } else {
      console.warn('No AVD found. Consider creating one in Android Studio.');
    }
  }

  // Launch Expo on Android
  const expoCmd = isWindows ? 'npx.cmd' : 'npx';
  const proc = spawn(expoCmd, ['expo', 'start', '--android'], {
    stdio: 'inherit',
    shell: true,
  });
  proc.on('close', (code) => process.exit(code ?? 0));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});


