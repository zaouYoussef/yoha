const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '..', 'node_modules', 'expo-router', 'build', 'fork', 'useLinking.native.js');
if (!fs.existsSync(file)) {
  console.warn('⚠ useLinking.native.js not found, skipping patch');
  process.exit(0);
}

let src = fs.readFileSync(file, 'utf8');

// Add mountedRef if not already patched
if (!src.includes('mountedRef')) {
  src = src.replace(
    ', getStateFromPath = native_1.getStateFromPath, getActionFromState = native_1.getActionFromState, }, onUnhandledLinking) {',
    `, getStateFromPath = native_1.getStateFromPath, getActionFromState = native_1.getActionFromState, }, onUnhandledLinking) {
    const mountedRef = (0, react_1.useRef)(false);
    (0, react_1.useEffect)(() => {
        mountedRef.current = true;
        return () => { mountedRef.current = false; };
    }, []);`
  );

  src = src.replace(
    `return url.then((url) => {
                        const state = getStateFromURL(url);`,
    `return url.then((url) => {
                        if (!mountedRef.current) return undefined;
                        const state = getStateFromURL(url);`
  );

  fs.writeFileSync(file, src, 'utf8');
  console.log('✓ patched expo-router useLinking.native.js');
} else {
  console.log('→ expo-router useLinking.native.js already patched');
}
