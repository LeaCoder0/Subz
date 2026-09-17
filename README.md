# Subz

Subscription and contract management app for Android based on Ionic and Angular. Written in TypeScript.

<a href="https://hosted.weblate.org/engage/subz/">
  <img src="https://hosted.weblate.org/widgets/subz/-/subz/svg-badge.svg" alt="Übersetzungsstatus" />
</a>

<p align="center">
  <a href="https://epinez.codeberg.page/projects/subz/index.html"><img src="https://codeberg.org/epinez/pages/raw/branch/main/try_on_codeberg_pages.png" alt="Try it on Codeberg Pages" height="75"></a>
  <a href="https://f-droid.org/packages/com.flasskamp.subz"><img src="https://fdroid.gitlab.io/artwork/badge/get-it-on.png" alt="Get it on F-Droid" height="75"></a>
</p>

<p align="center">
  <img src="./fastlane/metadata/android/en-US/images/phoneScreenshots/1.png" width="24%"/>
  <img src="./fastlane/metadata/android/en-US/images/phoneScreenshots/2.png" width="24%"/>
  <img src="./fastlane/metadata/android/en-US/images/phoneScreenshots/3.png" width="24%"/>
  <img src="./fastlane/metadata/android/en-US/images/phoneScreenshots/4.png" width="24%"/>
</p>

## Features

### Functional

- Add subscriptions and details like costs, billing interval, contract durations and cancelation period
- Show all subscriptions and their costs
- Show days until next billing
- Switch subscription cost overview to daily, weekly, monthly and yearly
- Modify and delete subscriptions
- Search for specific subscriptions
- Sort subscriptions by name, costs, etc.
- Optional reminder for reaching cancelation period of subscriptions

### Settings

- UI: Force Dark-mode
- Region: Currency, date format
- Data management: Local backup and restore

## Building

This is a fork of [epinez/Subz](https://codeberg.org/epinez/Subz), modernised to
Angular 22 / Ionic 9 / Capacitor 8. It builds under the application id
`com.flasskamp.subz.dev` so it installs alongside the upstream F-Droid release
rather than replacing it.

### Prerequisites

- **Node 22.22.3+** (a `.nvmrc` pins 26 — `nvm use`). Angular 22 refuses older
  versions, and the Capacitor 8 CLI requires Node 22+.
- **JDK 21.** Not 17: Capacitor 7+ hardcodes `JavaVersion.VERSION_21` in every
  plugin module, and Gradle toolchains are strict, so a newer JDK will not
  substitute either.
- Android SDK with platform 36 (`compileSdk`/`targetSdk` are both 36).
- Git.

The Ionic CLI is no longer needed — the Angular CLI is a dev dependency.

### Build the app

```sh
git clone https://github.com/LeaCoder0/Subz.git
cd Subz
npm ci
npm run build
npx cap sync
(cd android && JAVA_HOME=/path/to/jdk-21 ./gradlew assembleDebug)
```

The APK lands in `android/app/build/outputs/apk/debug/`. `npx cap open android`
still works if you have Android Studio installed.

Unlike upstream, `npm run build` needs no `NODE_OPTIONS=--openssl-legacy-provider`
workaround — the webpack 4 build that required it is gone.

### Tests

```sh
npm test         # Vitest unit tests, covering the billing/cancellation date maths
npm run lint     # eslint
npm run e2e      # Playwright against the web build
```

### Backup format

Backups are plain, unencrypted UTF-8 JSON (`{"subscriptions": [...], "settings": {...}}`),
schema-compatible with upstream, so backups move in either direction between
this fork and the F-Droid build.

Export goes through the system share sheet and import through the system file
picker. This is not cosmetic: from `targetSdk` 30 onward an app cannot read
shared storage directly, so the previous "write to `Documents/subz-backup.json`"
approach fails with `EACCES` no matter which permissions are declared.

## Contributing

Feel free to help me improving Subz in any possible way! These are some examples of how you could help:

- **File an issue**: Did you notice a bug while using Subz or do you have some ideas of how we could enhance it? [File an issue](https://codeberg.org/epinez/Subz/issues) and I will notice it!
- **Tell others about Subz**: I wanted to create something which not only helps me but also others. Everybody knows the struggle of forgetting to cancel a contract in time. I want that to be a problem of the past, so please help me to help others and tell them about Subz!
- **Translate**: Subz is not (fully) localized in your language? You are welcome to help. Localization is handled on [Weblate](https://hosted.weblate.org/projects/subz/subz).
- **Start coding**: Are you familiar with Typescript, HTML, SCSS, Angular and or Ionic? Nice! Please file issues first and reference to them in the commit like `Fixes bad behaviour xy, closes #1`. If you want to contribute new features please wait for my response because I want to keep the app as clean and straightforward as possible. :-)

## Donate

If you want to support the development by a donation, you are very welcome to do so. That would allow me to invest more time into the development as I'm a student and working on Subz in my free time.

<a href="https://liberapay.com/epinez/donate">
  <img alt="Donate using Liberapay" src="https://liberapay.com/assets/widgets/donate.svg">
</a>

You can also contact me via [E-Mail](mailto:subz@flasskamp.com).

## Thanks to

- [mondstern](https://codeberg.org/mondstern) for his beautiful acrylic painting of the Subz logo
- All translators which helped localizing Subz via Weblate. I don't mention each one specifically because that's so much work :-)
- All donators!