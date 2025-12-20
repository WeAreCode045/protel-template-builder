```
react-odt-portal/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── FileUpload.tsx
│   │   │   ├── Editor. tsx
│   │   │   ├── Preview.tsx
│   │   │   ├── SplitView.tsx
│   │   │   ├── DownloadButton.tsx
│   │   │   ├── PlaceholderPanel.tsx
│   │   │   ├── DocumentList.tsx
│   │   │   ├── VersionHistory.tsx
│   │   │   └── admin/
│   │   │       ├── AdminDashboard.tsx
│   │   │       ├── PlaceholderManager.tsx
│   │   │       └── PlaceholderForm.tsx
│   │   ├── services/
│   │   │   ├── odtParser.ts
│   │   │   ├── placeholderService.ts
│   │   │   ├── documentService.ts
│   │   │   ├── versionService.ts
│   │   │   └── apiService. ts
│   │   ├── hooks/
│   │   │   ├── useAuth.ts
│   │   │   ├── usePlaceholders.ts
│   │   │   └── useDocuments.ts
│   │   ├── contexts/
│   │   │   └── AuthContext.tsx
│   │   ├── types/
│   │   │   └── index. ts
│   │   ├── App.tsx
│   │   └── main.tsx
│   └── package.json
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   │   ├── placeholderController.ts
│   │   │   ├── documentController.ts
│   │   │   ├── versionController.ts
│   │   │   └── authController.ts
│   │   ├── models/
│   │   │   ├── Placeholder.ts
│   │   │   ├── Document.ts
│   │   │   ├── Version.ts
│   │   │   └── User. ts
│   │   ├── routes/
│   │   │   ├── placeholders.ts
│   │   │   ├── documents.ts
│   │   │   ├── versions.ts
│   │   │   └── auth.ts
│   │   ├── middleware/
│   │   │   ├── auth.ts
│   │   │   └── adminAuth.ts
│   │   ├── config/
│   │   │   └── database.ts
│   │   ├── utils/
│   │   │   └── validators.ts
│   │   └── server.ts
│   ├── package.json
│   └── . env. example
└── README.md
```