const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');
const ts = require('typescript');

// Exercise the actual shared auth hook without a device or real Google credentials.
const source = ts.transpileModule(
  fs.readFileSync(path.join(__dirname, '../lib/api.ts'), 'utf8'),
  { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }
).outputText;

function loadAuth(options = {}) {
  const errors = [];
  const tokens = [];
  const states = [];
  const effects = [];
  const configs = [];
  const native = {
    statusCodes: {
      SIGN_IN_CANCELLED: '12501',
      IN_PROGRESS: 'ASYNC_OP_IN_PROGRESS',
      PLAY_SERVICES_NOT_AVAILABLE: 'PLAY_SERVICES_NOT_AVAILABLE',
    },
    GoogleSignin: {
      configure: config => configs.push(config),
      hasPlayServices: async () => true,
      signIn: options.signIn || (async () => ({ type: 'success', data: { idToken: 'verified-by-backend' } })),
    },
  };
  const modules = {
    react: {
      useState: initial => [typeof initial === 'function' ? initial() : initial, value => states.push(value)],
      useRef: initial => ({ current: initial }),
      useCallback: callback => callback,
      useMemo: callback => callback(),
      useEffect: callback => effects.push(callback),
    },
    'react-native': { Platform: { OS: options.platform || 'android' } },
    'expo-constants': { default: { executionEnvironment: options.expoGo ? 'storeClient' : 'standalone' } },
    'expo-secure-store': {},
    'expo-web-browser': { maybeCompleteAuthSession() {} },
    'expo-auth-session': { ResponseType: { IdToken: 'id_token' } },
    'expo-auth-session/providers/google': {
      useAuthRequest: () => [{}, options.response, async () => {}],
    },
    '@react-native-google-signin/google-signin': native,
  };
  const exports = {};
  const sandbox = {
    exports,
    process: { env: { EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID: '930993891303-test.apps.googleusercontent.com' } },
    console: { error() {}, warn() {} },
    window: { location: { hostname: 'boolok.ai', origin: 'https://boolok.ai' } },
    require: name => {
      if (name === '@react-native-google-signin/google-signin' && options.missingModule) {
        throw new Error('RNGoogleSignin native module missing; rebuild the APK');
      }
      assert(name in modules, `Unexpected dependency: ${name}`);
      return modules[name];
    },
  };
  vm.runInNewContext(source, sandbox, { filename: 'lib/api.ts' });
  const hook = exports.useGoogleAuth({
    onError: message => errors.push(message),
    onSuccess: options.onSuccess || (async token => tokens.push(token)),
  });
  effects.forEach(effect => effect());
  return { hook, errors, tokens, states, configs };
}

test('native success passes the Google ID token to backend exchange', async () => {
  const auth = loadAuth();
  await auth.hook.promptGoogleSignIn();
  assert.deepEqual(auth.tokens, ['verified-by-backend']);
  assert.deepEqual(auth.errors, []);
  assert.equal(auth.configs[0].offlineAccess, false);
  assert.deepEqual(auth.states, [true, false]);
});

test('v16 cancellation is silent and clears loading', async () => {
  const auth = loadAuth({ signIn: async () => ({ type: 'cancelled', data: null }) });
  await auth.hook.promptGoogleSignIn();
  assert.deepEqual(auth.tokens, []);
  assert.deepEqual(auth.errors, []);
  assert.deepEqual(auth.states, [true, false]);
});

test('Android code 10 explains package, signing certificate, and OAuth project', async () => {
  const auth = loadAuth({ signIn: async () => { throw { code: '10', message: 'DEVELOPER_ERROR' }; } });
  await auth.hook.promptGoogleSignIn();
  assert.match(auth.errors[0], /SHA-1/);
  assert.match(auth.errors[0], /com\.boolokgpt/);
  assert.match(auth.errors[0], /same Google Cloud project/);
  assert.deepEqual(auth.states, [true, false]);
});

test('uncoded errors are not mistaken for DEVELOPER_ERROR', async () => {
  const auth = loadAuth({ onSuccess: async () => { throw new Error('Backend unavailable'); } });
  await auth.hook.promptGoogleSignIn();
  assert.deepEqual(auth.errors, ['Backend unavailable']);
});

test('legacy cancellation and in-progress responses are silent', async () => {
  for (const code of ['12501', 'ASYNC_OP_IN_PROGRESS']) {
    const auth = loadAuth({ signIn: async () => { throw { code }; } });
    await auth.hook.promptGoogleSignIn();
    assert.deepEqual(auth.errors, []);
    assert.deepEqual(auth.states, [true, false]);
  }
});

test('missing Play Services produces a useful error', async () => {
  const auth = loadAuth({ signIn: async () => { throw { code: 'PLAY_SERVICES_NOT_AVAILABLE' }; } });
  await auth.hook.promptGoogleSignIn();
  assert.match(auth.errors[0], /Play services/);
});

test('missing ID token never starts backend exchange', async () => {
  const auth = loadAuth({ signIn: async () => ({ type: 'success', data: {} }) });
  await auth.hook.promptGoogleSignIn();
  assert.deepEqual(auth.tokens, []);
  assert.match(auth.errors[0], /ID token/);
});

test('missing native module and Expo Go are handled without crashing', async () => {
  for (const options of [{ missingModule: true }, { expoGo: true }]) {
    const auth = loadAuth(options);
    await auth.hook.promptGoogleSignIn();
    assert.equal(auth.errors.length, 1);
    assert.deepEqual(auth.tokens, []);
  }
});

test('repeated taps do not start overlapping Google sign-in requests', async () => {
  let release;
  let calls = 0;
  const pending = new Promise(resolve => { release = resolve; });
  const auth = loadAuth({ signIn: async () => { calls++; return pending; } });
  const first = auth.hook.promptGoogleSignIn();
  const second = auth.hook.promptGoogleSignIn();
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(calls, 1);
  release({ type: 'success', data: { idToken: 'one-token' } });
  await Promise.all([first, second]);
  assert.deepEqual(auth.tokens, ['one-token']);
});

test('browser OAuth does not send access tokens to an ID-token verifier', async () => {
  const auth = loadAuth({ platform: 'web', response: { type: 'success', params: { access_token: 'not-an-id-token' } } });
  await new Promise(resolve => setImmediate(resolve));
  assert.deepEqual(auth.tokens, []);
  assert.match(auth.errors[0], /ID token/);
});

test('browser OAuth exchanges a returned ID token', async () => {
  const auth = loadAuth({ platform: 'web', response: { type: 'success', params: { id_token: 'browser-id-token' } } });
  await new Promise(resolve => setImmediate(resolve));
  assert.deepEqual(auth.tokens, ['browser-id-token']);
  assert.deepEqual(auth.errors, []);
});

test('all Android build profiles use the same Web OAuth client and release API', () => {
  const eas = JSON.parse(fs.readFileSync(path.join(__dirname, '../eas.json'), 'utf8'));
  const app = JSON.parse(fs.readFileSync(path.join(__dirname, '../app.json'), 'utf8'));
  const firebase = JSON.parse(fs.readFileSync(path.join(__dirname, '../google-services.json'), 'utf8'));
  assert.equal(app.expo.android.package, 'com.boolokgpt');
  assert(firebase.client.some(client => client.client_info.android_client_info.package_name === app.expo.android.package));
  for (const profile of Object.values(eas.build)) {
    assert.equal(profile.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID, eas.build.production.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID);
  }
  assert.equal(eas.build.production.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID, '930993891303-9tadsr1d3kle9b11mfsp28q286mpsde6.apps.googleusercontent.com');
  for (const name of ['preview', 'production']) {
    assert.equal(eas.build[name].env.EXPO_PUBLIC_API_URL_NATIVE, 'https://boolok-backend-r4py.onrender.com');
    assert.equal(eas.build[name].env.EXPO_PUBLIC_API_URL, eas.build[name].env.EXPO_PUBLIC_API_URL_NATIVE);
  }
});
