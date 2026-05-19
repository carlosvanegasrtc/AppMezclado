/**
 * Config plugin que persiste cambios nativos que expo prebuild --clean borraría:
 *  1. android:usesCleartextTraffic="true"  (HTTP sin SSL hacia la API local)
 *  2. Permisos Bluetooth (TSPL printer via SPP)
 *  3. Registro de TsplPrinterPackage en MainApplication.kt
 *  4. Copia TsplPrinterModule.kt y TsplPrinterPackage.kt desde plugins/native/
 */
const { withAndroidManifest, withDangerousMod } = require('@expo/config-plugins');
const fs   = require('fs');
const path = require('path');

// ── 1 + 2: AndroidManifest ────────────────────────────────────────────
function withAndroidChanges(config) {
  return withAndroidManifest(config, (cfg) => {
    const manifest = cfg.modResults.manifest;

    // usesCleartextTraffic en <application>
    const app = manifest.application[0];
    app.$['android:usesCleartextTraffic'] = 'true';

    // Permisos Bluetooth
    const existing = (manifest['uses-permission'] || []).map(
      (p) => p.$?.['android:name']
    );
    const btPerms = [
      { $: { 'android:name': 'android.permission.BLUETOOTH',       'android:maxSdkVersion': '30' } },
      { $: { 'android:name': 'android.permission.BLUETOOTH_ADMIN',  'android:maxSdkVersion': '30' } },
      { $: { 'android:name': 'android.permission.BLUETOOTH_CONNECT' } },
      { $: { 'android:name': 'android.permission.BLUETOOTH_SCAN',   'android:usesPermissionFlags': 'neverForLocation' } },
    ];
    for (const perm of btPerms) {
      if (!existing.includes(perm.$['android:name'])) {
        manifest['uses-permission'] = [...(manifest['uses-permission'] || []), perm];
      }
    }

    return cfg;
  });
}

// ── 3: MainApplication.kt ─────────────────────────────────────────────
function withTsplPackage(config) {
  return withDangerousMod(config, [
    'android',
    (cfg) => {
      const file = path.join(
        cfg.modRequest.platformProjectRoot,
        'app/src/main/java/gt/com/rototec/mezcla/MainApplication.kt'
      );
      if (!fs.existsSync(file)) return cfg;

      let src = fs.readFileSync(file, 'utf-8');
      if (src.includes('TsplPrinterPackage')) return cfg; // ya registrado

      // Forma nueva: packageList = PackageList(this).packages  (sin .apply)
      if (src.includes('PackageList(this).packages\n') || src.match(/PackageList\(this\)\.packages\s*\n/)) {
        src = src.replace(
          /PackageList\(this\)\.packages(\s*\n)/,
          `PackageList(this).packages.apply {\n        add(TsplPrinterPackage())\n      }$1`
        );
      } else {
        // Forma vieja: PackageList(this).packages.apply { ... }
        src = src.replace(
          /PackageList\(this\)\.packages\.apply \{[\s\S]*?\}/,
          `PackageList(this).packages.apply {\n          add(TsplPrinterPackage())\n        }`
        );
      }
      fs.writeFileSync(file, src, 'utf-8');
      return cfg;
    },
  ]);
}

// ── 4: Copiar archivos Kotlin del módulo nativo ───────────────────────
function withTsplKotlinFiles(config) {
  return withDangerousMod(config, [
    'android',
    (cfg) => {
      const destDir = path.join(
        cfg.modRequest.platformProjectRoot,
        'app/src/main/java/gt/com/rototec/mezcla'
      );
      const srcDir = path.join(__dirname, 'native');
      if (!fs.existsSync(srcDir)) return cfg;

      for (const file of fs.readdirSync(srcDir)) {
        const dest = path.join(destDir, file);
        if (!fs.existsSync(dest)) {
          fs.copyFileSync(path.join(srcDir, file), dest);
        }
      }
      return cfg;
    },
  ]);
}

// ── Exportar como plugin compuesto ────────────────────────────────────
module.exports = function withRototecAndroid(config) {
  config = withAndroidChanges(config);
  config = withTsplKotlinFiles(config);
  config = withTsplPackage(config);
  return config;
};
