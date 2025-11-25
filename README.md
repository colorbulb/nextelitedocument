# NextDoc - Document Management Platform

A React-based document upload and management platform for organizing course materials with a hierarchical structure: **Course → Level → Lesson → Documents**.

## Features

- 📚 **Course Management**: Create and manage multiple courses
- 📊 **Level Organization**: Organize courses into different levels (e.g., Beginner, Intermediate, Advanced)
- 📝 **Lesson Structure**: Create lessons within each level
- 📎 **Document Upload**: Upload multiple documents per lesson with Firebase Storage
- 🎨 **Modern UI**: Beautiful, responsive interface with gradient designs matching NextElite styling
- 🔐 **Authentication**: Secure login with Firebase Authentication
- ☁️ **Cloud Storage**: Documents stored in Firebase Storage with download URLs

## Project Structure

```
nextdoc/
├── src/
│   ├── components/
│   │   ├── AdminDashboard.jsx      # Main dashboard component
│   │   ├── ClassCard.jsx            # Course card display
│   │   ├── ClassModal.jsx           # Create/Edit course modal
│   │   ├── LevelModal.jsx           # Create/Edit level modal
│   │   ├── LessonModal.jsx          # Create/Edit lesson modal
│   │   ├── LessonDocuments.jsx      # Document upload/management
│   │   └── Login.jsx                # Login component
│   ├── firebase/
│   │   └── config.js                # Firebase configuration
│   ├── App.jsx                      # Main app component
│   ├── main.jsx                     # Entry point
│   └── index.css                    # Global styles
├── package.json
├── vite.config.js
└── tailwind.config.js
```

## Firebase Structure

The app uses the following Firestore structure:

```
courses/
  {courseId}/
    - name: string
    - description: string
    - createdAt: timestamp
    levels/
      {levelId}/
        - name: string
        - description: string
        - createdAt: timestamp
        lessons/
          {lessonId}/
            - name: string
            - description: string
            - lessonNumber: string
            - createdAt: timestamp
            - documents: array
              - id: string
              - name: string
              - type: string
              - size: number
              - url: string
              - path: string
              - uploadedAt: timestamp
```

Documents are stored in Firebase Storage at:
```
courses/{courseId}/{levelId}/{lessonId}/{timestamp}_{filename}
```

## Installation

1. Install dependencies:
```bash
npm install
```

2. The Firebase configuration is already set up in `src/firebase/config.js`. Make sure your Firebase project has:
   - Firestore Database enabled
   - Firebase Storage enabled
   - Authentication enabled (Email/Password provider)

3. Run the development server:
```bash
npm run dev
```

4. Build for production:
```bash
npm run build
```

## Usage

1. **Login**: Use your Firebase Authentication credentials to log in
2. **Create Course**: Click "Create Course" to add a new course (e.g., "English Drama")
3. **Add Levels**: Select a course and click "Add Level" (e.g., "Beginner", "Intermediate", "Advanced")
4. **Create Lessons**: Select a level and click "Add Lesson" to create lessons (e.g., "Lesson 1", "Lesson 2", etc.)
5. **Upload Documents**: Select a lesson and upload multiple documents (PDFs, images, videos, etc.)
6. **Manage Documents**: View, download, or delete documents from each lesson

## Technologies

- **React 19**: UI framework
- **Vite**: Build tool and dev server
- **Tailwind CSS**: Styling
- **Firebase**:
  - Firestore: Database
  - Storage: File storage
  - Authentication: User management
- **Lucide React**: Icons

## Styling

The app uses the same styling approach as NextElite:
- Gradient backgrounds (purple to pink)
- Modern card-based UI
- Smooth animations and transitions
- Responsive design
- Custom scrollbars with gradient colors

## License

Private project

