# Taskbound - Task Management System

A powerful, feature-rich task management application built with React Native and Expo. Taskbound helps you organize your tasks, track deadlines, manage your time with a focus timer, and stay productive.

## 🎯 Features

- **Task Management**: Create, edit, and delete tasks with detailed descriptions
- **Calendar View**: Visualize your tasks on a calendar for better planning
- **Dashboard**: Quick overview of your tasks and upcoming deadlines
- **Focus Timer**: Built-in Pomodoro-style timer to help you stay focused
- **Recurring Tasks**: Set tasks to repeat daily, weekly, or monthly
- **User Authentication**: Secure login and registration with Firebase
- **User Profiles**: Personalize your experience with profile settings
- **Dark/Light Theme**: Choose your preferred theme for comfortable viewing
- **Cross-Platform**: Works seamlessly on iOS, Android, and Web

## 🛠️ Tech Stack

- **React Native** - Cross-platform mobile development
- **Expo** - React Native framework and platform
- **Firebase** - Backend services (authentication, database)
- **React Navigation** - Navigation and routing
- **React Native Paper** - Material Design components
- **React Native Date Picker** - Date and time selection

## 📋 Prerequisites

Before you begin, ensure you have the following installed:
- Node.js (v14 or higher)
- npm or yarn
- Expo CLI: `npm install -g expo-cli`

## 🚀 Getting Started

### 1. Clone the repository
```bash
git clone https://github.com/yourusername/taskbound.git
cd taskbound
```

### 2. Install dependencies
```bash
npm install
# or
yarn install
```

### 3. Connect Firebase
Create the `firebaseConfig.js` file with your Firebase project credentials:
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

### 4. Start the application

**For iOS:**
```bash
npm run ios
```

**For Android:**
```bash
npm run android
```

**For Web:**
```bash
npm run web
```

**Or start with Expo:**
```bash
npm start
```

## 📁 Project Structure

```
taskbound/
├── App.js                 # Main app component
├── index.js              # Entry point
├── firebaseConfig.js     # Firebase configuration
├── ThemeContext.js       # Theme management
├── MainTabs.js          # Main navigation structure
│
├── Screens/
│   ├── Login.js         # Login screen
│   ├── Register.js      # Registration screen
│   ├── Onboarding.js    # Onboarding flow
│   ├── Tasks.js         # Tasks list view
│   ├── Dashboard.js     # Dashboard overview
│   ├── Calendar.js      # Calendar view
│   ├── FocusTimer.js    # Focus timer
│   ├── TaskForm.js      # Task creation/editing
│   ├── TaskDetail.js    # Task details view
│   └── Profile.js       # User profile
│
├── components/          # Reusable components
└── assets/             # Images and other assets
```

## 🎮 Usage

### Creating a Task
1. Navigate to the Tasks tab
2. Click the "+" button to create a new task
3. Enter task details (title, description, deadline, repeat settings)
4. Save the task

### Using the Focus Timer
1. Go to the Focus Timer tab
2. Set your desired duration (Pomodoro: 25 min)
3. Tap "Start" to begin the timer
4. Stay focused while the timer counts down

### Viewing Calendar
1. Navigate to the Calendar tab
2. Browse your tasks by date
3. Tap on any date to see tasks for that day

### Managing Your Profile
1. Go to Profile tab
2. Update your information
3. Customize your theme preference

## 🔧 Configuration

### Customizing Colors and Themes
Edit `ThemeContext.js` to modify the application theme colors and styles.

### Database Schema
The app uses Firebase Firestore. Main collections:
- `users` - User profiles and settings
- `tasks` - User tasks with details and metadata

## 📦 Dependencies

See `package.json` for a complete list of dependencies. Key packages:
- `react` - 19.1.0
- `react-native` - 0.81.5
- `expo` - ~54.0.36
- `firebase` - 8.0.0
- `react-native-paper` - 4.9.2
- `@react-navigation/*` - Navigation libraries

## 🐛 Troubleshooting

### App won't start
- Clear cache: `expo start --clear`
- Reinstall dependencies: `rm -rf node_modules && npm install`
- Check Node version: `node --version` (should be 14+)

### Firebase connection issues
- Verify `firebaseConfig.js` credentials
- Check Firebase project is active in console
- Ensure authentication methods are enabled

### iOS build issues
- Run `pod install` in ios directory
- Update Xcode to latest version

## 🤝 Contributing

Contributions are welcome! Here's how to contribute:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the 0BSD License - see the LICENSE file for details.

## 🙋 Support

For support, email ryanvalencia709@gmail.com or open an issue on GitHub.

## 🔗 Links

- [Expo Documentation](https://docs.expo.dev)
- [React Native Docs](https://reactnative.dev)
- [Firebase Docs](https://firebase.google.com/docs)
