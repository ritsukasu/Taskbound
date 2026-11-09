<h1 align="center">Taskbound</h1>

<p align="center">
  <strong>Plan it, schedule it, focus on it.</strong><br>
  A cross-platform task manager with a calendar, dashboard and built-in focus timer.
</p>

<p align="center">
  <img alt="React Native 0.81" src="https://img.shields.io/badge/React%20Native-0.81-61dafb?logo=react&amp;logoColor=white">
  <img alt="Expo 54" src="https://img.shields.io/badge/Expo-54-000020?logo=expo&amp;logoColor=white">
  <img alt="Firebase" src="https://img.shields.io/badge/Firebase-Auth%20%2B%20Firestore-ffca28?logo=firebase&amp;logoColor=black">
  <img alt="Platforms" src="https://img.shields.io/badge/platforms-iOS%20%7C%20Android%20%7C%20Web-informational">
  <img alt="0BSD licence" src="https://img.shields.io/badge/license-0BSD-blue">
</p>

<p align="center">
  <a href="#video-preview">Preview</a> · <a href="#screenshots">Screenshots</a> · <a href="#quick-start">Quick start</a> · <a href="#features">Features</a> · <a href="#project-structure">Structure</a> · <a href="#configuration">Configuration</a> · <a href="#troubleshooting">Troubleshooting</a>
</p>

<p align="center">
  <img src="preview/screenshots/hero.png" alt="Taskbound screens: welcome, dashboard, tasks, calendar and focus timer" width="100%">
</p>

Taskbound helps you organize tasks, track deadlines and protect your attention. Create tasks with deadlines and repeat rules, see them on a calendar, check your progress on the dashboard, and start a Pomodoro-style timer when it is time to work. It runs on iOS, Android and the web from one React Native codebase, with accounts and data stored in Firebase.

## Video preview

<p align="center">
  <a href="preview/taskbound-promo.mp4">
    <img src="preview/taskbound-promo.gif" alt="Taskbound promo video (click for the full MP4 with sound)" width="640">
  </a>
  <br>
  <sub><a href="preview/taskbound-promo.mp4">Watch the 35-second promo (MP4, with music)</a> ·
  <a href="preview/taskbound-preview.mp4">App walkthrough (MP4)</a></sub>
</p>

## Screenshots

<table align="center">
  <tr>
    <td align="center"><img src="preview/screenshots/welcome.png" width="200" alt="Welcome screen"><br><sub><b>Welcome</b></sub></td>
    <td align="center"><img src="preview/screenshots/dashboard.png" width="200" alt="Dashboard"><br><sub><b>Dashboard</b></sub></td>
    <td align="center"><img src="preview/screenshots/tasks.png" width="200" alt="Task list"><br><sub><b>Tasks</b></sub></td>
    <td align="center"><img src="preview/screenshots/task-form.png" width="200" alt="Create a task"><br><sub><b>New task</b></sub></td>
  </tr>
  <tr>
    <td align="center"><img src="preview/screenshots/calendar.png" width="200" alt="Calendar"><br><sub><b>Calendar</b></sub></td>
    <td align="center"><img src="preview/screenshots/focus-timer.png" width="200" alt="Focus timer"><br><sub><b>Focus timer</b></sub></td>
    <td align="center"><img src="preview/screenshots/profile.png" width="200" alt="Profile"><br><sub><b>Profile</b></sub></td>
    <td align="center"><img src="preview/screenshots/login.png" width="200" alt="Sign in"><br><sub><b>Sign in</b></sub></td>
  </tr>
</table>

### Themes

Choose green, blue, pink or dark from **Profile → Appearance**.

<p align="center">
  <img src="preview/screenshots/themes.png" alt="Green, blue, pink and dark themes" width="85%">
</p>

<p align="center">
  <img src="preview/screenshots/dark-mode.png" alt="Dark mode: dashboard, tasks and calendar" width="65%">
</p>

## Quick start

You need Node.js 14 or later and npm or yarn.

```bash
git clone https://github.com/yourusername/taskbound.git
cd taskbound
npm install
```

Create `firebaseConfig.js` in the project root with your Firebase project credentials (see [Firebase setup](#firebase-setup)), then start the app:

```bash
npm start          # Expo dev server
npm run ios        # iOS simulator
npm run android    # Android emulator or device
npm run web        # Browser
```

## Features

- **Tasks:** create, edit and delete tasks with a title, description and deadline.
- **Recurring tasks:** repeat a task daily, weekly or monthly.
- **Calendar:** browse tasks by date and tap a day to see what is due.
- **Dashboard:** an at-a-glance overview of your tasks and upcoming deadlines.
- **Focus timer:** a built-in Pomodoro-style timer, 25 minutes by default and adjustable.
- **Accounts:** secure registration and login with Firebase Authentication.
- **Profiles:** personal settings and a profile screen.
- **Themes:** dark and light modes.
- **Cross-platform:** iOS, Android and web from a single codebase.

## Usage

| To do this | Go to | Then |
| --- | --- | --- |
| Create a task | **Tasks** | Tap **+**, enter the title, description, deadline and repeat setting, then save. |
| Start a focus session | **Tasks** → open a task | In **Focus Mode Timer**, set a duration (Pomodoro is 25 minutes) and tap **Start**. |
| See what is due | **Calendar** | Pick a date to list that day's tasks. |
| Change your details or theme | **Profile** | Update your information, then open **Appearance** to choose a theme. |

## Firebase setup

Taskbound uses Firebase Authentication and Firestore. In the [Firebase console](https://console.firebase.google.com), create a project, enable the sign-in methods you want, create a Firestore database, then add your web app credentials to `firebaseConfig.js`:

```javascript
export const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

Firestore uses two collections:

| Collection | Contents |
| --- | --- |
| `users` | User profiles and settings |
| `tasks` | User tasks with their details and metadata |

## Project structure

```
taskbound/
├── App.js                # Root component and navigation stack
├── index.js              # Entry point
├── firebaseConfig.js     # Firebase credentials (you create this)
├── ThemeContext.js       # Theme state and colours
├── MainTabs.js           # Bottom tab navigation
├── Login.js              # Sign in
├── Register.js           # Sign up
├── Onboarding.js         # First-run flow
├── Tasks.js              # Task list
├── Dashboard.js          # Overview
├── Calendar.js           # Calendar view
├── FocusTimer.js         # Focus timer (shown in task details)
├── TaskForm.js           # Create and edit tasks
├── TaskDetail.js         # Task details
├── Profile.js            # User profile
├── components/           # Reusable components
├── assets/               # Icons and alarm sound
└── preview/              # Screenshots and demo video
```

## Tech stack

| Layer | Choice |
| --- | --- |
| App framework | [React Native](https://reactnative.dev) 0.81 with [Expo](https://docs.expo.dev) ~54 |
| Backend | [Firebase](https://firebase.google.com/docs) (Authentication, Firestore) |
| Navigation | React Navigation |
| UI | React Native Paper (Material Design) |
| Date and time input | React Native Date Picker |

See `package.json` for the full dependency list.

## Configuration

**Themes.** Edit `ThemeContext.js` to change the colours and styles used in light and dark mode.

## Troubleshooting

**The app won't start**

- Clear the cache: `expo start --clear`
- Reinstall dependencies: `rm -rf node_modules && npm install`
- Check your Node version: `node --version`

**Firebase won't connect**

- Check the values in `firebaseConfig.js`.
- Confirm the Firebase project is active in the console.
- Make sure the authentication methods you use are enabled.

**iOS build fails**

- Run `pod install` in the `ios` directory.
- Update Xcode to the latest version.

## Contributing

Contributions are welcome.

1. Fork the repository.
2. Create a branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m "Add your feature"`
4. Push the branch: `git push origin feature/your-feature`
5. Open a pull request.

## Support

Email [ryanvalencia709@gmail.com](mailto:ryanvalencia709@gmail.com) or open an issue on GitHub.

## License

[0BSD](LICENSE).
