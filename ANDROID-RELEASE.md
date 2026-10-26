# Android APK release

The website APK must be built with EAS using the existing remote production
keystore for `com.robertbetancourt.mimik`. Do not replace the key or distribute
`android/app/build/outputs/apk/debug/app-debug.apk`.

```powershell
npm run typecheck
npm run lint
npx eas-cli@latest build --platform android --profile production-apk
./scripts/verify-release.ps1 -Apk /absolute/path/to/mimik.apk
```

The verification script requires Android SDK Build Tools 37.0.0 (override `-Sdk`
and `-BuildTools` if needed). It verifies the signature, expected production
certificate, package/version, absence of `debuggable`, and removal of microphone,
external-storage, activity-recognition, overlay and foreground-service permissions.
It also prints the APK SHA-256.

The `production-apk` profile creates an installable release APK with remote EAS
credentials. The `production` profile retains its Play Store app-bundle behavior.
Native folders are generated and ignored: change Expo configuration, not only
the local generated Gradle files. EAS supplies release signing during its build.

Current version is 1.0.1 / versionCode 2. Increment `android.versionCode` in
`app.json` for every subsequent APK release and update verification expectations
with `-VersionCode` / `-VersionName`. This profile does not auto-increment.

Before publishing, install and launch the APK on a test device/emulator, check
startup logs, and exercise game controls/audio/tilt on a physical Android device.
Type checking or signature verification alone does not prove gameplay behavior.

The old website APK was signed with Android Debug. Android cannot update that
installation using the production key. Users must uninstall the debug version
first, which can remove saved local data. Subsequent releases must keep the same
production key to preserve update compatibility.

Do not commit keystores, credentials.json, signing passwords or Expo tokens.

## Verified release: 2026-10-26

- EAS build: `4fcbc92c-718a-4ca0-8c4c-532449752242`.
- Version 1.0.1 / code 2, universal APK (ARM and x86, 32/64-bit).
- APK SHA-256: `3f27b56083ddf5253791a073d16136c45af98894ad1b4be467bbbc949bd0151b`.
- Production certificate SHA-256: `09047d9da4fff6afe58c90fb4a39f0183b0432d31d237b04ea9d0216e0dd4b24`.
- Signature v2 verified; application is not debuggable; all seven blocked permissions absent.
- Emulator installation and cold launch passed; process remained alive and crash / ReactNativeJS error logs were empty.
- TypeScript passed. Existing ESLint issues remain: four hook errors in
  `src/components/ui/AnimatedMimikLogo.tsx` and 14 warnings across the app.
- Physical-device audio/tilt/gameplay testing remains pending. This is a startup
  smoke test, not a complete app security or functional audit.

The website repository stores the verified APK and `mimik.apk.sha256` together.
Its `npm run check` compares that hash with the actual APK; Vercel runs the check
before deployment. For the next release, verify the new APK first, then update
both files and this release record. The checksum detects accidental replacement;
it is not a substitute for verifying the production certificate.
